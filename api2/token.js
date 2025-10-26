export default async function handler(req, res) {
  try {
    // Body auslesen (unabhängig ob JSON oder leer)
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { agentId } = body;
    if (!agentId) return res.status(400).json({ error: 'agentId fehlt' });

    // Create Web Call (v2)
    const r = await fetch('https://api.retell.ai/v2/create-web-call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ agent_id: agentId })
    });

    const data = await r.json().catch(() => null);
    if (!r.ok) {
      return res.status(r.status).json(data || { error: 'Unbekannter Fehler von Retell' });
    }

    const token = data?.access_token || data?.client_secret;
    if (!token) return res.status(502).json({ error: 'Kein Token erhalten' });

    return res.status(200).json({ token });
  } catch (error) {
    console.error('[API ERROR]', error);
    return res.status(500).json({ error: String(error) });
  }
}
