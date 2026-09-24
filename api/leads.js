const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
const SECRET = process.env.GOOGLE_APPS_SCRIPT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!GAS_URL || !SECRET) return res.status(500).json({ error: 'Backend environment variables are not configured.' });
  try {
    if (req.method === 'GET') {
      if (!ADMIN_PASSWORD || req.headers['x-admin-password'] !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid admin password.' });
      const url = GAS_URL + '?secret=' + encodeURIComponent(SECRET);
      const r = await fetch(url);
      const text = await r.text();
      if (!r.ok) return res.status(r.status).send(text);
      return res.status(200).send(text);
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    const body = req.body || {};
    if (!body.mobile || !body.shopName) return res.status(400).json({ error: 'Mobile number and shop name are required.' });
    if (!body.cardImage) return res.status(400).json({ error: 'Visiting card image is required.' });
    const payload = Object.assign({}, body, { secret: SECRET });
    const r = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).send(text);
    return res.status(200).send(text);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Backend request failed.' });
  }
}