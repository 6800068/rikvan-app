import React, { useState, useMemo, useRef } from 'react';
import {
  Camera,
  FileText,
  FileSpreadsheet,
  Compass,
  Share2,
  Sliders,
  Plus,
  RotateCcw,
  Trash2,
  ShoppingCart,
  Printer,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Send,
  Cpu,
  Calculator,
  Coins,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Package,
  Scissors,
  Layers,
} from 'lucide-react';

// ============================================================================
// 1. KATALOG MATERIÁLŮ A PROFILŮ (SJEDNOCENÉ BAREVNÉ ŠTÍTKY + ÚSPORNÝ TISK)
// ============================================================================

const MATERIALS = [
  {
    id: 'S235JR',
    shortLabel: 'S235JR',
    label: 'S235JR – Běžná ocel',
    badgeClass: 'bg-white text-slate-800 border-slate-300',
    printUnderline: '#cbd5e1',
    allowsExtra: true,
  },
  {
    id: 'S355J2',
    shortLabel: 'S355J2',
    label: 'S355J2 – Tvrdý materiál 355',
    badgeClass: 'bg-emerald-600 text-white border-emerald-700',
    printUnderline: '#16a34a',
    allowsExtra: true,
  },
  {
    id: 'P235GH',
    shortLabel: 'P235GH',
    label: 'Tlaková P235GH / P265GH – TR trubky',
    badgeClass: 'bg-amber-400 text-slate-950 border-amber-500',
    printUnderline: '#eab308',
    allowsExtra: false,
  },
  {
    id: 'NEREZ',
    shortLabel: 'Nerez',
    label: 'Nerez 1.4301 / 1.4404 / 1.4571',
    badgeClass: 'bg-blue-600 text-white border-blue-700',
    printUnderline: '#2563eb',
    allowsExtra: false,
  },
  {
    id: 'ZARUVZDORNA',
    shortLabel: 'Žáruvzdorná',
    label: 'Žáruvzdorná 1.4828 / 1.4841',
    badgeClass: 'bg-orange-500 text-white border-orange-600',
    printUnderline: '#ea580c',
    allowsExtra: false,
  },
  {
    id: 'HLINIK',
    shortLabel: 'Hliník',
    label: 'Hliník EN AW-6060 / 6082',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    printUnderline: '#64748b',
    allowsExtra: false,
  },
];

const MATERIAL_MAP = Object.fromEntries(MATERIALS.map((m) => [m.id, m]));

const L_ORIENTATIONS = [
  { id: 'up-back', label: 'L • nahoru vzadu' },
  { id: 'up-front', label: '⌋ • nahoru vpředu' },
  { id: 'down-back', label: 'Γ • dolů vzadu' },
  { id: 'down-front', label: '⅂ • dolů vpředu' },
];

const STEEL_PROFILES = [
  { name: 'IPE 80', kgPerM: 6.0, isRolled: true },
  { name: 'IPE 100', kgPerM: 8.1, isRolled: true },
  { name: 'IPE 120', kgPerM: 10.4, isRolled: true },
  { name: 'IPE 140', kgPerM: 12.9, isRolled: true },
  { name: 'IPE 160', kgPerM: 15.8, isRolled: true },
  { name: 'IPE 180', kgPerM: 18.8, isRolled: true },
  { name: 'IPE 200', kgPerM: 22.4, isRolled: true },
  { name: 'IPE 240', kgPerM: 30.7, isRolled: true },
  { name: 'HEA 100', kgPerM: 16.7, isRolled: true },
  { name: 'HEA 120', kgPerM: 19.9, isRolled: true },
  { name: 'HEA 140', kgPerM: 24.7, isRolled: true },
  { name: 'HEA 160', kgPerM: 30.4, isRolled: true },
  { name: 'HEB 120', kgPerM: 26.7, isRolled: true },
  { name: 'HEB 160', kgPerM: 42.6, isRolled: true },
  { name: 'UPN 80', kgPerM: 8.64, isRolled: true },
  { name: 'UPN 100', kgPerM: 10.6, isRolled: true },
  { name: 'UPN 120', kgPerM: 13.4, isRolled: true },
  { name: 'UPN 140', kgPerM: 16.0, isRolled: true },
  { name: 'UPE 120', kgPerM: 12.1, isRolled: true },
  { name: 'L 40x40x4', kgPerM: 2.42, isRolled: true },
  { name: 'L 50x50x5', kgPerM: 3.77, isRolled: true },
  { name: 'L 60x60x5', kgPerM: 4.57, isRolled: true },
  { name: 'L 60x60x6', kgPerM: 5.42, isRolled: true },
  { name: 'L 80x80x8', kgPerM: 9.63, isRolled: true },
  { name: 'Jekl 40x40x3', kgPerM: 3.45, isRolled: false },
  { name: 'Jekl 50x50x3', kgPerM: 4.39, isRolled: false },
  { name: 'Jekl 60x60x4', kgPerM: 6.85, isRolled: false },
  { name: 'Jekl 80x80x4', kgPerM: 9.36, isRolled: false },
  { name: 'Jekl 100x100x5', kgPerM: 14.4, isRolled: false },
  { name: 'Tr. Ø 48,3 x 3,2', kgPerM: 3.56, isRolled: false },
  { name: 'Tr. Ø 60,3 x 4', kgPerM: 5.55, isRolled: false },
  { name: 'Tr. Ø 60,3 x 5', kgPerM: 6.82, isRolled: false },
  { name: 'Tr. Ø 88,9 x 4', kgPerM: 8.38, isRolled: false },
  { name: 'Tr. Ø 114,3 x 5', kgPerM: 13.5, isRolled: false },
  { name: 'Tr. Ø 219,1 x 5', kgPerM: 26.4, isRolled: false },
  { name: 'Pl 20x2', kgPerM: 0.31, isRolled: false },
  { name: 'Pl 40x5', kgPerM: 1.57, isRolled: false },
  { name: 'Pl 50x8', kgPerM: 3.14, isRolled: false },
  { name: 'Pl 80x10', kgPerM: 6.28, isRolled: false },
  { name: 'Kulatina Ø 20', kgPerM: 2.47, isRolled: false },
];

const INITIAL_ITEMS = [
  {
    id: 'item-1',
    length: '1500',
    qty: '2',
    profile: 'IPE 140',
    material: 'S355J2',
    drawing: 'V-01',
    position: '1',
    angleNote: '12° /',
    note: 'Zabrousit',
    showHiddenEdge: true,
    lOrient: 'up-back',
  },
  {
    id: 'item-2',
    length: '1250',
    qty: '4',
    profile: 'L 60x60x5',
    material: 'S235JR',
    drawing: 'V-02',
    position: '2',
    angleNote: '30° /',
    note: '2× Ø 14 mm',
    showHiddenEdge: false,
    lOrient: 'up-back',
  },
  {
    id: 'item-3',
    length: '2200',
    qty: '3',
    profile: 'Tr. Ø 60,3 x 4',
    material: 'P235GH',
    drawing: 'V-04',
    position: '3',
    angleNote: '45° // 45°',
    note: 'Tlakové potrubí',
    showHiddenEdge: false,
    lOrient: 'up-back',
  },
  {
    id: 'item-4',
    length: '1000',
    qty: '5',
    profile: 'Pl 20x2',
    material: 'NEREZ',
    drawing: 'V-03',
    position: '4',
    angleNote: '',
    note: '22× Ø 10, 4× Ø 14',
    showHiddenEdge: false,
    lOrient: 'up-back',
  },
];

const PRODUCTION_API_URL = 'https://rikvan-app.vercel.app/api/analyze';

// ============================================================================
// 2. POMOCNÉ FUNKCE (VÁHA, PROFILY, KOMPRESE FOTEK, EXCEL SHEETJS, DXF)
// ============================================================================

function isLProfile(profileName) {
  return /^L\s*\d/i.test(String(profileName || '').trim());
}

function sanitizeNumericInput(raw, allowDecimal = false) {
  let cleaned = String(raw ?? '').replace(',', '.');
  cleaned = allowDecimal
    ? cleaned.replace(/[^0-9.]/g, '')
    : cleaned.replace(/[^0-9]/g, '');

  if (allowDecimal) {
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
  }

  if (cleaned.length > 1 && cleaned.startsWith('0') && !cleaned.startsWith('0.')) {
    cleaned = cleaned.replace(/^0+/, '') || '0';
  }
  return cleaned;
}

function toNum(val, fallback = 0) {
  const cleaned = String(val ?? '')
    .replace(/\s+/g, '')
    .replace(',', '.')
    .replace(/mm$/i, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function formatKgCz(val) {
  return Number(val || 0)
    .toFixed(1)
    .replace('.', ',');
}

function getProfileWeightPerM(profileName, materialId = 'S235JR') {
  const exact = STEEL_PROFILES.find(
    (p) => p.name.toLowerCase() === String(profileName || '').trim().toLowerCase()
  );
  const densityFactor = materialId === 'HLINIK' ? 2.7 / 7.85 : 1;
  if (exact) return Number((exact.kgPerM * densityFactor).toFixed(2));

  const s = String(profileName || '').replace(/,/g, '.');
  const tubeMatch = s.match(/(?:tr\.?|ø|d)\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  if (tubeMatch) {
    const d = parseFloat(tubeMatch[1]);
    const t = parseFloat(tubeMatch[2]);
    if (d > t && t > 0) {
      return Number(((d - t) * t * 0.0246615 * densityFactor).toFixed(2));
    }
  }
  const flatMatch = s.match(/pl\.?\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  if (flatMatch) {
    const w = parseFloat(flatMatch[1]);
    const t = parseFloat(flatMatch[2]);
    return Number((w * t * 0.00785 * densityFactor).toFixed(2));
  }
  const angleMatch = s.match(/^L\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  if (angleMatch) {
    const a = parseFloat(angleMatch[1]);
    const b = parseFloat(angleMatch[2]);
    const t = parseFloat(angleMatch[3]);
    return Number(((a + b - t) * t * 0.00785 * densityFactor).toFixed(2));
  }
  const jeklMatch = s.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  if (jeklMatch) {
    const a = parseFloat(jeklMatch[1]);
    const b = parseFloat(jeklMatch[2]);
    const t = parseFloat(jeklMatch[3]);
    const areaMm2 = 2 * t * (a + b - 2 * t);
    return Number((areaMm2 * 0.00785 * densityFactor).toFixed(2));
  }
  return Number((10.0 * densityFactor).toFixed(2));
}

function profileGetsAllowance(profileName, materialId) {
  const mat = MATERIAL_MAP[materialId];
  if (mat && !mat.allowsExtra) return false;
  const p = String(profileName || '').trim().toUpperCase();
  if (/^(TR\.?|PL\.?|JEKL|KUL|HRAN|Ø)/.test(p)) return false;
  const cat = STEEL_PROFILES.find((item) => item.name.toUpperCase() === p);
  if (cat) return cat.isRolled;
  return /^(IPE|HEA|HEB|HEM|UPN|UPE|L\s)/.test(p);
}

/** Zjistí bezpečnou absolutní URL pro AI API (opravuje chybu "Failed to parse URL from /api/analyze"). */
function resolveAnalyzeEndpoint() {
  if (typeof window === 'undefined') {
    return { url: PRODUCTION_API_URL, isPreviewSandbox: true };
  }
  const { protocol, origin, hostname } = window.location;
  const isNormalHttp = /^https?:$/i.test(protocol) && origin && origin !== 'null';
  const isSandboxHost =
    !isNormalHttp ||
    hostname.includes('google.com') ||
    hostname.includes('googleusercontent.com') ||
    hostname.includes('scf.usercontent.goog');

  if (isSandboxHost) {
    return { url: PRODUCTION_API_URL, isPreviewSandbox: true };
  }
  return { url: `${origin}/api/analyze`, isPreviewSandbox: false };
}

/** Zmenší fotku z mobilu i PC pod limit Vercelu (cca 250–400 KB, ostré písmo). */
function compressImageToBase64(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl.split(',')[1]);
      } catch {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Obrázek se nepodařilo zpracovat. Zkuste běžný formát JPG nebo PNG.'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          `Soubor „${file.name}“ nelze v prohlížeči otevřít jako obrázek (zkuste JPG nebo PNG místo RAW/HEIC).`
        )
      );
    };
    img.src = objectUrl;
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Nepodařilo se načíst soubor ze zařízení.'));
    reader.onload = () => {
      const res = String(reader.result || '');
      resolve(res.includes(',') ? res.split(',')[1] : res);
    };
    reader.readAsDataURL(file);
  });
}

/** Dynamicky načte knihovnu SheetJS (XLSX) pro spolehlivé čtení .xlsx a .xls přímo v prohlížeči. */
let sheetJsPromise = null;
function loadSheetJs() {
  if (typeof window !== 'undefined' && window.XLSX) {
    return Promise.resolve(window.XLSX);
  }
  if (!sheetJsPromise) {
    sheetJsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      script.async = true;
      script.onload = () => {
        if (window.XLSX) resolve(window.XLSX);
        else reject(new Error('Knihovna pro čtení Excelu se nenačetla správně.'));
      };
      script.onerror = () =>
        reject(new Error('Nepodařilo se načíst čtečku Excelu (zkontrolujte připojení k internetu).'));
      document.head.appendChild(script);
    });
  }
  return sheetJsPromise;
}

/** Přečte textový soubor (CSV/DXF) se správnou českou diakritikou (UTF-8 s fallbackem na Windows-1250). */
async function readTextSmart(file) {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  if (utf8.includes('\uFFFD')) {
    try {
      return new TextDecoder('windows-1250').decode(buf);
    } catch {
      return utf8;
    }
  }
  return utf8;
}

function detectMaterialId(rawMat) {
  const s = String(rawMat || '').toUpperCase().replace(/\s+/g, '');
  if (s.includes('355')) return 'S355J2';
  if (s.includes('P235') || s.includes('P265') || s.includes('TLAK')) return 'P235GH';
  if (
    s.includes('1.4301') ||
    s.includes('1,4301') ||
    s.includes('1.4404') ||
    s.includes('1,4404') ||
    s.includes('1.4571') ||
    s.includes('1,4571') ||
    s.includes('NEREZ') ||
    s.includes('304') ||
    s.includes('316')
  ) {
    return 'NEREZ';
  }
  if (s.includes('1.48') || s.includes('1,48') || s.includes('ZARU') || s.includes('ŽÁRU')) {
    return 'ZARUVZDORNA';
  }
  if (s.includes('AL') || s.includes('HLIN') || s.includes('6060') || s.includes('6082')) {
    return 'HLINIK';
  }
  return 'S235JR';
}

/** Extrahuje položky z 2D pole řádků (Excel .xlsx/.xls i CSV/TSV). */
function parseTabularRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  let headerRowIdx = -1;
  let colMap = {
    length: -1,
    qty: -1,
    profile: -1,
    material: -1,
    drawing: -1,
    position: -1,
    angle: -1,
    note: -1,
  };

  const scanLimit = Math.min(rows.length, 10);
  for (let r = 0; r < scanLimit; r++) {
    const cells = (rows[r] || []).map((c) => String(c ?? '').trim().toLowerCase());
    const found = { ...colMap };
    cells.forEach((cell, idx) => {
      if (!cell) return;
      if (found.length === -1 && /(d[eé]lk|length|rozm[eě]r|^l$|\(mm\)|l\s*max)/i.test(cell)) {
        found.length = idx;
      } else if (found.qty === -1 && /(po[cč]et|^ks$|kus|qty|mno[zž]stv)/i.test(cell)) {
        found.qty = idx;
      } else if (
        found.profile === -1 &&
        /(profil|pr[uů][rř]ez|materi[aá]l\s*\/\s*profil|polo[zž]ka\s*mat)/i.test(cell)
      ) {
        found.profile = idx;
      } else if (found.material === -1 && /(jakost|^mat\.?$|ocel|t[rř][ií]da)/i.test(cell)) {
        found.material = idx;
      } else if (found.drawing === -1 && /(v[yý]kres|drawing|^v[yý]k\.?$)/i.test(cell)) {
        found.drawing = idx;
      } else if (found.position === -1 && /(pozic|^pol\.?$|^pos\.?$)/i.test(cell)) {
        found.position = idx;
      } else if (found.angle === -1 && /([uú]hel|detail|sklon|vrt[aá]n)/i.test(cell)) {
        found.angle = idx;
      } else if (found.note === -1 && /(pozn[aá]mk|note|popis)/i.test(cell)) {
        found.note = idx;
      }
    });

    if (found.length !== -1 || (found.profile !== -1 && found.qty !== -1)) {
      headerRowIdx = r;
      colMap = found;
      break;
    }
  }

  const startIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
  const parsed = [];

  for (let r = startIdx; r < rows.length; r++) {
    const rawRow = (rows[r] || []).map((c) => String(c ?? '').trim());
    if (rawRow.every((c) => !c)) continue;

    let length = 0;
    let qty = 1;
    let profile = '';
    let materialRaw = '';
    let drawing = colMap.drawing >= 0 ? rawRow[colMap.drawing] || '' : '';
    let position = colMap.position >= 0 ? rawRow[colMap.position] || '' : '';
    let angleNote = colMap.angle >= 0 ? rawRow[colMap.angle] || '' : '';
    let note = colMap.note >= 0 ? rawRow[colMap.note] || '' : '';

    if (colMap.profile >= 0) profile = rawRow[colMap.profile] || '';
    if (colMap.material >= 0) materialRaw = rawRow[colMap.material] || '';

    const combinedCell = rawRow.find((c) => /-\s*\d{2,5}\s*$/.test(c));
    if (colMap.length >= 0 && rawRow[colMap.length]) {
      length = Math.round(toNum(rawRow[colMap.length], 0));
    } else if (combinedCell) {
      const m = combinedCell.match(/^(.*?)-\s*(\d{2,5})\s*$/);
      if (m) {
        if (!profile) profile = m[1].trim();
        length = Math.round(toNum(m[2], 0));
      }
    }

    if (length <= 0) {
      const nums = rawRow.map((c) => toNum(c, NaN));
      const lenIdx = nums.findIndex((n) => n >= 30 && n <= 20000);
      if (lenIdx !== -1) {
        length = Math.round(nums[lenIdx]);
        if (colMap.qty === -1) {
          const guessedQty = nums.find(
            (n, i) => i !== lenIdx && n >= 1 && n <= 1000 && Number.isInteger(n)
          );
          if (guessedQty) qty = guessedQty;
        }
      }
    }

    if (colMap.qty >= 0 && rawRow[colMap.qty]) {
      const q = Math.round(toNum(rawRow[colMap.qty], 1));
      if (q > 0) qty = q;
    }

    if (!profile) {
      profile =
        rawRow.find((c) =>
          /(IPE|HEA|HEB|HEM|UPN|UPE|JEKL|TR\.|PL\.?\s*\d|L\s*\d|Ø\s*\d|KUL)/i.test(c)
        ) || 'IPE 140';
    }
    if (!materialRaw) {
      materialRaw =
        rawRow.find((c) => /(S235|S355|P235|P265|1[.,]4\d{3}|NEREZ|HLIN)/i.test(c)) || 'S235JR';
    }

    if (length >= 20 && length <= 25000 && qty > 0) {
      parsed.push({
        id: `xls-${Date.now()}-${r}-${Math.random().toString(36).slice(2, 5)}`,
        length: String(length),
        qty: String(qty),
        profile: profile.trim(),
        material: detectMaterialId(materialRaw),
        drawing: drawing.trim(),
        position: position.trim() || String(parsed.length + 1),
        angleNote: angleNote.trim(),
        note: note.trim(),
        showHiddenEdge: false,
        lOrient: 'up-back',
      });
    }
  }

  return parsed;
}

// ============================================================================
// 3. OPTIMALIZAČNÍ MOTOR ŘEZÁNÍ (1D BIN PACKING)
// ============================================================================

function optimizeGroupBars({
  items,
  barLengthMm,
  kerfMm,
  trimMm,
  clampMm,
  guardClamp,
  addReserve,
  stockMinMm,
}) {
  const cuts = [];
  let maxLenItem = null;

  items.forEach((item) => {
    const len = toNum(item.length, 0);
    const qty = Math.max(0, Math.floor(toNum(item.qty, 0)));
    if (len <= 0 || qty <= 0) return;
    if (!maxLenItem || len > toNum(maxLenItem.length, 0)) {
      maxLenItem = item;
    }
    for (let i = 0; i < qty; i++) {
      cuts.push({
        length: len,
        drawing: item.drawing || '',
        position: item.position || '',
        angleNote: item.angleNote || '',
        note: item.note || '',
        showHiddenEdge: Boolean(item.showHiddenEdge),
        lOrient: item.lOrient || 'up-back',
      });
    }
  });

  if (addReserve && maxLenItem) {
    cuts.push({
      length: toNum(maxLenItem.length, 0),
      drawing: maxLenItem.drawing || 'REZ',
      position: 'REZ',
      angleNote: maxLenItem.angleNote || '',
      note: 'Rezervní kus (+1)',
      showHiddenEdge: Boolean(maxLenItem.showHiddenEdge),
      lOrient: maxLenItem.lOrient || 'up-back',
    });
  }

  cuts.sort((a, b) => b.length - a.length);

  const usableLength = Math.max(100, barLengthMm - trimMm - (guardClamp ? clampMm : 0));
  const bars = [];

  cuts.forEach((cut) => {
    let placed = false;
    for (const bar of bars) {
      const needed = bar.cuts.length === 0 ? cut.length : cut.length + kerfMm;
      if (bar.usedLength + needed <= usableLength) {
        bar.cuts.push(cut);
        bar.usedLength += needed;
        placed = true;
        break;
      }
    }
    if (!placed) {
      bars.push({
        index: bars.length + 1,
        barLengthMm,
        trimCut: trimMm,
        cuts: [cut],
        usedLength: cut.length,
      });
    }
  });

  return bars.map((bar) => {
    const cutCount = (bar.trimCut > 0 ? 1 : 0) + bar.cuts.length;
    const totalKerfMm = Math.max(0, bar.cuts.length - 1) * kerfMm;
    const pureCutsMm = bar.cuts.reduce((s, c) => s + c.length, 0);
    const remnantMm = Math.max(0, bar.barLengthMm - bar.trimCut - pureCutsMm - totalKerfMm);
    const isStockRemnant = remnantMm >= stockMinMm;

    const map = new Map();
    bar.cuts.forEach((c) => {
      map.set(c.length, (map.get(c.length) || 0) + 1);
    });
    const groupedCuts = Array.from(map.entries()).map(([length, count]) => ({
      length,
      count,
    }));

    return {
      ...bar,
      cutCount,
      totalKerfMm,
      pureCutsMm,
      remnantMm,
      isStockRemnant,
      groupedCuts,
    };
  });
}

// ============================================================================
// 4. UI KOMPONENTY (SJEDNOCENÝ ŠTÍTEK MATERIÁLU & ČISTÝ PŮDORYS VČ. L-PROFILŮ)
// ============================================================================

function MaterialBadge({ materialId, className = '' }) {
  const mat = MATERIAL_MAP[materialId] || MATERIALS[0];
  return (
    <span
      className={`inline-flex items-center justify-center w-[96px] h-6 px-1.5 rounded-md border text-[11px] font-bold tracking-tight whitespace-nowrap overflow-hidden shrink-0 select-none ${mat.badgeClass} ${className}`}
      title={mat.label}
    >
      {mat.shortLabel}
    </span>
  );
}

function AngleSvgPreview({ angleNote, showHiddenEdge, profile = '', lOrient = 'up-back' }) {
  const txt = String(angleNote || '').trim();
  if (!txt) return null;

  const isParallel = txt.includes('//');
  const isBackParallel = txt.includes('\\\\');
  const isTrapezoidA = txt.includes('/\\');
  const isTrapezoidV = txt.includes('\\/');
  const isSingleBackslash = !isParallel && !isBackParallel && !isTrapezoidA && !isTrapezoidV && txt.includes('\\');

  let topLeft = 6;
  let botLeft = 6;
  let topRight = 74;
  let botRight = 64;

  if (isParallel) {
    topLeft = 14;
    botLeft = 6;
    topRight = 74;
    botRight = 66;
  } else if (isBackParallel) {
    topLeft = 6;
    botLeft = 14;
    topRight = 66;
    botRight = 74;
  } else if (isTrapezoidA) {
    topLeft = 14;
    botLeft = 6;
    topRight = 66;
    botRight = 74;
  } else if (isTrapezoidV) {
    topLeft = 6;
    botLeft = 14;
    topRight = 74;
    botRight = 66;
  } else if (isSingleBackslash) {
    topLeft = 6;
    botLeft = 6;
    topRight = 64;
    botRight = 74;
  }

  const hasLeftCut = topLeft !== botLeft;
  const hasRightCut = topRight !== botRight;

  const isL = isLProfile(profile);
  let innerEdge = null;

  if (isL) {
    const ori = lOrient || 'up-back';
    const isUp = ori.startsWith('up');
    const isBack = ori.endsWith('back');
    const y = isBack ? 7 : 17;
    const xStart = isBack ? Math.max(topLeft, 6) : Math.max(botLeft, 6);
    const xEnd = isBack ? Math.min(topRight, 72) : Math.min(botRight, 72);

    innerEdge = (
      <line
        x1={xStart}
        y1={y}
        x2={xEnd}
        y2={y}
        stroke={isUp ? '#0f172a' : '#475569'}
        strokeWidth="1.3"
        strokeDasharray={isUp ? undefined : '3.5 2.5'}
      />
    );
  } else if (showHiddenEdge) {
    innerEdge = (
      <line
        x1={Math.max(topLeft, botLeft) + 2}
        y1="12"
        x2={Math.min(topRight, botRight) - 2}
        y2="12"
        stroke="#475569"
        strokeWidth="1.1"
        strokeDasharray="3 2"
      />
    );
  }

  return (
    <svg viewBox="0 0 80 24" className="w-[68px] h-5 shrink-0" aria-label="Nákres řezu v půdorysu">
      <polygon
        points={`${topLeft},3 ${topRight},3 ${botRight},21 ${botLeft},21`}
        fill="none"
        stroke="#0f172a"
        strokeWidth="1.3"
      />
      {innerEdge}
      {hasLeftCut && (
        <line x1={topLeft} y1="3" x2={botLeft} y2="21" stroke="#dc2626" strokeWidth="2" />
      )}
      {hasRightCut && (
        <line x1={topRight} y1="3" x2={botRight} y2="21" stroke="#dc2626" strokeWidth="2" />
      )}
    </svg>
  );
}

// ============================================================================
// 5. HLAVNÍ APLIKACE (DEFAULT EXPORT)
// ============================================================================

export default function App() {
  const [view, setView] = useState('editor');
  const [previewTab, setPreviewTab] = useState('both');
  const [workshopRowMode, setWorkshopRowMode] = useState('grouped'); // 'grouped' | 'single'
  const [isCncModalOpen, setIsCncModalOpen] = useState(false);

  // Nastavení zakázky, pily a cen
  const [orderNumber, setOrderNumber] = useState('ZAK-2026');

  const [kerfInput, setKerfInput] = useState('2');
  const [trimInput, setTrimInput] = useState('50');
  const [allowanceInput, setAllowanceInput] = useState('100');
  const [clampInput, setClampInput] = useState('80');
  const [stockMinInput, setStockMinInput] = useState('1000');

  const [price6mInput, setPrice6mInput] = useState('25');
  const [price12mInput, setPrice12mInput] = useState('28');
  const [price15mInput, setPrice15mInput] = useState('32');
  const [cutPriceInput, setCutPriceInput] = useState('15');

  const [guardClamp, setGuardClamp] = useState(false);
  const [addReserve, setAddReserve] = useState(false);

  const [items, setItems] = useState(INITIAL_ITEMS);
  const [groupBarLengths, setGroupBarLengths] = useState({});
  const [supplierNote, setSupplierNote] = useState(
    'Požadujeme atest 3.1 u materiálu S355J2 a tlakových trubek.'
  );
  const [checkedCuts, setCheckedCuts] = useState({});

  const [appendImports, setAppendImports] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const photoInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const excelInputRef = useRef(null);
  const dxfInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const kerfMm = toNum(kerfInput, 0);
  const trimMm = toNum(trimInput, 0);
  const allowanceMm = toNum(allowanceInput, 0);
  const clampMm = toNum(clampInput, 0);
  const stockMinMm = toNum(stockMinInput, 1000);
  const price6m = toNum(price6mInput, 0);
  const price12m = toNum(price12mInput, 0);
  const price15m = toNum(price15mInput, 0);
  const cutPrice = toNum(cutPriceInput, 0);

  // ============================================================================
  // VÝPOČET ŘEZNÉHO PLÁNU, SUMÁRA NÁKUPU A EKONOMIKY
  // ============================================================================

  const plan = useMemo(() => {
    const groupsMap = new Map();
    items.forEach((item) => {
      const profile = (item.profile || 'IPE 140').trim();
      const material = item.material || 'S235JR';
      const key = `${profile}__${material}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { key, profile, material, items: [] });
      }
      groupsMap.get(key).items.push(item);
    });

    const groups = [];
    let totalBars = 0;
    let totalBuyKg = 0;
    let totalPureKg = 0;
    let totalStockKg = 0;
    let totalScrapKg = 0;
    let totalCutsCount = 0;
    let totalMaterialCost = 0;

    groupsMap.forEach((g) => {
      const nominalMeters = groupBarLengths[g.key] || 6;
      const getsExtra = profileGetsAllowance(g.profile, g.material);
      const effectiveAllowance = getsExtra ? allowanceMm : 0;
      const actualBarMm = nominalMeters * 1000 + effectiveAllowance;
      const kgPerM = getProfileWeightPerM(g.profile, g.material);

      const bars = optimizeGroupBars({
        items: g.items,
        barLengthMm: actualBarMm,
        kerfMm,
        trimMm,
        clampMm,
        guardClamp,
        addReserve,
        stockMinMm,
      });

      if (bars.length === 0) return;

      const barCount = bars.length;
      const totalMeters = (barCount * actualBarMm) / 1000;
      const buyKg = totalMeters * kgPerM;
      const pureMm = bars.reduce((s, b) => s + b.pureCutsMm, 0);
      const pureKg = (pureMm / 1000) * kgPerM;
      const stockMm = bars.reduce((s, b) => s + (b.isStockRemnant ? b.remnantMm : 0), 0);
      const stockKg = (stockMm / 1000) * kgPerM;
      const scrapKg = Math.max(0, buyKg - pureKg - stockKg);
      const cutCount = bars.reduce((s, b) => s + b.cutCount, 0);

      const pricePerKg =
        nominalMeters === 15 ? price15m : nominalMeters === 12 ? price12m : price6m;
      const materialCost = buyKg * pricePerKg;

      totalBars += barCount;
      totalBuyKg += buyKg;
      totalPureKg += pureKg;
      totalStockKg += stockKg;
      totalScrapKg += scrapKg;
      totalCutsCount += cutCount;
      totalMaterialCost += materialCost;

      groups.push({
        ...g,
        nominalMeters,
        getsExtra,
        effectiveAllowance,
        actualBarMm,
        kgPerM,
        bars,
        barCount,
        totalMeters,
        buyKg,
        pureKg,
        stockKg,
        scrapKg,
        cutCount,
        pricePerKg,
        materialCost,
      });
    });

    const totalCutCost = totalCutsCount * cutPrice;
    const grandTotalCost = totalMaterialCost + totalCutCost;

    return {
      groups,
      totalBars,
      totalBuyKg,
      totalPureKg,
      totalStockKg,
      totalScrapKg,
      totalCutsCount,
      totalMaterialCost,
      totalCutCost,
      grandTotalCost,
    };
  }, [
    items,
    groupBarLengths,
    allowanceMm,
    kerfMm,
    trimMm,
    clampMm,
    guardClamp,
    addReserve,
    stockMinMm,
    price6m,
    price12m,
    price15m,
    cutPrice,
  ]);

  // Řádky pro úspornou dílenskou rozpisku (Sloučené vs. Po 1 ks)
  const workshopRows = useMemo(() => {
    const flatRows = [];
    plan.groups.forEach((g) => {
      g.bars.forEach((bar) => {
        if (workshopRowMode === 'single') {
          bar.cuts.forEach((cut, idx) => {
            const unitKg = (cut.length / 1000) * g.kgPerM;
            flatRows.push({
              rowKey: `${g.key}-b${bar.index}-s${idx}`,
              tyc: `#${bar.index}`,
              vyk: cut.drawing || '—',
              pol: cut.position || String(idx + 1),
              ks: 1,
              profile: g.profile,
              material: g.material,
              length: cut.length,
              angleNote: cut.angleNote,
              note: cut.note,
              showHiddenEdge: cut.showHiddenEdge,
              lOrient: cut.lOrient,
              rowKg: unitKg,
            });
          });
        } else {
          const groupedOnBar = new Map();
          bar.cuts.forEach((cut, idx) => {
            const sig = [
              cut.drawing || '',
              cut.position || '',
              cut.length,
              cut.angleNote || '',
              cut.note || '',
              cut.showHiddenEdge ? '1' : '0',
              cut.lOrient || 'up-back',
            ].join('|');

            if (groupedOnBar.has(sig)) {
              const existing = groupedOnBar.get(sig);
              existing.ks += 1;
              existing.rowKg += (cut.length / 1000) * g.kgPerM;
            } else {
              groupedOnBar.set(sig, {
                rowKey: `${g.key}-b${bar.index}-g${idx}`,
                tyc: `#${bar.index}`,
                vyk: cut.drawing || '—',
                pol: cut.position || String(idx + 1),
                ks: 1,
                profile: g.profile,
                material: g.material,
                length: cut.length,
                angleNote: cut.angleNote,
                note: cut.note,
                showHiddenEdge: cut.showHiddenEdge,
                lOrient: cut.lOrient,
                rowKg: (cut.length / 1000) * g.kgPerM,
              });
            }
          });
          groupedOnBar.forEach((r) => flatRows.push(r));
        }
      });
    });

    const totalQty = flatRows.reduce((s, r) => s + r.ks, 0);
    const totalKg = flatRows.reduce((s, r) => s + r.rowKg, 0);
    return { rows: flatRows, totalQty, totalKg };
  }, [plan.groups, workshopRowMode]);

  // ============================================================================
  // SPRÁVA POLOŽEK
  // ============================================================================

  const addItem = () => {
    setItems((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          length: '1000',
          qty: '1',
          profile: last?.profile || 'IPE 140',
          material: last?.material || 'S235JR',
          drawing: last?.drawing || '',
          position: String(prev.length + 1),
          angleNote: '',
          note: '',
          showHiddenEdge: false,
          lOrient: 'up-back',
        },
      ];
    });
  };

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const clearItems = () => {
    setItems([]);
    showToast('Seznam kusů byl vymazán.');
  };

  const appendAngleToken = (id, token) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const cur = (it.angleNote || '').trim();
        const next = cur ? `${cur} ${token}` : token;
        return { ...it, angleNote: next };
      })
    );
  };

  // ============================================================================
  // IMPORTY: FOTKY (AI), PDF (AI), EXCEL (.xlsx/.xls/.csv), AUTOCAD (.dxf)
  // ============================================================================

  const analyzeFileWithAI = async (base64Data, mimeType) => {
    const prompt = [
      'Jsi expert na čtení dílenských kusovníků a výkresů ocelových konstrukcí (včetně KOFING formátu).',
      'Extrahuj všechny položky pro řezání a vrať ČISTÉ JSON pole objektů bez jakéhokoliv dalšího textu:',
      '[{"length": 5154, "qty": 1, "profile": "Tr. Ø 219,1 x 5", "material": "1,4571", "drawing": "801", "position": "34", "angleNote": "6° /", "note": ""}]',
      'Pravidla: pokud je profil a délka v jednom sloupci oddělené pomlčkou (např. "Tr. Ø 219,1 x 5 - 5154"), rozděl profil na "Tr. Ø 219,1 x 5" a délku na 5154. Délku vždy uveď v mm jako číslo. Nerez 1,4571 / 1.4301 vždy zachovej.',
    ].join(' ');

    const { url, isPreviewSandbox } = resolveAnalyzeEndpoint();

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64Data } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });
    } catch {
      if (isPreviewSandbox) {
        throw new Error(
          'AI čtení fotek a PDF je potřeba spouštět na vaší živé adrese rikvan-app.vercel.app (zde v náhledu prohlížeč blokuje spojení na server). Excel a DXF fungují i zde.'
        );
      }
      throw new Error(
        'Nepodařilo se spojit se serverem pro AI čtení. Zkontrolujte prosím připojení k internetu.'
      );
    }

    if (!res.ok) {
      let errDetail = `Chyba serveru (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson?.error) errDetail = errJson.error;
      } catch {
        const txt = await res.text();
        if (txt) errDetail = txt.slice(0, 180);
      }
      throw new Error(errDetail);
    }

    const data = await res.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';
    const cleanedText = rawText.replace(/```json|```/gi, '').trim();

    let parsed = null;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    }

    const rows = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
      ? parsed.items
      : [];

    if (rows.length === 0) {
      throw new Error('Ze souboru se nepodařilo načíst žádné položky s délkou a počtem.');
    }

    const mapped = rows
      .filter((row) => toNum(row.length, 0) > 0 && toNum(row.qty, 0) > 0)
      .map((row, idx) => ({
        id: `ai-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
        length: String(Math.round(toNum(row.length, 0))),
        qty: String(Math.max(1, Math.round(toNum(row.qty, 1)))),
        profile: String(row.profile || 'IPE 140').trim(),
        material: detectMaterialId(row.material || 'S235JR'),
        drawing: String(row.drawing || '').trim(),
        position: String(row.position || idx + 1).trim(),
        angleNote: String(row.angleNote || '').trim(),
        note: String(row.note || '').trim(),
        showHiddenEdge: false,
        lOrient: 'up-back',
      }));

    if (mapped.length === 0) {
      throw new Error('AI načetla tabulku, ale nenašla žádné platné délky v mm.');
    }
    return mapped;
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setErrorMsg('');
    setIsImporting(true);
    const collected = [];

    try {
      for (let i = 0; i < files.length; i++) {
        setImportProgress(`Zpracovávám fotku ${i + 1} z ${files.length}…`);
        const base64 = await compressImageToBase64(files[i]);
        const extracted = await analyzeFileWithAI(base64, 'image/jpeg');
        collected.push(...extracted);
      }

      if (collected.length === 0) {
        setErrorMsg('Z vybraných fotografií se nepodařilo načíst žádné položky.');
      } else {
        setItems((prev) => (appendImports ? [...prev, ...collected] : collected));
        showToast(`Načteno ${collected.length} položek z ${files.length} fotek.`);
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Nepodařilo se přečíst fotografii.');
    } finally {
      setIsImporting(false);
      setImportProgress('');
    }
  };

  const handlePdfUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setErrorMsg('');
    setIsImporting(true);
    const collected = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setImportProgress(`Analyzuji PDF ${i + 1} z ${files.length}…`);
        if (file.size > 4.2 * 1024 * 1024) {
          throw new Error(
            `Soubor „${file.name}“ je větší než 4,2 MB. Zkuste vyfotit jednotlivé listy přes „Z fotek“.`
          );
        }
        const base64 = await fileToBase64(file);
        const extracted = await analyzeFileWithAI(base64, 'application/pdf');
        collected.push(...extracted);
      }

      setItems((prev) => (appendImports ? [...prev, ...collected] : collected));
      showToast(`Z PDF načteno ${collected.length} položek.`);
    } catch (err) {
      setErrorMsg(err?.message || 'Nepodařilo se přečíst PDF dokument.');
    } finally {
      setIsImporting(false);
      setImportProgress('');
    }
  };

  const handleExcelCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg('');
    setIsImporting(true);
    setImportProgress(`Načítám tabulku ${file.name}…`);

    try {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      let allRows = [];

      if (ext === 'xlsx' || ext === 'xls' || ext === 'ods') {
        const XLSX = await loadSheetJs();
        const arrayBuf = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuf, { type: 'array' });
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const sheetRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          allRows.push(...sheetRows);
        });
      } else {
        const text = await readTextSmart(file);
        allRows = text
          .split(/\r?\n/)
          .filter((l) => l.trim())
          .map((line) =>
            line.split(/[;\t,]/).map((c) => c.trim().replace(/^"|"$/g, ''))
          );
      }

      const parsed = parseTabularRows(allRows);
      if (parsed.length === 0) {
        setErrorMsg(
          'V tabulce Excel/CSV nebyly nalezeny platné řádky s délkou v mm (zkontrolujte, že soubor obsahuje číselné délky).'
        );
      } else {
        setItems((prev) => (appendImports ? [...prev, ...parsed] : parsed));
        showToast(`Z tabulky načteno ${parsed.length} položek.`);
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Nepodařilo se načíst soubor Excel/CSV.');
    } finally {
      setIsImporting(false);
      setImportProgress('');
    }
  };

  const handleDxfUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg('');
    setIsImporting(true);
    setImportProgress(`Čtu AutoCAD DXF ${file.name}…`);

    try {
      const text = await readTextSmart(file);
      const lines = text.split(/\r?\n/);
      const foundLengths = [];

      for (let i = 0; i < lines.length - 4; i++) {
        const token = lines[i].trim();

        if (token === 'LINE') {
          let x1 = 0;
          let y1 = 0;
          let x2 = 0;
          let y2 = 0;
          let hasCoords = false;
          for (let j = i + 1; j < Math.min(lines.length - 1, i + 30); j += 2) {
            const code = lines[j].trim();
            const val = parseFloat(lines[j + 1]);
            if (code === '0') break;
            if (code === '10') {
              x1 = val;
              hasCoords = true;
            }
            if (code === '20') y1 = val;
            if (code === '11') x2 = val;
            if (code === '21') y2 = val;
          }
          if (hasCoords) {
            const dist = Math.round(Math.hypot(x2 - x1, y2 - y1));
            if (dist >= 50 && dist <= 15000) foundLengths.push(dist);
          }
        } else if (token === 'DIMENSION') {
          for (let j = i + 1; j < Math.min(lines.length - 1, i + 40); j += 2) {
            const code = lines[j].trim();
            if (code === '0') break;
            if (code === '42') {
              const dimVal = Math.round(parseFloat(lines[j + 1]));
              if (dimVal >= 50 && dimVal <= 15000) foundLengths.push(dimVal);
            }
          }
        }
      }

      if (foundLengths.length === 0) {
        setErrorMsg(
          'V souboru DXF nebyly nalezeny žádné kóty ani úsečky délky 50–15 000 mm.'
        );
        return;
      }

      const grouped = new Map();
      foundLengths.forEach((l) => grouped.set(l, (grouped.get(l) || 0) + 1));

      const imported = Array.from(grouped.entries()).map(([len, qty], idx) => ({
        id: `dxf-${Date.now()}-${idx}`,
        length: String(len),
        qty: String(qty),
        profile: 'IPE 140',
        material: 'S235JR',
        drawing: file.name.replace(/\.dxf$/i, ''),
        position: String(idx + 1),
        angleNote: '',
        note: 'AutoCAD DXF',
        showHiddenEdge: false,
        lOrient: 'up-back',
      }));

      setItems((prev) => (appendImports ? [...prev, ...imported] : imported));
      showToast(`Z DXF načteno ${imported.length} unikátních délek.`);
    } catch {
      setErrorMsg('Nepodařilo se zpracovat DXF soubor.');
    } finally {
      setIsImporting(false);
      setImportProgress('');
    }
  };

  // ============================================================================
  // EXPORTY, SDÍLENÍ A ODESLÁNÍ PDF
  // ============================================================================

  const copyPurchaseSummary = () => {
    const lines = [
      `OBJEDNÁVKA MATERIÁLU – Zakázka ${orderNumber}`,
      '----------------------------------------',
      ...plan.groups.map(
        (g, idx) =>
          `${idx + 1}. ${g.profile} (${MATERIAL_MAP[g.material]?.shortLabel || g.material}) – ${g.barCount} ks × ${g.nominalMeters} m (${g.totalMeters.toFixed(1)} m / ${g.buyKg.toFixed(1)} kg)`
      ),
      '----------------------------------------',
      `CELKEM: ${plan.totalBars} ks tyčí • ${plan.totalBuyKg.toFixed(1)} kg`,
      supplierNote ? `Poznámka: ${supplierNote}` : '',
    ].filter(Boolean);

    navigator.clipboard?.writeText(lines.join('\n'));
    showToast('Objednávka zkopírována do schránky.');
  };

  const downloadFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPurchaseCsv = () => {
    const header = 'Profil;Jakost;Ks tyci;Delka tyce (m);Celkem (m);Hmotnost (kg);Cena (Kc)\n';
    const rows = plan.groups
      .map(
        (g) =>
          `${g.profile};${MATERIAL_MAP[g.material]?.shortLabel || g.material};${g.barCount};${g.nominalMeters};${g.totalMeters.toFixed(1)};${g.buyKg.toFixed(1)};${Math.round(g.materialCost)}`
      )
      .join('\n');
    downloadFile(
      `objednavka-${orderNumber || 'rikvan'}.csv`,
      '\uFEFF' + header + rows,
      'text/csv;charset=utf-8'
    );
    showToast('Soubor Excel CSV byl stažen.');
  };

  const exportCncFile = (format) => {
    const flatCuts = [];
    plan.groups.forEach((g) => {
      g.bars.forEach((b) => {
        b.cuts.forEach((c, idx) => {
          flatCuts.push({
            zakazka: orderNumber,
            profil: g.profile,
            jakost: MATERIAL_MAP[g.material]?.shortLabel || g.material,
            tycCislo: b.index,
            delkaTyceMm: b.barLengthMm,
            rezPoradi: idx + 1,
            delkaKusuMm: c.length,
            vykres: c.drawing,
            pozice: c.position,
            uhel: c.angleNote,
            polohaL: isLProfile(g.profile) ? c.lOrient : '',
            poznamka: c.note,
          });
        });
      });
    });

    if (format === 'json') {
      downloadFile(
        `cnc-plan-${orderNumber}.json`,
        JSON.stringify(flatCuts, null, 2),
        'application/json'
      );
    } else if (format === 'csv') {
      const head =
        'Zakazka;Profil;Jakost;Tyc;DelkaTyce_mm;Poradi;DelkaKusu_mm;Vykres;Pozice;Uhel;PolohaL;Poznamka\n';
      const body = flatCuts
        .map(
          (r) =>
            `${r.zakazka};${r.profil};${r.jakost};${r.tycCislo};${r.delkaTyceMm};${r.rezPoradi};${r.delkaKusuMm};${r.vykres};${r.pozice};${r.uhel};${r.polohaL};${r.poznamka}`
        )
        .join('\n');
      downloadFile(`cnc-plan-${orderNumber}.csv`, '\uFEFF' + head + body, 'text/csv;charset=utf-8');
    } else {
      const txt = flatCuts
        .map(
          (r) =>
            `TYČ #${r.tycCislo} (${r.profil} ${r.jakost}) -> ${r.delkaKusuMm} mm | ${r.vykres}/${r.pozice} ${r.uhel} ${r.poznamka}`
        )
        .join('\n');
      downloadFile(`cnc-plan-${orderNumber}.txt`, txt, 'text/plain;charset=utf-8');
    }
    showToast(`CNC soubor (${format.toUpperCase()}) byl vygenerován.`);
    setIsCncModalOpen(false);
  };

  const handlePrintA4 = () => {
    window.print();
  };

  const handleShareOrPdf = async (sectionLabel = 'Dílenský plán') => {
    const summaryText = [
      `RIKVAN Řezný Plán – ${sectionLabel} (${orderNumber})`,
      `Tyčí k nákupu: ${plan.totalBars} ks (${plan.totalBuyKg.toFixed(1)} kg)`,
      `Celkem řezů: ${plan.totalCutsCount}×`,
      `Odhad nákladů: ${Math.round(plan.grandTotalCost).toLocaleString('cs-CZ')} Kč`,
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `RIKVAN – ${sectionLabel} (${orderNumber})`,
          text: summaryText,
        });
        return;
      } catch {
        // Uživatel sdílení zavřel – otevře se tisk / uložení do PDF
      }
    }
    handlePrintA4();
  };

  const todayFormatted = new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date());

  // ============================================================================
  // 6. NÁHLED TISKU A4 (ÚSPORNÁ DÍLENSKÁ ROZPISKA + OPTIMALIZOVANÉ TISKOVÉ CSS)
  // ============================================================================

  if (view === 'print') {
    const showPurchase = previewTab === 'both' || previewTab === 'purchase';
    const showWorkshop = previewTab === 'both' || previewTab === 'workshop';
    const showEconomy = previewTab === 'both' || previewTab === 'economy';

    const pdfBtnColor =
      previewTab === 'purchase'
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
        : previewTab === 'economy'
        ? 'bg-slate-900 hover:bg-slate-800 text-white'
        : 'bg-indigo-600 hover:bg-indigo-700 text-white';

    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 pb-12 print:bg-white print:pb-0">
        {/* Pravidla pro čistý, úsporný tisk na A4 (na šířku pro 10 sloupců rozpisky) */}
        <style>{`
          @media print {
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            html, body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .print-sheet-break {
              break-before: page;
              page-break-before: always;
            }
          }
        `}</style>

        {/* Kompaktní horní lišta (při tisku skrytá) */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-3 py-2 print:hidden shadow-sm">
          <div className="max-w-5xl mx-auto space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <button
                onClick={() => setView('editor')}
                className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Zpět
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    handleShareOrPdf(
                      previewTab === 'purchase'
                        ? 'Objednávka'
                        : previewTab === 'economy'
                        ? 'Ekonomika'
                        : 'Rozpiska řezání'
                    )
                  }
                  className={`h-8 px-3 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-sm ${pdfBtnColor}`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Odeslat PDF
                </button>
                <button
                  onClick={handlePrintA4}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  Tisk A4
                </button>
                <button
                  onClick={() => setIsCncModalOpen(true)}
                  className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  CNC
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                { id: 'both', label: 'Vše' },
                { id: 'purchase', label: 'Objednávka' },
                { id: 'workshop', label: 'Dílna' },
                { id: 'economy', label: 'Ekonomika' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPreviewTab(tab.id)}
                  className={`h-7 rounded-md text-xs font-bold transition ${
                    previewTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto p-3 sm:p-5 space-y-5 print:max-w-none print:p-0 print:space-y-0">
          {/* 1. OBJEDNÁVKA MATERIÁLU */}
          {showPurchase && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 print:border-0 print:rounded-none print:shadow-none print:p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-slate-900">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                    OBJEDNÁVKA MATERIÁLU – {orderNumber}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sumárum hutního materiálu k objednání u dodavatele • {todayFormatted}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    onClick={copyPurchaseSummary}
                    className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Kopírovat
                  </button>
                  <button
                    onClick={exportPurchaseCsv}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto print:overflow-visible mt-3">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-[11px] uppercase text-slate-600">
                      <th className="py-2 pr-2">#</th>
                      <th className="py-2 pr-2">Profil &amp; Jakost</th>
                      <th className="py-2 pr-2">Objednat</th>
                      <th className="py-2 pr-2 text-right">Celkem m</th>
                      <th className="py-2 text-right">Hmotnost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {plan.groups.map((g, idx) => {
                      const mat = MATERIAL_MAP[g.material] || MATERIALS[0];
                      return (
                        <tr key={g.key}>
                          <td className="py-2 pr-2 text-slate-500 font-semibold whitespace-nowrap">
                            {idx + 1}.
                          </td>
                          <td className="py-2 pr-2 whitespace-nowrap">
                            <span className="font-bold text-slate-900">{g.profile}</span>
                            <span
                              className="ml-2 inline-block px-1 font-extrabold text-[11px] text-slate-900"
                              style={{ borderBottom: `2.5px solid ${mat.printUnderline}` }}
                            >
                              {mat.shortLabel}
                            </span>
                          </td>
                          <td className="py-2 pr-2 whitespace-nowrap">
                            <span className="font-extrabold text-slate-900">
                              {g.barCount} ks × {g.nominalMeters} m
                            </span>
                            <span className="text-[11px] text-slate-500 ml-1.5">
                              {g.getsExtra
                                ? `(+${g.effectiveAllowance} mm)`
                                : '(přesná délka)'}
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-right font-semibold whitespace-nowrap">
                            {g.totalMeters.toFixed(1).replace('.', ',')} m
                          </td>
                          <td className="py-2 text-right font-bold text-slate-900 whitespace-nowrap">
                            {formatKgCz(g.buyKg)} kg
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 print:bg-white print:rounded-none flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-900">
                <span>CELKEM K OBJEDNÁNÍ ({plan.groups.length} položek)</span>
                <span>
                  {plan.totalBars} ks tyčí • {formatKgCz(plan.totalBuyKg)} kg
                </span>
              </div>

              <div className="mt-4">
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                  Poznámka pro dodavatele (atest, doprava, termín)
                </label>
                <textarea
                  rows={2}
                  value={supplierNote}
                  onChange={(e) => setSupplierNote(e.target.value)}
                  placeholder="Např. Požadujeme atest 3.1..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 print:hidden"
                />
                {supplierNote && (
                  <p className="hidden print:block text-sm text-slate-800 font-medium whitespace-pre-wrap">
                    {supplierNote}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* 2. ÚSPORNÁ DÍLENSKÁ ROZPISKA (SCHVÁLENÝ ČISTÝ DESIGN) */}
          {showWorkshop && (
            <section
              className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 print:border-0 print:rounded-none print:shadow-none print:p-0 ${
                showPurchase ? 'print-sheet-break' : ''
              }`}
            >
              {/* Světlý panel akcí a přepínání řádků (jen na obrazovce, netiskne se) */}
              <div className="mb-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 print:hidden">
                <button
                  onClick={handlePrintA4}
                  className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  Tisk A4
                </button>

                <div className="flex items-center gap-2">
                  <div className="inline-flex bg-slate-100 border border-slate-200 p-0.5 rounded-lg">
                    <button
                      onClick={() => setWorkshopRowMode('grouped')}
                      className={`h-7 px-2.5 rounded-md text-xs font-bold transition ${
                        workshopRowMode === 'grouped'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sloučené kusy
                    </button>
                    <button
                      onClick={() => setWorkshopRowMode('single')}
                      className={`h-7 px-2.5 rounded-md text-xs font-bold transition ${
                        workshopRowMode === 'single'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Po 1 ks
                    </button>
                  </div>

                  <button
                    onClick={() => handleShareOrPdf('Rozpiska řezání')}
                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Odeslat PDF
                  </button>
                </div>
              </div>

              {/* Kompaktní tisková hlavička: jen Rozpiska řezání, Zakázka a Datum */}
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 mb-2.5 border-b-2 border-slate-900">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-600">
                    Rozpiska řezání
                  </span>
                  <span className="text-xl font-black text-slate-900 tracking-tight">
                    {orderNumber}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  {todayFormatted}
                </span>
              </div>

              {/* Úsporná dílenská tabulka bez barevných ploch a bez lámání písmen */}
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full border-collapse border-y-2 border-slate-900 text-[13px] bg-white">
                  <thead>
                    <tr className="border-b-[1.5px] border-slate-900 text-[11px] font-extrabold uppercase tracking-wide text-slate-700 bg-white">
                      <th className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                        Tyč
                      </th>
                      <th className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                        Vyk.
                      </th>
                      <th className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                        Pol.
                      </th>
                      <th className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                        KS
                      </th>
                      <th className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                        Materiál – Délka (mm)
                      </th>
                      <th className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                        Mat.
                      </th>
                      <th className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                        Detail
                      </th>
                      <th className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                        Poznámka
                      </th>
                      <th className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                        Hmotnost
                      </th>
                      <th className="py-1.5 px-2 text-center whitespace-nowrap">OK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workshopRows.rows.map((r, idx) => {
                      const prev = idx > 0 ? workshopRows.rows[idx - 1] : null;
                      const isNewMaterialGroup =
                        prev && (prev.material !== r.material || prev.profile !== r.profile);
                      const mat = MATERIAL_MAP[r.material] || MATERIALS[0];
                      const isDone = Boolean(checkedCuts[r.rowKey]);

                      return (
                        <tr
                          key={r.rowKey}
                          className={`bg-white ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'} ${
                            isNewMaterialGroup
                              ? 'border-t-2 border-t-slate-700 print:border-t-slate-950'
                              : 'border-t border-t-slate-200'
                          }`}
                        >
                          <td className="py-1.5 px-2 text-center font-extrabold border-r border-slate-200 whitespace-nowrap">
                            {r.tyc}
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                            {r.vyk}
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold border-r border-slate-200 whitespace-nowrap">
                            {r.pol}
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold border-r border-slate-200 whitespace-nowrap">
                            {r.ks}
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                            <span className="font-semibold">{r.profile}</span>
                            <span className="mx-1.5 text-slate-400">–</span>
                            <span className="font-extrabold text-[14px]">{r.length}</span>
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                            <span
                              className="inline-block px-1 pb-0.5 text-xs font-extrabold leading-tight"
                              style={{ borderBottom: `2.5px solid ${mat.printUnderline}` }}
                            >
                              {mat.shortLabel}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                            <div className="inline-flex items-center justify-center gap-1.5">
                              {r.angleNote && (
                                <span className="font-bold text-xs min-w-[36px] text-right">
                                  {r.angleNote}
                                </span>
                              )}
                              <AngleSvgPreview
                                angleNote={r.angleNote}
                                showHiddenEdge={r.showHiddenEdge}
                                profile={r.profile}
                                lOrient={r.lOrient}
                              />
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-xs text-slate-700 border-r border-slate-200 whitespace-nowrap">
                            {r.note}
                          </td>
                          <td className="py-1.5 px-2 text-right font-semibold border-r border-slate-200 whitespace-nowrap">
                            {formatKgCz(r.rowKg)} kg
                          </td>
                          <td className="py-1.5 px-2 text-center whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() =>
                                setCheckedCuts((prev) => ({
                                  ...prev,
                                  [r.rowKey]: !prev[r.rowKey],
                                }))
                              }
                              className="w-4 h-4 cursor-pointer accent-slate-900"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-[1.5px] border-slate-900 bg-white font-extrabold text-xs">
                      <td
                        colSpan={3}
                        className="py-2 px-2 text-center border-r border-slate-200 whitespace-nowrap"
                      >
                        CELKEM
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                        {workshopRows.totalQty}
                      </td>
                      <td
                        colSpan={4}
                        className="py-2 px-2 font-semibold text-slate-600 border-r border-slate-200 whitespace-nowrap"
                      >
                        Délky = vnější rozměr L max
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 whitespace-nowrap">
                        {formatKgCz(workshopRows.totalKg)} kg
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {/* 3. EKONOMICKÁ REKAPITULACE */}
          {showEconomy && (
            <section
              className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 print:border-0 print:rounded-none print:shadow-none print:p-0 ${
                showPurchase || showWorkshop ? 'print-sheet-break' : ''
              }`}
            >
              <div className="pb-3 border-b-2 border-slate-900">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  EKONOMICKÁ REKAPITULACE – {orderNumber}
                </h2>
                <p className="text-xs text-slate-600">
                  Ceny: 6 m = {price6m} Kč/kg • 12 m = {price12m} Kč/kg • 15 m = {price15m}{' '}
                  Kč/kg • 1 řez = {cutPrice} Kč
                </p>
              </div>

              <div className="overflow-x-auto print:overflow-visible mt-3">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-[11px] uppercase text-slate-600">
                      <th className="py-2 pr-2">Profil &amp; Jakost</th>
                      <th className="py-2 pr-2 text-right">Nákup kg</th>
                      <th className="py-2 pr-2 text-right">Kč/kg</th>
                      <th className="py-2 text-right">Cena materiálu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {plan.groups.map((g) => {
                      const mat = MATERIAL_MAP[g.material] || MATERIALS[0];
                      return (
                        <tr key={g.key}>
                          <td className="py-2 pr-2 whitespace-nowrap">
                            <span className="font-bold text-slate-900">{g.profile}</span>
                            <span
                              className="ml-2 inline-block px-1 font-extrabold text-[11px] text-slate-900"
                              style={{ borderBottom: `2.5px solid ${mat.printUnderline}` }}
                            >
                              {mat.shortLabel}
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-right font-semibold whitespace-nowrap">
                            {formatKgCz(g.buyKg)} kg
                          </td>
                          <td className="py-2 pr-2 text-right text-slate-600 whitespace-nowrap">
                            {g.pricePerKg} Kč
                          </td>
                          <td className="py-2 text-right font-bold text-slate-900 whitespace-nowrap">
                            {Math.round(g.materialCost).toLocaleString('cs-CZ')} Kč
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 print:bg-white print:rounded-none">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Materiál</div>
                  <div className="text-base font-extrabold text-slate-900">
                    {Math.round(plan.totalMaterialCost).toLocaleString('cs-CZ')} Kč
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 print:bg-white print:rounded-none">
                  <div className="text-[11px] font-bold uppercase text-slate-500">
                    Řezání ({plan.totalCutsCount}×)
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    {Math.round(plan.totalCutCost).toLocaleString('cs-CZ')} Kč
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 text-white print:bg-white print:text-slate-900 print:border-2 print:border-slate-900 print:rounded-none">
                  <div className="text-[11px] font-bold uppercase text-amber-300 print:text-slate-600">
                    Celkem zakázka
                  </div>
                  <div className="text-lg font-extrabold">
                    {Math.round(plan.grandTotalCost).toLocaleString('cs-CZ')} Kč
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 7. HLAVNÍ EDITOR APLIKACE
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-14">
      {/* Skryté file inputy optimalizované pro PC i Android / iOS */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePhotoUpload}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={handlePdfUpload}
      />
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.tsv,.txt,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain"
        className="hidden"
        onChange={handleExcelCsvUpload}
      />
      <input
        ref={dxfInputRef}
        type="file"
        accept=".dxf,.DXF,application/dxf,application/octet-stream,text/plain"
        className="hidden"
        onChange={handleDxfUpload}
      />

      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-3 sm:px-5 pt-4 space-y-4">
        {/* HLAVIČKA A IMPORTY */}
        <header className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-sm">
                <svg viewBox="0 0 36 36" className="w-7 h-7">
                  <path
                    d="M9 8h18M9 28h18M18 8v20"
                    stroke="#f8fafc"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="8"
                    y1="24"
                    x2="28"
                    y2="12"
                    stroke="#f97316"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 truncate">
                  RIKVAN Řezný Plán
                </h1>
                <p className="text-xs text-slate-500 truncate">
                  Import PDF / Excel / AutoCAD (DXF), sumárum nákupu &amp; CNC export
                </p>
              </div>
            </div>

            <button
              onClick={() => handleShareOrPdf('Přehled zakázky')}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              Sdílet
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              disabled={isImporting}
              onClick={() => photoInputRef.current?.click()}
              className="h-9 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Camera className="w-4 h-4 shrink-0" />
              Z fotek (i více)
            </button>
            <button
              disabled={isImporting}
              onClick={() => pdfInputRef.current?.click()}
              className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <FileText className="w-4 h-4 shrink-0" />
              Z PDF
            </button>
            <button
              disabled={isImporting}
              onClick={() => excelInputRef.current?.click()}
              className="h-9 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              Z Excelu
            </button>
            <button
              disabled={isImporting}
              onClick={() => dxfInputRef.current?.click()}
              className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              AutoCAD (DXF)
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={appendImports}
                onChange={(e) => setAppendImports(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span>Připojovat další fotky / listy k seznamu (nemazat stávající)</span>
            </label>
            <span className="text-[11px] text-slate-400">
              V galerii lze vybrat i 6+ fotek najednou
            </span>
          </div>

          {isImporting && (
            <div className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              {importProgress || 'Zpracovávám soubor…'}
            </div>
          )}

          {errorMsg && (
            <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg('')}
                className="text-rose-500 hover:text-rose-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </header>

        {/* KARTA: NASTAVENÍ ZAKÁZKY, PILY A CEN */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Nastavení zakázky, pily a cen
              </h2>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label
                htmlFor="order-number-input"
                className="text-[10px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap"
              >
                Číslo zakázky
              </label>
              <input
                id="order-number-input"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ZAK-2026"
                className="flex-1 sm:w-44 h-8 px-3 rounded-lg border border-slate-200 bg-slate-50 font-extrabold text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            <div className="lg:col-span-6 rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 inline-flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-slate-500" />
                  Parametry pily a skladu
                </span>
                <span className="text-[10px] font-semibold text-slate-400">v mm</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Prořez', value: kerfInput, setter: setKerfInput, width: 'w-[74px]' },
                  { label: 'Ořez čela', value: trimInput, setter: setTrimInput, width: 'w-[78px]' },
                  {
                    label: 'Přídavek',
                    value: allowanceInput,
                    setter: setAllowanceInput,
                    width: 'w-[78px]',
                  },
                  { label: 'Svěrák', value: clampInput, setter: setClampInput, width: 'w-[74px]' },
                  {
                    label: 'Sklad od',
                    value: stockMinInput,
                    setter: setStockMinInput,
                    width: 'w-[86px]',
                  },
                ].map((field) => (
                  <div key={field.label} className={field.width}>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5 truncate">
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={field.value}
                        onChange={(e) => field.setter(sanitizeNumericInput(e.target.value, true))}
                        placeholder="0"
                        className="w-full h-8 pl-2 pr-6 rounded-lg border border-slate-200 bg-white text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 pointer-events-none">
                        mm
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 border-t border-slate-200/70 text-xs text-slate-700">
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    checked={guardClamp}
                    onChange={(e) => setGuardClamp(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-indigo-600"
                  />
                  Hlídat svěrák v plánu
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    checked={addReserve}
                    onChange={(e) => setAddReserve(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-indigo-600"
                  />
                  Přidat rezervu (+1 nejdelší kus)
                </label>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-xl bg-amber-50/90 border-2 border-amber-300 p-3 flex flex-col justify-between gap-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-amber-950 inline-flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-600" />
                  Ceník materiálu a řezání
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 text-[10px] font-extrabold">
                  Kč / kg • Kč / řez
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Tyč 6 m', unit: 'Kč/kg', value: price6mInput, setter: setPrice6mInput },
                  {
                    label: 'Tyč 12 m',
                    unit: 'Kč/kg',
                    value: price12mInput,
                    setter: setPrice12mInput,
                  },
                  {
                    label: 'Tyč 15 m',
                    unit: 'Kč/kg',
                    value: price15mInput,
                    setter: setPrice15mInput,
                  },
                  { label: '1 řez', unit: 'Kč', value: cutPriceInput, setter: setCutPriceInput },
                ].map((priceField) => (
                  <div key={priceField.label}>
                    <label className="block text-[10px] font-extrabold uppercase text-amber-900 mb-0.5">
                      {priceField.label}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={priceField.value}
                        onChange={(e) =>
                          priceField.setter(sanitizeNumericInput(e.target.value, true))
                        }
                        placeholder="0"
                        className="w-full h-8 pl-2 pr-10 rounded-lg border border-amber-300 bg-white text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-amber-700 pointer-events-none">
                        {priceField.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-amber-200/80 text-[11px] font-bold text-amber-950">
                <span>Odhad celkové ceny zakázky:</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {Math.round(plan.grandTotalCost).toLocaleString('cs-CZ')} Kč
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* KARTA: POŽADOVANÉ KUSY */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Požadované kusy ({items.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={addItem}
                className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Přidat kus
              </button>
              <button
                onClick={clearItems}
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Vymazat
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
              Zatím tu nejsou žádné kusy. Přidejte položku ručně nebo nahrajte fotku / PDF / Excel.
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const getsExtra = profileGetsAllowance(item.profile, item.material);
                const itemIsL = isLProfile(item.profile);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5"
                  >
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                          #{idx + 1} Délka
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.length}
                          onChange={(e) =>
                            updateItem(item.id, 'length', sanitizeNumericInput(e.target.value))
                          }
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white font-extrabold text-xs sm:text-sm text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                          Počet
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(item.id, 'qty', sanitizeNumericInput(e.target.value))
                          }
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white font-extrabold text-xs sm:text-sm text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-3">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                          Profil
                        </label>
                        <input
                          type="text"
                          list="steel-profiles-list"
                          value={item.profile}
                          onChange={(e) => updateItem(item.id, 'profile', e.target.value)}
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="col-span-10 sm:col-span-4">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                          Druh materiálu
                        </label>
                        <select
                          value={item.material}
                          onChange={(e) => updateItem(item.id, 'material', e.target.value)}
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {MATERIALS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                        <button
                          onClick={() => removeItem(item.id)}
                          title="Odstranit kus"
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4 sm:col-span-4">
                        <input
                          type="text"
                          value={item.drawing}
                          onChange={(e) => updateItem(item.id, 'drawing', e.target.value)}
                          placeholder="Výkres (např. V-01)"
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-3">
                        <input
                          type="text"
                          value={item.position}
                          onChange={(e) => updateItem(item.id, 'position', e.target.value)}
                          placeholder="Pol."
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-center text-slate-800"
                        />
                      </div>
                      <div className="col-span-5 sm:col-span-5 flex items-center justify-end gap-2 min-w-0 overflow-hidden">
                        <MaterialBadge materialId={item.material} />
                        <span className="hidden sm:inline text-[11px] text-slate-500 truncate">
                          {getsExtra ? `+${allowanceMm} mm tyč` : 'přesná tyč'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-5 flex flex-wrap items-center gap-1">
                        {['°', '/', '\\', '//', '\\\\', '/\\', '\\/', 'Ø '].map((tok) => (
                          <button
                            key={tok}
                            type="button"
                            onClick={() => appendAngleToken(item.id, tok)}
                            className={`h-7 px-2 rounded-md border text-[11px] font-bold transition ${
                              tok === 'Ø '
                                ? 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {tok === 'Ø ' ? 'Ø Díra' : tok}
                          </button>
                        ))}
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={item.angleNote}
                          onChange={(e) => updateItem(item.id, 'angleNote', e.target.value)}
                          placeholder="Úhel (např. 45° // 45°)"
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={item.note}
                          onChange={(e) => updateItem(item.id, 'note', e.target.value)}
                          placeholder="Poznámka / vrtání"
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
                        />
                      </div>
                    </div>

                    {item.angleNote && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/70">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Náhled (půdorys):
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px]">
                            {item.angleNote}
                          </span>
                          <AngleSvgPreview
                            angleNote={item.angleNote}
                            showHiddenEdge={item.showHiddenEdge}
                            profile={item.profile}
                            lOrient={item.lOrient}
                          />
                        </div>

                        {itemIsL ? (
                          <div className="flex flex-wrap items-center gap-1 bg-slate-100 border border-slate-200 p-0.5 rounded-lg">
                            {L_ORIENTATIONS.map((ori) => (
                              <button
                                key={ori.id}
                                type="button"
                                onClick={() => updateItem(item.id, 'lOrient', ori.id)}
                                className={`h-6 px-2 rounded-md text-[11px] font-bold transition ${
                                  (item.lOrient || 'up-back') === ori.id
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {ori.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(item.id, 'showHiddenEdge', !item.showHiddenEdge)
                            }
                            className="h-7 px-2.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold inline-flex items-center gap-1.5"
                          >
                            {item.showHiddenEdge ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                                Skrytá hrana (přeruš.)
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-amber-400" />
                                Plná čára (hrana nahoru)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <datalist id="steel-profiles-list">
            {STEEL_PROFILES.map((p) => (
              <option key={p.name} value={p.name} />
            ))}
          </datalist>
        </section>

        {/* SOUHRNNÉ KPI KARTY & SUMÁRUM */}
        {plan.groups.length > 0 && (
          <>
            <section className="rounded-2xl bg-slate-900 text-white p-4 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">K nákupu</div>
                  <div className="text-sm sm:text-base font-extrabold mt-0.5">
                    {plan.totalBars} tyčí • {formatKgCz(plan.totalBuyKg)} kg
                  </div>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Čistá váha</div>
                  <div className="text-sm sm:text-base font-extrabold text-emerald-400 mt-0.5">
                    {formatKgCz(plan.totalPureKg)} kg
                  </div>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Sklad / Šrot
                  </div>
                  <div className="text-sm sm:text-base font-extrabold mt-0.5">
                    <span className="text-teal-300">{formatKgCz(plan.totalStockKg)}</span>
                    {' / '}
                    <span className="text-rose-400">{formatKgCz(plan.totalScrapKg)} kg</span>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Počet řezů</div>
                  <div className="text-sm sm:text-base font-extrabold text-amber-300 mt-0.5">
                    {plan.totalCutsCount}× ({Math.round(plan.totalCutCost)} Kč)
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Sumárum pro nákup (Objednávka tyčí)
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      Změna délky 6 / 12 / 15 m níže se ihned promítne sem
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={copyPurchaseSummary}
                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Kopírovat
                  </button>
                  <button
                    onClick={exportPurchaseCsv}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Excel CSV
                  </button>
                  <button
                    onClick={() => {
                      setPreviewTab('purchase');
                      setView('print');
                    }}
                    className="h-8 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    PDF list
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto px-4 py-2">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                      <th className="py-2 pr-2">Profil &amp; Jakost</th>
                      <th className="py-2 pr-2">Objednat tyčí</th>
                      <th className="py-2 pr-2 text-right">Celkem m</th>
                      <th className="py-2 text-right">Hmotnost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {plan.groups.map((g) => (
                      <tr key={g.key}>
                        <td className="py-2.5 pr-2">
                          <div className="font-extrabold text-slate-900">{g.profile}</div>
                          <div className="mt-1">
                            <MaterialBadge materialId={g.material} />
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Tyč {g.nominalMeters} m{' '}
                            {g.getsExtra
                              ? `+ ${g.effectiveAllowance} mm přídavek (${g.actualBarMm} mm)`
                              : `přesná délka (${g.actualBarMm} mm)`}
                          </div>
                        </td>
                        <td className="py-2.5 pr-2 whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs">
                            {g.barCount} ks × {g.nominalMeters} m
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 text-right font-bold text-slate-700 whitespace-nowrap">
                          {g.totalMeters.toFixed(1).replace('.', ',')} m
                        </td>
                        <td className="py-2.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                          {formatKgCz(g.buyKg)} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-2.5 bg-emerald-50/70 border-t border-emerald-100 flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-900">
                <span>CELKEM K NÁKUPU</span>
                <span className="text-emerald-700">
                  {plan.totalBars} ks tyčí • {formatKgCz(plan.totalBuyKg)} kg
                </span>
              </div>
            </section>

            {/* NÁŘEZOVÉ PLÁNY SKUPIN */}
            <section className="space-y-3">
              {plan.groups.map((g) => (
                <div
                  key={g.key}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span className="font-extrabold text-slate-900">{g.profile}</span>
                      <MaterialBadge materialId={g.material} />
                      <span className="text-xs text-slate-500">
                        {g.kgPerM} kg/m • {g.barCount} tyčí ({formatKgCz(g.buyKg)} kg)
                      </span>
                    </div>

                    <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                      {[6, 12, 15].map((lenM) => (
                        <button
                          key={lenM}
                          onClick={() =>
                            setGroupBarLengths((prev) => ({ ...prev, [g.key]: lenM }))
                          }
                          className={`h-7 px-2.5 rounded-md text-xs font-bold transition ${
                            g.nominalMeters === lenM
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {lenM} m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {g.bars.map((bar) => (
                      <div
                        key={bar.index}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                          <span className="font-extrabold text-slate-900">
                            Tyč #{bar.index} ({bar.barLengthMm} mm)
                          </span>
                          <span
                            className={`font-bold ${
                              bar.isStockRemnant ? 'text-teal-700' : 'text-rose-600'
                            }`}
                          >
                            {bar.isStockRemnant ? 'Skladový zbytek' : 'Odpad'}: {bar.remnantMm} mm
                          </span>
                        </div>

                        <div className="h-7 w-full rounded-lg overflow-hidden bg-slate-200 flex border border-slate-300">
                          {bar.trimCut > 0 && (
                            <div
                              style={{ width: `${(bar.trimCut / bar.barLengthMm) * 100}%` }}
                              className="bg-amber-300 border-r border-white/60"
                              title={`Ořez čela ${bar.trimCut} mm`}
                            />
                          )}
                          {bar.cuts.map((c, idx) => (
                            <div
                              key={idx}
                              style={{ width: `${(c.length / bar.barLengthMm) * 100}%` }}
                              className="bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-r border-white/70 truncate px-1"
                              title={`${c.length} mm (${c.drawing}/${c.position})`}
                            >
                              {c.length}
                            </div>
                          ))}
                          {bar.remnantMm > 0 && (
                            <div
                              style={{ width: `${(bar.remnantMm / bar.barLengthMm) * 100}%` }}
                              className={`text-[10px] font-bold flex items-center justify-center truncate px-1 ${
                                bar.isStockRemnant
                                  ? 'bg-teal-100 text-teal-900'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {bar.remnantMm}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span>
                            Kusy:{' '}
                            <strong className="text-slate-800">
                              {bar.groupedCuts
                                .map((gc) => `${gc.count}× ${gc.length} mm`)
                                .join(' + ')}
                            </strong>
                          </span>
                          <span>
                            {bar.trimCut > 0 ? `Ořez čela: ${bar.trimCut} mm • ` : ''}
                            Prořez: {bar.totalKerfMm} mm ({bar.cutCount} řezů)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => {
                  setPreviewTab('purchase');
                  setView('print');
                }}
                className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                Objednávka materiálu (PDF)
              </button>
              <button
                onClick={() => {
                  setPreviewTab('workshop');
                  setView('print');
                }}
                className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4 shrink-0" />
                Dílenská rozpiska A4 a kalkulace
              </button>
              <button
                onClick={() => setIsCncModalOpen(true)}
                className="h-11 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4 shrink-0" />
                Export CNC (USB / LAN)
              </button>
            </section>
          </>
        )}
      </div>

      {/* CNC EXPORT MODAL */}
      {isCncModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Export řezného plánu pro CNC
                </h3>
              </div>
              <button
                onClick={() => setIsCncModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Vyberte formát souboru pro přenos na automatickou pilu nebo do dílenského PC:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => exportCncFile('csv')}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Stáhnout CSV (Excel / pily Bomar, Pilous)
              </button>
              <button
                onClick={() => exportCncFile('txt')}
                className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Stáhnout TXT (přehledový seznam řezů)
              </button>
              <button
                onClick={() => exportCncFile('json')}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs inline-flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4" />
                Stáhnout JSON (datová integrace)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
