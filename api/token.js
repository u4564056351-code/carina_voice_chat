// api/token.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Body sicher parsen
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    let body = {};
    try { body = JSON.parse(raw || '{}'); } catch {}
    const { agentId } = body;

    if (!agentId) return res.status(400).json({ error: 'agentId fehlt' });

    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'RETELL_API_KEY fehlt (ENV)' });

    // WICHTIG: richtige Domain!
    const upstream = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ agent_id: agentId })
    });

    const text = await upstream.text(); // für bessere Fehlersicht
    let data = null; try { data = JSON.parse(text); } catch { /* text bleibt text */ }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'Upstream error',
        status: upstream.status,
        details: data || text || null
      });
    }

    const token = (data && (data.access_token || data.client_secret)) || null;
    if (!token) return res.status(502).json({ error: 'Kein Token von Retell erhalten', details: data });

    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', details: String(err) });
  }
}
