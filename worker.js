export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/leads") {
      return handleLeads(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleLeads(request, env) {
  const scriptUrl = env.GOOGLE_APPS_SCRIPT_URL;
  const secret = env.GOOGLE_APPS_SCRIPT_SECRET;

  if (!scriptUrl || !secret) {
    return Response.json(
      { error: "Cloud storage is not configured yet." },
      { status: 500 }
    );
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      body.secret = secret;

      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      return normalizeUpstreamResponse(response, "Google Apps Script");
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  }

  if (request.method === "GET") {
    if (request.headers.get("x-admin-password") !== env.ADMIN_PASSWORD) {
      return Response.json({ error: "Invalid admin password." }, { status: 401 });
    }

    try {
      const response = await fetch(
        scriptUrl + "?action=list&secret=" + encodeURIComponent(secret)
      );

      return normalizeUpstreamResponse(response, "Google Apps Script");
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

async function normalizeUpstreamResponse(response, serviceName) {
  const text = await response.text();
  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    // The upstream should return JSON. Keep the raw body out of the response
    // because it may contain HTML, account information, or other sensitive data.
  }

  if (!response.ok) {
    console.error(serviceName + " returned a non-2xx response", {
      status: response.status,
      contentType: response.headers.get("content-type")
    });

    const contentType = response.headers.get("content-type") || "";
    const looksLikeHtml =
      contentType.includes("text/html") ||
      /<html|sign in|accounts\.google\.com/i.test(text);

    return Response.json(
      {
        error: looksLikeHtml
          ? serviceName + " is not publicly accessible. Check the Web App access setting."
          : serviceName + " returned HTTP " + response.status + "."
      },
      { status: 502 }
    );
  }

  if (!data) {
    console.error(serviceName + " returned a non-JSON response", {
      status: response.status,
      contentType: response.headers.get("content-type")
    });

    return Response.json(
      { error: serviceName + " returned a non-JSON response. Check the Web App deployment." },
      { status: 502 }
    );
  }

  if (data.ok === false) {
    console.error(serviceName + " rejected the request", {
      error: data.error || "Unknown upstream error"
    });

    return Response.json(
      { error: data.error || serviceName + " rejected the request." },
      { status: 502 }
    );
  }

  return Response.json(data, { status: 200 });
}
