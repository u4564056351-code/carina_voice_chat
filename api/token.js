// api/token.js  (Vercel Node Function)
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Body robust parsen
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const { agentId } = JSON.parse(raw || '{}');
    if (!agentId) return res.status(400).json({ error: 'agentId fehlt' });

    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server misconfigured: RETELL_API_KEY fehlt' });

    // Retell: Web-Call erstellen (v2)
    const upstream = await fetch('https://api.retell.ai/v2/create-web-call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ agent_id: agentId })
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return res.status(upstream.status).json(data || { error: 'Upstream-Fehler' });
    }

    const token = data?.access_token || data?.client_secret;
    if (!token) return res.status(502).json({ error: 'Kein Token von Retell' });

    return res.status(200).json({ token });
  } catch (err) {
    console.error('[token] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
