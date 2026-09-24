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

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = { ok: response.ok, raw: text };
      }

      return Response.json(data, { status: response.ok ? 200 : 502 });
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

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = { ok: response.ok, raw: text };
      }

      return Response.json(data, { status: response.ok ? 200 : 502 });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
