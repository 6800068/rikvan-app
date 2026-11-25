export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Na serveru Vercel chybí nastavený GEMINI_API_KEY.' });
  }

  try {
    const payload = req.body;
    // Aktuální podporované modely Gemini API (Free Tier) s automatickou zálohou
    const models = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
    const errors = [];

    for (const model of models) {
      const apiUrl =
        'https://generativelanguage.googleapis.com/v1beta/models/' +
        model +
        ':generateContent?key=' +
        apiKey;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      } else {
        const errText = await response.text();
        errors.push('Model ' + model + ': ' + response.status + ' - ' + errText);
      }
    }

    return res.status(502).json({
      error: errors[0] || 'Nepodařilo se spojit s Gemini AI.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
