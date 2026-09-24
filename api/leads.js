export default async function handler(req, res) {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET;
  if (!scriptUrl || !secret) return res.status(500).json({error:'Cloud storage is not configured yet.'});
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      body.secret = secret;
      const r = await fetch(scriptUrl, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
      const text = await r.text(); let data; try{data=JSON.parse(text)}catch{data={ok:r.ok,raw:text}};
      return res.status(r.ok?200:502).json(data);
    } catch(e){ return res.status(500).json({error:e.message}); }
  }
  if (req.method === 'GET') {
    if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) return res.status(401).json({error:'Invalid admin password.'});
    try {
      const r = await fetch(scriptUrl+'?action=list&secret='+encodeURIComponent(secret), {method:'GET'});
      const text = await r.text(); let data; try{data=JSON.parse(text)}catch{data={ok:r.ok,raw:text}};
      return res.status(r.ok?200:502).json(data);
    } catch(e){ return res.status(500).json({error:e.message}); }
  }
  return res.status(405).json({error:'Method not allowed'});
}
