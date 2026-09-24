export async function onRequest(context) {
  const { request, env } = context;
  const scriptUrl = env.GOOGLE_APPS_SCRIPT_URL;
  const secret = env.GOOGLE_APPS_SCRIPT_SECRET;
  if (!scriptUrl || !secret) return Response.json({ error: 'Cloud storage is not configured yet.' }, { status: 500 });

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      body.secret = secret;
      const r = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const text = await r.text();
      let data; try { data = JSON.parse(text); } catch { data = { ok: r.ok, raw: text }; }
      return Response.json(data, { status: r.ok ? 200 : 502 });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  if (request.method === 'GET') {
    if (request.headers.get('x-admin-password') !== env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Invalid admin password.' }, { status: 401 });
    }
    try {
      const r = await fetch(scriptUrl + '?action=list&secret=' + encodeURIComponent(secret));
      const text = await r.text();
      let data; try { data = JSON.parse(text); } catch { data = { ok: r.ok, raw: text }; }
      return Response.json(data, { status: r.ok ? 200 : 502 });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
