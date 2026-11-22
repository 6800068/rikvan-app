function validateBetaKey(inputKey) {
  const rawList = process.env.BETA_KEYS || '';
  if (!rawList.trim()) {
    return {
      valid: false,
      code: 'NOT_CONFIGURED',
      message: 'Na serveru Vercel zatím není nastavena proměnná BETA_KEYS.'
    };
  }

  const normalizedInput = String(inputKey || '').trim().toUpperCase();
  if (!normalizedInput) {
    return { valid: false, code: 'EMPTY', message: 'Zadejte prosím svůj přístupový klíč.' };
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
        return {
          valid: true,
          keyName: keyPart,
          permanent: true,
          expiresAt: null
        };
      }

      let isoDate = null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(expiryPart)) {
        isoDate = expiryPart;
      } else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(expiryPart)) {
        const [d, m, y] = expiryPart.split('.');
        isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }

      if (!isoDate) {
        return {
          valid: false,
          code: 'INVALID_DATE',
          message: 'Neplatný formát data u klíče. Použijte RRRR-MM-DD (např. 2026-12-15).'
        };
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
          message: 'Zkušební beta přístup skončil. Pro pokračování nebo plnou verzi kontaktujte RIKVAN.'
        };
      }

      return {
        valid: true,
        keyName: keyPart,
        permanent: false,
        expiresAt: isoDate
      };
    }
  }

  return {
    valid: false,
    code: 'INVALID',
    message: 'Neplatný přístupový klíč nebo byl přístup odebrán.'
  };
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method not allowed' });
  }

  const key = req.body?.key || req.headers['x-beta-key'] || '';
  const result = validateBetaKey(key);

  if (!result.valid) {
    const status = result.code === 'NOT_CONFIGURED' ? 500 : 401;
    return res.status(status).json(result);
  }

  return res.status(200).json(result);
}
