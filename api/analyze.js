function validateBetaKey(inputKey) {
  const rawList = process.env.BETA_KEYS || '';
  if (!rawList.trim()) {
    return {
      valid: false,
      code: 'NOT_CONFIGURED',
      message: 'Na serveru Vercel chybí nastavená proměnná BETA_KEYS.'
    };
  }

  const normalizedInput = String(inputKey || '').trim().toUpperCase();
  if (!normalizedInput) {
    return { valid: false, code: 'EMPTY', message: 'Chybí přístupový beta klíč.' };
  }

  const entries = rawList
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const colonIdx = entry.indexOf(':');
    const keyPart = (colonIdx === -1 ? entry : entry.slice(0, colonIdx)).trim().toUpperCase();
    const expiryPart = (colonIdx === -1 ? 'TRVALY' : entry.slice(colonIdx + 1)).trim().toUpperCase();

    if (keyPart && keyPart === normalizedInput) {
      if (
        !expiryPart ||
        expiryPart === 'TRVALY' ||
        expiryPart === 'TRVALÝ' ||
        expiryPart === 'PERMANENT' ||
        expiryPart === 'ADMIN'
      ) {
        return { valid: true };
      }

      let isoDate = null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(expiryPart)) {
        isoDate = expiryPart;
      } else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(expiryPart)) {
        const parts = expiryPart.split('.');
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2];
        isoDate = y + '-' + m + '-' + d;
      }

      if (!isoDate) {
        return { valid: false, code: 'INVALID_DATE', message: 'Neplatný formát data u klíče.' };
      }

      const todayPrague = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Prague',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());

      if (todayPrague > isoDate) {
        return {
          valid: false,
          code: 'EXPIRED',
          message: 'Zkušební beta přístup skončil. Pro pokračování kontaktujte RIKVAN.'
        };
      }

      return { valid: true };
    }
  }

  return {
    valid: false,
    code: 'INVALID',
    message: 'Neplatný přístupový klíč nebo byl přístup odebrán.'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Kontrola platnosti Beta klíče na serveru
  const betaKey = req.headers['x-beta-key'] || '';
  const authCheck = validateBetaKey(betaKey);
  if (!authCheck.valid) {
    return res.status(401).json({ error: authCheck.message, code: authCheck.code });
  }

  // 2. Kontrola Gemini API klíče
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Na serveru Vercel chybí nastavený GEMINI_API_KEY.' });
  }

  try {
    const payload = req.body;
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError = null;

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
        lastError = 'Model ' + model + ': ' + response.status + ' - ' + errText;
      }
    }

    return res.status(502).json({ error: lastError || 'Nepodařilo se spojit s Gemini AI.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
