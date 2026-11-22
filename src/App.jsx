import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Camera,
  FileText,
  FileSpreadsheet,
  Compass,
  Plus,
  Trash2,
  RotateCcw,
  Printer,
  Share2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Package,
  Calculator,
  BarChart3,
  Award,
  Cpu,
  HardDrive,
  Wifi,
  Download,
  Send,
  Copy,
  Check,
  AlertTriangle,
  X,
  FolderOpen,
  Lock,
  LogOut,
  ShieldCheck,
  KeyRound,
  ShoppingCart
} from 'lucide-react';

// ============================================================================
// BEZPEČNÉ ULOŽENÍ BETA KLÍČE V COOKIE (BEZ POUŽITÍ LOCALSTORAGE)
// ============================================================================
function saveBetaKeyCookie(key) {
  try {
    document.cookie = `rikvan_beta_key=${encodeURIComponent(key)}; max-age=2592000; path=/; SameSite=Lax`;
  } catch {
    // Bezpečný fallback v sandboxu
  }
}

function loadBetaKeyCookie() {
  try {
    const match = document.cookie.match(/(?:^|;\s*)rikvan_beta_key=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
  } catch {
    return '';
  }
}

function clearBetaKeyCookie() {
  try {
    document.cookie = 'rikvan_beta_key=; max-age=0; path=/; SameSite=Lax';
  } catch {
    // Bezpečný fallback v sandboxu
  }
}

function isPreviewEnvironment() {
  if (typeof window === 'undefined') return true;
  const href = window.location.href || '';
  return (
    href.includes('googleusercontent') ||
    href.includes('about:srcdoc') ||
    href.startsWith('blob:') ||
    href.startsWith('data:')
  );
}

// ============================================================================
// DRUHY MATERIÁLU (BAREVNÉ ZNAČENÍ + PŘÍDAVEK TYČE + HUSTOTA)
// ============================================================================
const MATERIAL_GRADES = [
  {
    id: 'S235JR',
    label: 'S235JR – Běžná ocel (Bílá)',
    shortLabel: 'S235JR',
    colorName: 'Bílá',
    dotClass: 'bg-white border-2 border-slate-500',
    badgeClass: 'bg-white text-slate-900 border-2 border-slate-400',
    hasSteelAllowance: true,
    densityFactor: 1.0,
    note: 'Běžná konstrukční ocel 235 (válcované profily +100 mm; trubky/kulatina/hranol/jekl +0 mm)'
  },
  {
    id: 'S355J2',
    label: 'S355J2 – Tvrdý materiál 355 (Zelená)',
    shortLabel: 'S355J2',
    colorName: 'Zelená',
    dotClass: 'bg-green-600 border border-green-800',
    badgeClass: 'bg-green-600 text-white border border-green-700',
    hasSteelAllowance: true,
    densityFactor: 1.0,
    note: 'Tvrdá / vysokopevnostní ocel 355 (válcované profily +100 mm; trubky/kulatina/hranol/jekl +0 mm)'
  },
  {
    id: '1.4301 (Nerez)',
    label: 'Nerez 1.4301 / 1.4404 (Modrá)',
    shortLabel: 'Nerez',
    colorName: 'Modrá',
    dotClass: 'bg-blue-600 border border-blue-800',
    badgeClass: 'bg-blue-600 text-white border border-blue-700',
    hasSteelAllowance: false,
    densityFactor: 1.01,
    note: 'Nerezová ocel – vždy přesná délka bez přídavku'
  },
  {
    id: 'P235GH (Tlaková)',
    label: 'Tlaková P235GH / P265GH – TR trubky (Žlutá)',
    shortLabel: 'Tlaková P235GH',
    colorName: 'Žlutá',
    dotClass: 'bg-yellow-400 border border-yellow-600',
    badgeClass: 'bg-yellow-300 text-slate-950 border border-yellow-500',
    hasSteelAllowance: true,
    densityFactor: 1.0,
    note: 'Tlaková / kotlová ocel – TR trubky bez přídavku'
  },
  {
    id: '16Mo3 (Žáruvzdorná)',
    label: 'Žáruvzdorná 16Mo3 / 13CrMo4-5 – TR trubky (Oranžová)',
    shortLabel: 'Žáruvzdorná',
    colorName: 'Oranžová',
    dotClass: 'bg-orange-500 border border-orange-700',
    badgeClass: 'bg-orange-500 text-white border border-orange-700',
    hasSteelAllowance: true,
    densityFactor: 1.0,
    note: 'Žáruvzdorná ocel 16Mo3 – TR trubky bez přídavku'
  },
  {
    id: 'AlMgSi0.5 (Hliník)',
    label: 'Hliník AlMgSi0.5 (Stříbrná)',
    shortLabel: 'Hliník',
    colorName: 'Stříbrná',
    dotClass: 'bg-slate-300 border border-slate-500',
    badgeClass: 'bg-slate-200 text-slate-900 border border-slate-400',
    hasSteelAllowance: false,
    densityFactor: 0.344,
    note: 'Hliníkový profil – vždy přesná délka bez přídavku'
  }
];

function getGradeInfo(gradeId) {
  return MATERIAL_GRADES.find((g) => g.id === gradeId) || MATERIAL_GRADES[0];
}

// Pravidlo hutního přídavku (+100 mm):
// Trubky, kulatina, hranol (čtyřhran/šestihran), jekl, nerez, hliník apod. jsou BEZ přídavku (0 mm).
// Přídavek +100 mm mají pouze válcované ocelové profily (IPE, HEA, HEB, UPN, L, Pl).
function hasRollingAllowance(profileName = '', gradeId = 'S235JR') {
  const grade = getGradeInfo(gradeId);
  if (!grade.hasSteelAllowance) return false;

  const norm = String(profileName || '').trim().toUpperCase();
  if (
    /^TR\.?\b/.test(norm) ||
    norm.startsWith('TRUBK') ||
    /^KUL\.?\b/.test(norm) ||
    norm.startsWith('KULAT') ||
    /^(HRANOL|[ČC]T\.?|[ČC]TY[ŘR]HRAN|4HR|6HR|[ŠS]ESTIHRAN)\b/.test(norm) ||
    norm.startsWith('JEKL') ||
    norm.startsWith('JACKL')
  ) {
    return false;
  }

  return true;
}

function MaterialBadge({ gradeId, compact = false }) {
  const g = getGradeInfo(gradeId);
  return (
    <span
      title={g.note}
      className={`inline-flex items-center gap-1.5 rounded-md font-extrabold whitespace-nowrap ${g.badgeClass} ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      }`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${g.dotClass}`} />
      <span>{g.shortLabel}</span>
      <span className="opacity-85 font-bold">({g.colorName})</span>
    </span>
  );
}

// ============================================================================
// KATALOG PROFILŮ A HMOTNOSTÍ DLE VELKOSKLADŮ (EN 10056 / EN 10058 / EN 10365, kg/m)
// ============================================================================
const PROFILE_CATALOG = [
  // Plochá ocel / Plocháč (Pl) dle EN 10058
  { name: 'Pl 20x2', weight: 0.314, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 20x3', weight: 0.471, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 20x4', weight: 0.628, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 20x5', weight: 0.785, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 25x4', weight: 0.785, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 30x4', weight: 0.942, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 30x5', weight: 1.18, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 40x4', weight: 1.26, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 40x5', weight: 1.57, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 40x8', weight: 2.51, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 50x5', weight: 1.96, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 50x8', weight: 3.14, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 50x10', weight: 3.93, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 60x6', weight: 2.83, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 60x10', weight: 4.71, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 80x8', weight: 5.02, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 80x10', weight: 6.28, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 100x10', weight: 7.85, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 100x12', weight: 9.42, category: 'Plochá ocel (Pl)' },
  { name: 'Pl 120x10', weight: 9.42, category: 'Plochá ocel (Pl)' },
  // Úhelníky L válcované za tepla (EN 10056-1)
  { name: 'L 30x30x3', weight: 1.36, category: 'Úhelníky L' },
  { name: 'L 40x40x4', weight: 2.42, category: 'Úhelníky L' },
  { name: 'L 50x50x4', weight: 3.06, category: 'Úhelníky L' },
  { name: 'L 50x50x5', weight: 3.77, category: 'Úhelníky L' },
  { name: 'L 60x60x5', weight: 4.57, category: 'Úhelníky L' },
  { name: 'L 60x60x6', weight: 5.42, category: 'Úhelníky L' },
  { name: 'L 70x70x7', weight: 7.38, category: 'Úhelníky L' },
  { name: 'L 80x80x6', weight: 7.34, category: 'Úhelníky L' },
  { name: 'L 80x80x8', weight: 9.63, category: 'Úhelníky L' },
  { name: 'L 100x100x8', weight: 12.2, category: 'Úhelníky L' },
  { name: 'L 100x100x10', weight: 15.1, category: 'Úhelníky L' },
  { name: 'L 60x40x5', weight: 3.76, category: 'Úhelníky L' },
  { name: 'L 80x40x6', weight: 5.41, category: 'Úhelníky L' },
  { name: 'L 100x50x6', weight: 6.85, category: 'Úhelníky L' },
  // IPE
  { name: 'IPE 80', weight: 6.0, category: 'Nosníky IPE' },
  { name: 'IPE 100', weight: 8.1, category: 'Nosníky IPE' },
  { name: 'IPE 120', weight: 10.4, category: 'Nosníky IPE' },
  { name: 'IPE 140', weight: 12.9, category: 'Nosníky IPE' },
  { name: 'IPE 160', weight: 15.8, category: 'Nosníky IPE' },
  { name: 'IPE 180', weight: 18.8, category: 'Nosníky IPE' },
  { name: 'IPE 200', weight: 22.4, category: 'Nosníky IPE' },
  { name: 'IPE 220', weight: 26.2, category: 'Nosníky IPE' },
  { name: 'IPE 240', weight: 30.7, category: 'Nosníky IPE' },
  // HEA / HEB
  { name: 'HEA 100', weight: 16.7, category: 'Nosníky HEA / HEB' },
  { name: 'HEA 120', weight: 19.9, category: 'Nosníky HEA / HEB' },
  { name: 'HEA 140', weight: 24.7, category: 'Nosníky HEA / HEB' },
  { name: 'HEA 160', weight: 30.4, category: 'Nosníky HEA / HEB' },
  { name: 'HEA 180', weight: 35.5, category: 'Nosníky HEA / HEB' },
  { name: 'HEA 200', weight: 42.3, category: 'Nosníky HEA / HEB' },
  { name: 'HEB 120', weight: 26.7, category: 'Nosníky HEA / HEB' },
  { name: 'HEB 140', weight: 33.7, category: 'Nosníky HEA / HEB' },
  { name: 'HEB 160', weight: 42.6, category: 'Nosníky HEA / HEB' },
  { name: 'HEB 200', weight: 61.3, category: 'Nosníky HEA / HEB' },
  // UPN
  { name: 'UPN 80', weight: 8.64, category: 'Nosníky UPN' },
  { name: 'UPN 100', weight: 10.6, category: 'Nosníky UPN' },
  { name: 'UPN 120', weight: 13.4, category: 'Nosníky UPN' },
  { name: 'UPN 140', weight: 16.0, category: 'Nosníky UPN' },
  // Jekly (bez přídavku)
  { name: 'JEKL 40x40x3', weight: 3.45, category: 'Jekly' },
  { name: 'JEKL 50x50x4', weight: 5.72, category: 'Jekly' },
  { name: 'JEKL 60x60x4', weight: 6.97, category: 'Jekly' },
  { name: 'JEKL 80x80x5', weight: 11.7, category: 'Jekly' },
  { name: 'JEKL 100x100x6', weight: 17.7, category: 'Jekly' },
  { name: 'JEKL 100x60x5', weight: 11.7, category: 'Jekly' },
  // Trubky (TR – běžné, tlakové i žáruvzdorné, bez přídavku)
  { name: 'Tr. Ø 21,3 x 4', weight: 1.71, category: 'Trubky (TR)' },
  { name: 'Tr. Ø 26,9 x 4', weight: 2.26, category: 'Trubky (TR)' },
  { name: 'Tr. Ø 48,3 x 4', weight: 4.37, category: 'Trubky (TR)' },
  { name: 'Tr. Ø 60,3 x 4', weight: 5.55, category: 'Trubky (TR)' },
  { name: 'Tr. Ø 88,9 x 5', weight: 10.35, category: 'Trubky (TR)' },
  { name: 'Tr. Ø 101,6 x 5', weight: 11.91, category: 'Trubky (TR)' },
  { name: 'Tr. Ø 114,3 x 5', weight: 13.48, category: 'Trubky (TR)' },
  { name: 'Tr. Ø 139,7 x 4', weight: 13.39, category: 'Trubky (TR)' },
  { name: 'Tr. Ø 219,1 x 6,3', weight: 33.06, category: 'Trubky (TR)' },
  // Kulatiny (bez přídavku)
  { name: 'Kul. Ø 20', weight: 2.47, category: 'Kulatiny' },
  { name: 'Kul. Ø 30', weight: 5.55, category: 'Kulatiny' },
  { name: 'Kul. Ø 40', weight: 9.86, category: 'Kulatiny' },
  { name: 'Kul. Ø 42', weight: 10.88, category: 'Kulatiny' },
  // Hranoly / Čtyřhrany (bez přídavku)
  { name: 'Hranol 16x16', weight: 2.01, category: 'Hranoly / Čtyřhrany' },
  { name: 'Hranol 20x20', weight: 3.14, category: 'Hranoly / Čtyřhrany' },
  { name: 'Hranol 25x25', weight: 4.91, category: 'Hranoly / Čtyřhrany' },
  { name: 'Hranol 30x30', weight: 7.07, category: 'Hranoly / Čtyřhrany' },
  { name: 'Hranol 40x40', weight: 12.56, category: 'Hranoly / Čtyřhrany' },
  { name: 'Hranol 50x50', weight: 19.63, category: 'Hranoly / Čtyřhrany' },
  { name: 'Hranol 60x60', weight: 28.26, category: 'Hranoly / Čtyřhrany' }
];

const PROFILE_CATEGORIES = Array.from(new Set(PROFILE_CATALOG.map((p) => p.category)));
const HOLE_DIAMETERS = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 42];

function isPipeProfile(profileName = '') {
  const norm = String(profileName).trim().toUpperCase();
  return /^TR\.?\b/.test(norm) || norm.startsWith('TRUBK');
}

function getProfileShape(profileName = '') {
  const norm = String(profileName).trim().toUpperCase();
  if (
    /^(PL\.?|PLOCH[ÁA][ČC]|FL\.?)\s*\d/.test(norm) ||
    /^(HRANOL|[ČC]T\.?|[ČC]TY[ŘR]HRAN|4HR|6HR|[ŠS]ESTIHRAN)\b/.test(norm)
  ) {
    return 'FLAT';
  }
  if (/^(L|V)\s*\d/.test(norm) || norm.startsWith('ÚHELNÍK') || norm.startsWith('UHELNIK')) return 'L';
  if (/^(IPE|HEA|HEB|HEM|IPN)\b/.test(norm) || /^[IH]\s*\d/.test(norm)) return 'IH';
  if (/^(UPN|UPE)\b/.test(norm) || /^U\s*\d/.test(norm)) return 'U';
  if (norm.startsWith('KUL')) return 'SOLID';
  return 'HOLLOW';
}

function supportsOrientationToggle(profileName = '') {
  const shape = getProfileShape(profileName);
  return shape === 'L' || shape === 'IH' || shape === 'U';
}

function getOrientationLabels(profileName = '', edgeVisible = true) {
  const shape = getProfileShape(profileName);
  if (shape === 'IH') {
    return edgeVisible
      ? { button: 'Na hrany (H) – plné krajní', print: 'Půdorys: na hrany (H) – viditelné krajní hrany' }
      : { button: 'Na plochu (I) – skrytá stojna', print: 'Půdorys: na plochu (I) – skrytá střední stojna' };
  }
  if (shape === 'U') {
    return edgeVisible
      ? { button: 'Ramena nahoru (⊔) – plné', print: 'Půdorys: ramena nahoru – plné krajní hrany' }
      : { button: 'Ramena dolů (⊓) – přerušované', print: 'Půdorys: ramena dolů – skryté krajní hrany' };
  }
  return edgeVisible
    ? { button: 'Plná čára (hrana nahoru)', print: 'Půdorys: hrana nahoru (plná)' }
    : { button: 'Přerušovaná (hrana dolů)', print: 'Půdorys: hrana dolů (přerušovaná)' };
}

function getProfileWeightPerMeter(profileName, fallbackProfile = 'IPE 140', gradeId = 'S235JR') {
  const grade = getGradeInfo(gradeId);
  const factor = grade.densityFactor || 1.0;

  const clean = (profileName || fallbackProfile || 'IPE 140').trim();
  const exact = PROFILE_CATALOG.find(
    (p) => p.name.toLowerCase().replace(/\s+/g, '') === clean.toLowerCase().replace(/\s+/g, '')
  );
  if (exact) {
    const w = exact.weight * factor;
    return Number(w.toFixed(w < 1 ? 3 : 2));
  }

  const norm = clean.toUpperCase().replace(/,/g, '.');

  const plMatch = norm.match(
    /^(?:PL\.?|PLOCH[ÁA][ČC]|FL\.?)\s*(\d+(?:\.\d+)?)\s*[X×]\s*(\d+(?:\.\d+)?)/
  );
  if (plMatch) {
    const a = parseFloat(plMatch[1]);
    const b = parseFloat(plMatch[2]);
    const w = a * b * 0.00785 * factor;
    return Number(w.toFixed(w < 1 ? 3 : 2));
  }

  const hranol2 = norm.match(
    /^(?:HRANOL|[ČC]T\.?|[ČC]TY[ŘR]HRAN|4HR)\s*(\d+(?:\.\d+)?)\s*[X×]\s*(\d+(?:\.\d+)?)/
  );
  if (hranol2) {
    const a = parseFloat(hranol2[1]);
    const b = parseFloat(hranol2[2]);
    const w = a * b * 0.00785 * factor;
    return Number(w.toFixed(w < 1 ? 3 : 2));
  }

  const hranol1 = norm.match(/^(?:HRANOL|[ČC]T\.?|[ČC]TY[ŘR]HRAN|4HR)\s*(\d+(?:\.\d+)?)/);
  if (hranol1) {
    const a = parseFloat(hranol1[1]);
    const w = a * a * 0.00785 * factor;
    return Number(w.toFixed(w < 1 ? 3 : 2));
  }

  const lMatch = norm.match(
    /^[LV]\s*(\d+(?:\.\d+)?)\s*[X×]\s*(\d+(?:\.\d+)?)\s*[X×]\s*(\d+(?:\.\d+)?)/
  );
  if (lMatch) {
    const a = parseFloat(lMatch[1]);
    const b = parseFloat(lMatch[2]);
    const t = parseFloat(lMatch[3]);
    return Number(((a + b - t) * t * 0.00785 * factor).toFixed(2));
  }

  const jekl3 = norm.match(
    /JEKL\s*(\d+(?:\.\d+)?)\s*[X×]\s*(\d+(?:\.\d+)?)\s*[X×]\s*(\d+(?:\.\d+)?)/
  );
  if (jekl3) {
    const a = parseFloat(jekl3[1]);
    const b = parseFloat(jekl3[2]);
    const t = parseFloat(jekl3[3]);
    return Number((2 * t * (a + b - 2 * t) * 0.00785 * factor).toFixed(2));
  }
  const jekl2 = norm.match(/JEKL\s*(\d+(?:\.\d+)?)\s*[X×]\s*(\d+(?:\.\d+)?)/);
  if (jekl2) {
    const a = parseFloat(jekl2[1]);
    const t = parseFloat(jekl2[2]);
    return Number((4 * t * (a - t) * 0.00785 * factor).toFixed(2));
  }

  const trMatch = norm.match(/TR\.?\s*[ØD]?\s*(\d+(?:\.\d+)?)\s*[X×]\s*(\d+(?:\.\d+)?)/);
  if (trMatch) {
    const d = parseFloat(trMatch[1]);
    const t = parseFloat(trMatch[2]);
    return Number(((d - t) * t * 0.02466 * factor).toFixed(2));
  }

  const kulMatch = norm.match(/KUL\.?\s*[ØD]?\s*(\d+(?:\.\d+)?)/);
  if (kulMatch) {
    const d = parseFloat(kulMatch[1]);
    return Number((Math.PI * Math.pow(d / 2, 2) * 0.00785 * factor).toFixed(2));
  }

  const fb = PROFILE_CATALOG.find((p) => p.name === fallbackProfile);
  const baseWeight = fb ? fb.weight : 12.9;
  return Number((baseWeight * factor).toFixed(2));
}

// ============================================================================
// PARSOVÁNÍ ÚHLŮ A VRTÁNÍ + PŘEVOD NA CNC ÚHLY
// ============================================================================
function parseDetailString(raw = '') {
  const str = String(raw || '').trim();
  if (!str) {
    return {
      hasAngle: false,
      angleMode: null,
      leftAngle: null,
      rightAngle: null,
      normalizedAngleText: '',
      holes: [],
      freeText: ''
    };
  }

  const parts = str.split('|').map((s) => s.trim());
  const holes = [];
  const otherParts = [];

  parts.forEach((part) => {
    const holeRegex = /(?:(\d+)\s*[x×]\s*)?[Øø]\s*(\d+(?:[.,]\d+)?)(?:\s*mm)?/gi;
    let m;
    let foundHole = false;
    while ((m = holeRegex.exec(part)) !== null) {
      foundHole = true;
      holes.push({
        count: m[1] ? parseInt(m[1], 10) : 1,
        diameter: parseFloat(m[2].replace(',', '.'))
      });
    }
    const stripped = part.replace(holeRegex, '').replace(/^[\s,;]+|[\s,;]+$/g, '').trim();
    if (stripped) otherParts.push(stripped);
    else if (!foundHole && part) otherParts.push(part);
  });

  const anglePart = otherParts.join(' ').trim();
  if (!anglePart) {
    return {
      hasAngle: false,
      angleMode: null,
      leftAngle: null,
      rightAngle: null,
      normalizedAngleText: '',
      holes,
      freeText: ''
    };
  }

  let mode = null;
  if (anglePart.includes('//')) mode = '//';
  else if (anglePart.includes('\\\\')) mode = '\\\\';
  else if (anglePart.includes('/\\')) mode = '/\\';
  else if (anglePart.includes('\\/')) mode = '\\/';
  else if (anglePart.includes('\\')) mode = '\\';
  else if (anglePart.includes('/')) mode = '/';

  const nums = [];
  const numRegex = /(?:°\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*°?)/g;
  const looksLikeAngle = /[°/\\]/.test(anglePart) || /^\d+(?:[.,]\d+)?$/.test(anglePart);

  if (looksLikeAngle) {
    let nm;
    while ((nm = numRegex.exec(anglePart)) !== null) {
      const val = parseFloat((nm[1] || nm[2]).replace(',', '.'));
      if (!isNaN(val) && val > 0 && val < 90) {
        nums.push(val);
      }
    }
  }

  if (nums.length === 0) {
    return {
      hasAngle: false,
      angleMode: null,
      leftAngle: null,
      rightAngle: null,
      normalizedAngleText: '',
      holes,
      freeText: anglePart
    };
  }

  const isDouble =
    mode === '//' || mode === '\\\\' || mode === '/\\' || mode === '\\/' || nums.length >= 2;

  if (!isDouble) {
    const singleMode = mode === '\\' ? '\\' : '/';
    const deg = nums[0];
    return {
      hasAngle: true,
      angleMode: singleMode,
      leftAngle: null,
      rightAngle: deg,
      normalizedAngleText: `${deg}° ${singleMode}`,
      holes,
      freeText: ''
    };
  }

  const doubleMode = mode === '\\\\' || mode === '/\\' || mode === '\\/' ? mode : '//';
  const left = nums[0];
  const right = nums[1] !== undefined ? nums[1] : nums[0];

  return {
    hasAngle: true,
    angleMode: doubleMode,
    leftAngle: left,
    rightAngle: right,
    normalizedAngleText: `${left}° ${doubleMode} ${right}°`,
    holes,
    freeText: ''
  };
}

function getCncSignedAngles(detailRaw, zeroIsStraight = true) {
  const parsed = parseDetailString(detailRaw);
  let leftSigned = 0;
  let rightSigned = 0;

  if (parsed.hasAngle) {
    switch (parsed.angleMode) {
      case '/':
        leftSigned = 0;
        rightSigned = parsed.rightAngle || 0;
        break;
      case '\\':
        leftSigned = 0;
        rightSigned = -(parsed.rightAngle || 0);
        break;
      case '//':
        leftSigned = parsed.leftAngle || 0;
        rightSigned = parsed.rightAngle || 0;
        break;
      case '\\\\':
        leftSigned = -(parsed.leftAngle || 0);
        rightSigned = -(parsed.rightAngle || 0);
        break;
      case '/\\':
        leftSigned = parsed.leftAngle || 0;
        rightSigned = -(parsed.rightAngle || 0);
        break;
      case '\\/':
        leftSigned = -(parsed.leftAngle || 0);
        rightSigned = parsed.rightAngle || 0;
        break;
      default:
        break;
    }
  }

  if (zeroIsStraight) {
    return {
      left: leftSigned,
      right: rightSigned,
      mode: parsed.angleMode || '90°',
      holesText: parsed.holes.map((h) => `${h.count}x D${h.diameter}`).join(', ')
    };
  }

  return {
    left: 90 + leftSigned,
    right: 90 + rightSigned,
    mode: parsed.angleMode || '90°',
    holesText: parsed.holes.map((h) => `${h.count}x D${h.diameter}`).join(', ')
  };
}

// ============================================================================
// POMOCNÉ PARSERY PRO MS EXCEL (.xlsx, .xls, .csv) A AUTOCAD (.dxf)
// ============================================================================
function normalizeHeaderText(val = '') {
  return String(val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseNumericMm(val) {
  if (typeof val === 'number') return Number.isFinite(val) ? val : NaN;
  const cleaned = String(val || '')
    .replace(/\s+/g, '')
    .replace(/mm$/i, '')
    .replace(',', '.');
  const match = cleaned.match(/\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : NaN;
}

function parseSpreadsheetRowsLocally(sheetsData, defaultProfile, defaultGrade, mapMaterialFn) {
  const extracted = [];

  for (const sheet of sheetsData) {
    const rows = sheet.rows || [];
    let headerIdx = -1;
    let colMap = {};

    for (let r = 0; r < Math.min(rows.length, 25); r++) {
      const row = rows[r] || [];
      const candidateMap = {};
      row.forEach((cell, cIdx) => {
        const key = normalizeHeaderText(cell);
        if (!key) return;
        if (
          candidateMap.length === undefined &&
          (key === 'delka' ||
            key === 'delkamm' ||
            key === 'l' ||
            key === 'lmm' ||
            key === 'length' ||
            key === 'rozmermm' ||
            key === 'delkakusu')
        ) {
          candidateMap.length = cIdx;
        } else if (
          candidateMap.qty === undefined &&
          (key === 'pocet' ||
            key === 'ks' ||
            key === 'kusu' ||
            key === 'kusy' ||
            key === 'qty' ||
            key === 'mnozstvi' ||
            key === 'pcs')
        ) {
          candidateMap.qty = cIdx;
        } else if (
          candidateMap.profile === undefined &&
          (key === 'profil' ||
            key === 'profile' ||
            key === 'prurez' ||
            key === 'hutnimaterial' ||
            key === 'polotovar' ||
            key === 'nazevprofilu' ||
            key === 'rozmer')
        ) {
          candidateMap.profile = cIdx;
        } else if (
          candidateMap.material === undefined &&
          (key === 'jakost' ||
            key === 'ocel' ||
            key === 'material' ||
            key === 'trida' ||
            key === 'grade' ||
            key === 'druhmater' ||
            key === 'druhmaterialu')
        ) {
          candidateMap.material = cIdx;
        } else if (
          candidateMap.drawing === undefined &&
          (key === 'vykres' ||
            key === 'cislovykresu' ||
            key === 'drawing' ||
            key === 'dwg' ||
            key === 'sestava')
        ) {
          candidateMap.drawing = cIdx;
        } else if (
          candidateMap.position === undefined &&
          (key === 'pozice' ||
            key === 'poz' ||
            key === 'pol' ||
            key === 'polozka' ||
            key === 'pos' ||
            key === 'item')
        ) {
          candidateMap.position = cIdx;
        } else if (
          candidateMap.angle === undefined &&
          (key === 'uhel' ||
            key === 'detail' ||
            key === 'vrtani' ||
            key === 'uhelvrtani' ||
            key === 'rez' ||
            key === 'angle')
        ) {
          candidateMap.angle = cIdx;
        } else if (
          candidateMap.note === undefined &&
          (key === 'poznamka' || key === 'note' || key === 'popis' || key === 'komentar')
        ) {
          candidateMap.note = cIdx;
        }
      });

      if (candidateMap.length !== undefined) {
        headerIdx = r;
        colMap = candidateMap;
        break;
      }
    }

    if (headerIdx === -1) continue;

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const lenVal = parseNumericMm(row[colMap.length]);
      if (!Number.isFinite(lenVal) || lenVal <= 0 || lenVal > 30000) continue;

      const qtyRaw = colMap.qty !== undefined ? parseNumericMm(row[colMap.qty]) : 1;
      const qtyVal = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.round(qtyRaw) : 1;

      const profRaw = colMap.profile !== undefined ? String(row[colMap.profile] || '').trim() : '';
      const matRaw = colMap.material !== undefined ? String(row[colMap.material] || '').trim() : '';
      const profile = profRaw || defaultProfile;
      const material = matRaw ? mapMaterialFn(matRaw, profile) : defaultGrade;

      extracted.push({
        id: Date.now() + extracted.length + Math.random(),
        length: String(Math.round(lenVal)),
        qty: String(qtyVal),
        profile,
        material,
        drawing: colMap.drawing !== undefined ? String(row[colMap.drawing] || '').trim() : '',
        position: colMap.position !== undefined ? String(row[colMap.position] || '').trim() : '',
        angle: colMap.angle !== undefined ? String(row[colMap.angle] || '').trim() : '',
        note: colMap.note !== undefined ? String(row[colMap.note] || '').trim() : '',
        edgeVisible: true
      });
    }
  }

  return extracted;
}

function cleanAutocadText(raw = '') {
  return String(raw || '')
    .replace(/%%[cC]/g, 'Ø')
    .replace(/%%[dD]/g, '°')
    .replace(/%%[pP]/g, '±')
    .replace(/\\P/g, ' ')
    .replace(/\\[A-Za-z][^;]*;/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTextAndDimsFromDxf(dxfText) {
  const lines = dxfText.split(/\r?\n/);
  const texts = [];
  const dimensions = [];

  let currentEntity = '';
  let currentTextParts = [];
  let currentDimMeasurement = null;

  const flushEntity = () => {
    if (
      currentEntity === 'TEXT' ||
      currentEntity === 'MTEXT' ||
      currentEntity === 'ATTRIB' ||
      currentEntity === 'ATTDEF'
    ) {
      const joined = cleanAutocadText(currentTextParts.join(''));
      if (joined) texts.push(joined);
    } else if (currentEntity === 'DIMENSION') {
      const overrideText = cleanAutocadText(currentTextParts.join(''));
      if (overrideText && overrideText !== '<>') {
        dimensions.push(overrideText);
      } else if (currentDimMeasurement !== null && currentDimMeasurement > 0) {
        dimensions.push(`${Math.round(currentDimMeasurement)} mm`);
      }
    }
    currentTextParts = [];
    currentDimMeasurement = null;
  };

  for (let i = 0; i < lines.length - 1; i += 2) {
    const code = lines[i].trim();
    const value = (lines[i + 1] || '').trim();

    if (code === '0') {
      flushEntity();
      currentEntity = value.toUpperCase();
      continue;
    }

    if (
      currentEntity === 'TEXT' ||
      currentEntity === 'MTEXT' ||
      currentEntity === 'ATTRIB' ||
      currentEntity === 'ATTDEF' ||
      currentEntity === 'DIMENSION'
    ) {
      if (code === '1' || code === '3') {
        currentTextParts.push(value);
      } else if (code === '42' && currentEntity === 'DIMENSION') {
        const num = parseFloat(value);
        if (Number.isFinite(num)) currentDimMeasurement = num;
      }
    }
  }
  flushEntity();

  const uniqueTexts = Array.from(new Set(texts)).slice(0, 400);
  const uniqueDims = Array.from(new Set(dimensions)).slice(0, 150);

  return { texts: uniqueTexts, dimensions: uniqueDims };
}

// ============================================================================
// GENERÁTORY CNC SOUBORŮ (CSV BOMAR/PILOUS, DSTV NC1, XML KASTO/BEHRINGER)
// ============================================================================
function getDstvCode(profileName = '') {
  const shape = getProfileShape(profileName);
  if (shape === 'IH') return 'I';
  if (shape === 'U') return 'U';
  if (shape === 'L') return 'L';
  if (shape === 'FLAT') return 'B';
  if (profileName.toUpperCase().startsWith('TR')) return 'RO';
  if (profileName.toUpperCase().startsWith('JEKL')) return 'M';
  return 'RU';
}

function generateCncExportContent({
  format,
  calculation,
  orderNumber,
  kerf,
  trimCut,
  clampMin,
  zeroIsStraight
}) {
  const safeOrder = (orderNumber || 'ZAK-2026').replace(/[^a-zA-Z0-9_-]/g, '_');

  if (format === 'csv') {
    const header = [
      'ZAKAZKA',
      'PORADI_TYCE',
      'TYC_SKUTECNA_MM',
      'PRIDAVEK_MM',
      'OREZ_CELA_MM',
      'PROFIL',
      'JAKOST',
      'BARVA_ZNACENI',
      'DELKA_MM',
      'KUSU',
      zeroIsStraight ? 'UHEL_LEVY_0_ROVNE' : 'UHEL_LEVY_90_ROVNE',
      zeroIsStraight ? 'UHEL_PRAVY_0_ROVNE' : 'UHEL_PRAVY_90_ROVNE',
      'ORIENTACE_PUDORYS',
      'VYKRES',
      'POZICE',
      'VRTANI',
      'POZNAMKA'
    ].join(';');

    const rows = [header];
    calculation.profileResults.forEach(({ profileName, gradeInfo, allowanceMm, active }) => {
      active.bars.forEach((bar) => {
        bar.groupedCuts.forEach((cut) => {
          const ang = getCncSignedAngles(cut.angle, zeroIsStraight);
          const orient = supportsOrientationToggle(profileName)
            ? getOrientationLabels(profileName, cut.edgeVisible !== false).button
            : 'Standard';
          rows.push(
            [
              orderNumber || 'ZAK-2026',
              `T${bar.barNumber}`,
              bar.stockLength,
              allowanceMm,
              trimCut,
              profileName,
              gradeInfo.shortLabel,
              gradeInfo.colorName,
              cut.length.toFixed(1),
              cut.count,
              ang.left.toFixed(1),
              ang.right.toFixed(1),
              orient,
              cut.drawing || '',
              cut.position || '',
              ang.holesText,
              (cut.note || '').replace(/;/g, ',')
            ].join(';')
          );
        });
      });
    });

    return {
      filename: `RIKVAN_${safeOrder}_CNC.csv`,
      mimeType: 'text/csv;charset=utf-8',
      content: '\uFEFF' + rows.join('\r\n')
    };
  }

  if (format === 'nc1') {
    const blocks = [];
    let partSeq = 1;
    calculation.profileResults.forEach(({ profileName, gradeInfo, allowanceMm, kgPerM, active }) => {
      const dstvCode = getDstvCode(profileName);
      active.bars.forEach((bar) => {
        bar.groupedCuts.forEach((cut) => {
          const ang = getCncSignedAngles(cut.angle, true);
          const posId = cut.position || `P${partSeq}`;
          const dwgId = cut.drawing || safeOrder;
          blocks.push(
            [
              'ST',
              `** RIKVAN CNC DSTV | Tyč #${bar.barNumber} (${bar.stockLength} mm, přídavek +${allowanceMm} mm) | Barva: ${gradeInfo.colorName} | Ořez čela: ${trimCut} mm`,
              `  ${orderNumber || 'ZAK-2026'}`,
              `  ${dwgId}`,
              `  ${posId}`,
              `  ${posId}`,
              `  ${gradeInfo.shortLabel}`,
              `  ${cut.count}`,
              `  ${profileName}`,
              `  ${dstvCode}`,
              `  ${cut.length.toFixed(2)}`,
              `  0.00`,
              `  0.00`,
              `  0.00`,
              `  0.00`,
              `  0.00`,
              `  ${kgPerM.toFixed(3)}`,
              `  0.00`,
              `  ${ang.left.toFixed(2)}`,
              `  ${ang.right.toFixed(2)}`,
              `  0.00`,
              `  0.00`,
              `  ${ang.holesText ? `VRTANI: ${ang.holesText}` : ''}`,
              `  ${cut.note || ''}`,
              'EN'
            ].join('\r\n')
          );
          partSeq += 1;
        });
      });
    });

    return {
      filename: `RIKVAN_${safeOrder}_DSTV.nc1`,
      mimeType: 'text/plain;charset=utf-8',
      content: blocks.join('\r\n')
    };
  }

  const esc = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<CuttingPlan generator="RIKVAN" order="${esc(orderNumber || 'ZAK-2026')}" kerfMm="${kerf}" trimCutMm="${trimCut}" minClampMm="${clampMin}" angleZero="${zeroIsStraight ? '0deg_straight' : '90deg_straight'}">`
  ];

  calculation.profileResults.forEach(({ profileName, gradeInfo, allowanceMm, kgPerM, active }) => {
    lines.push(
      `  <ProfileGroup name="${esc(profileName)}" steelGrade="${esc(gradeInfo.shortLabel)}" colorCode="${esc(gradeInfo.colorName)}" weightKgPerM="${kgPerM}" nominalLengthMm="${active.nominalLength}" allowanceMm="${allowanceMm}" actualBarLengthMm="${active.actualLength}" totalBars="${active.totalBars}">`
    );
    active.bars.forEach((bar) => {
      lines.push(
        `    <Bar number="${bar.barNumber}" lengthMm="${bar.stockLength}" trimCutMm="${bar.trimCut}" remainingMm="${bar.remaining}" remnantType="${bar.isStock ? 'STOCK' : 'SCRAP'}" clampWarning="${bar.clampWarning}">`
      );
      bar.groupedCuts.forEach((cut) => {
        const ang = getCncSignedAngles(cut.angle, zeroIsStraight);
        lines.push(
          `      <Cut lengthMm="${cut.length}" qty="${cut.count}" leftAngle="${ang.left}" rightAngle="${ang.right}" drawing="${esc(cut.drawing)}" position="${esc(cut.position)}" drilling="${esc(ang.holesText)}" note="${esc(cut.note)}" />`
        );
      });
      lines.push('    </Bar>');
    });
    lines.push('  </ProfileGroup>');
  });

  lines.push('</CuttingPlan>');

  return {
    filename: `RIKVAN_${safeOrder}_PLAN.xml`,
    mimeType: 'application/xml;charset=utf-8',
    content: lines.join('\r\n')
  };
}

// ============================================================================
// KOMPONENTY: LOGO & IKONY
// ============================================================================
function RikvanLogo({ size = 44 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-sm border border-slate-700/80"
    >
      <svg viewBox="0 0 44 44" className="w-full h-full p-1.5">
        <defs>
          <linearGradient id="cutGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <path d="M9 8 H35 V13 H25 V19 L19 23 V13 H9 Z" fill="#e2e8f0" />
        <path d="M19 27 L25 23 V31 H35 V36 H9 V31 H19 Z" fill="#94a3b8" />
        <line
          x1="7"
          y1="30"
          x2="37"
          y2="14"
          stroke="url(#cutGlow)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="35" cy="15" r="1.5" fill="#fde047" />
      </svg>
    </div>
  );
}

function SawBladeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2.5l1.6 2.8 3.2-.6-.3 3.2 2.9 1.4-2.1 2.5 1.5 2.9-3.2.7-.2 3.2-3.4-1.1-2.4 2.2-1.6-2.8-3.2.6.3-3.2-2.9-1.4 2.1-2.5-1.5-2.9 3.2-.7.2-3.2 3.4 1.1L12 2.5z"
      />
    </svg>
  );
}

function DiameterSymbol({ className = 'w-3.5 h-3.5 inline-block' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}>
      <circle cx="10" cy="10" r="5.5" />
      <line x1="4" y1="16" x2="16" y2="4" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// TECHNICKÝ NÁKRES VŽDY Z POZICE PŮDORYSU (SVG) + ČISTÝ VÝPIS DĚR (POČET × Ø)
// ============================================================================
function CutDetailDiagram({ detail, profile, edgeVisible = true, compact = false }) {
  const parsed = parseDetailString(detail);
  const shape = getProfileShape(profile);

  if (!parsed.hasAngle && parsed.holes.length === 0) {
    if (parsed.freeText) {
      return <span className="text-xs font-medium text-slate-700">{parsed.freeText}</span>;
    }
    return <span className="text-slate-400">—</span>;
  }

  const yTop = 10;
  const yBot = 26;
  const xL = 10;
  const xR = 76;
  const skew = 8;

  let tlX = xL;
  let blX = xL;
  let trX = xR;
  let brX = xR;

  let leftAngled = false;
  let rightAngled = false;

  if (parsed.hasAngle) {
    switch (parsed.angleMode) {
      case '/':
        rightAngled = true;
        trX = xR;
        brX = xR - skew;
        break;
      case '\\':
        rightAngled = true;
        trX = xR - skew;
        brX = xR;
        break;
      case '//':
        leftAngled = true;
        rightAngled = true;
        tlX = xL + skew;
        blX = xL;
        trX = xR;
        brX = xR - skew;
        break;
      case '\\\\':
        leftAngled = true;
        rightAngled = true;
        tlX = xL;
        blX = xL + skew;
        trX = xR - skew;
        brX = xR;
        break;
      case '/\\':
        leftAngled = true;
        rightAngled = true;
        tlX = xL + skew;
        blX = xL;
        trX = xR - skew;
        brX = xR;
        break;
      case '\\/':
        leftAngled = true;
        rightAngled = true;
        tlX = xL;
        blX = xL + skew;
        trX = xR;
        brX = xR - skew;
        break;
      default:
        break;
    }
  }

  const interpX = (xTop, xBot, y) => {
    const t = (y - yTop) / (yBot - yTop);
    return xTop + (xBot - xTop) * t;
  };

  const lEdgeY = 14;
  const lEdgeX1 = interpX(tlX, blX, lEdgeY);
  const lEdgeX2 = interpX(trX, brX, lEdgeY);
  const yMid = (yTop + yBot) / 2;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {parsed.hasAngle && (
        <>
          <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[11px] font-extrabold text-slate-800 whitespace-nowrap tabular-nums">
            {parsed.normalizedAngleText}
          </span>

          <svg
            viewBox="0 0 86 34"
            className={compact ? 'w-20 h-8 shrink-0' : 'w-24 h-9 shrink-0'}
            aria-label="Technický náhled řezu z půdorysu"
          >
            <polygon
              points={`${tlX},${yTop} ${trX},${yTop} ${brX},${yBot} ${blX},${yBot}`}
              fill="#f8fafc"
              stroke="#1e293b"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />

            {shape === 'L' && (
              <line
                x1={lEdgeX1}
                y1={lEdgeY}
                x2={lEdgeX2}
                y2={lEdgeY}
                stroke={edgeVisible ? '#1e293b' : '#64748b'}
                strokeWidth={edgeVisible ? '1.2' : '1.1'}
                strokeDasharray={edgeVisible ? undefined : '3,2'}
              />
            )}

            {shape === 'IH' && edgeVisible && (
              <>
                <line
                  x1={interpX(tlX, blX, yTop + 3)}
                  y1={yTop + 3}
                  x2={interpX(trX, brX, yTop + 3)}
                  y2={yTop + 3}
                  stroke="#1e293b"
                  strokeWidth="1.1"
                />
                <line
                  x1={interpX(tlX, blX, yBot - 3)}
                  y1={yBot - 3}
                  x2={interpX(trX, brX, yBot - 3)}
                  y2={yBot - 3}
                  stroke="#1e293b"
                  strokeWidth="1.1"
                />
              </>
            )}

            {shape === 'IH' && !edgeVisible && (
              <>
                <line
                  x1={interpX(tlX, blX, yMid - 1.8)}
                  y1={yMid - 1.8}
                  x2={interpX(trX, brX, yMid - 1.8)}
                  y2={yMid - 1.8}
                  stroke="#64748b"
                  strokeWidth="0.95"
                  strokeDasharray="3,2"
                />
                <line
                  x1={interpX(tlX, blX, yMid + 1.8)}
                  y1={yMid + 1.8}
                  x2={interpX(trX, brX, yMid + 1.8)}
                  y2={yMid + 1.8}
                  stroke="#64748b"
                  strokeWidth="0.95"
                  strokeDasharray="3,2"
                />
              </>
            )}

            {shape === 'U' && (
              <>
                <line
                  x1={interpX(tlX, blX, yTop + 3)}
                  y1={yTop + 3}
                  x2={interpX(trX, brX, yTop + 3)}
                  y2={yTop + 3}
                  stroke={edgeVisible ? '#1e293b' : '#64748b'}
                  strokeWidth={edgeVisible ? '1.1' : '0.95'}
                  strokeDasharray={edgeVisible ? undefined : '3,2'}
                />
                <line
                  x1={interpX(tlX, blX, yBot - 3)}
                  y1={yBot - 3}
                  x2={interpX(trX, brX, yBot - 3)}
                  y2={yBot - 3}
                  stroke={edgeVisible ? '#1e293b' : '#64748b'}
                  strokeWidth={edgeVisible ? '1.1' : '0.95'}
                  strokeDasharray={edgeVisible ? undefined : '3,2'}
                />
              </>
            )}

            {shape === 'SOLID' && (
              <line
                x1={interpX(tlX, blX, yMid)}
                y1={yMid}
                x2={interpX(trX, brX, yMid)}
                y2={yMid}
                stroke="#94a3b8"
                strokeWidth="0.7"
                strokeDasharray="5,2,1,2"
              />
            )}

            {shape === 'HOLLOW' && (
              <>
                <line
                  x1={interpX(tlX, blX, yTop + 2.5)}
                  y1={yTop + 2.5}
                  x2={interpX(trX, brX, yTop + 2.5)}
                  y2={yTop + 2.5}
                  stroke="#94a3b8"
                  strokeWidth="0.85"
                  strokeDasharray="2.5,2"
                />
                <line
                  x1={interpX(tlX, blX, yBot - 2.5)}
                  y1={yBot - 2.5}
                  x2={interpX(trX, brX, yBot - 2.5)}
                  y2={yBot - 2.5}
                  stroke="#94a3b8"
                  strokeWidth="0.85"
                  strokeDasharray="2.5,2"
                />
              </>
            )}

            {leftAngled && (
              <>
                <line
                  x1={tlX > blX ? blX : tlX}
                  y1={yTop}
                  x2={tlX > blX ? blX : tlX}
                  y2={yBot}
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                  strokeDasharray="1.5,1.5"
                />
                <line
                  x1={tlX}
                  y1={yTop}
                  x2={blX}
                  y2={yBot}
                  stroke="#ea580c"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d={
                    tlX > blX
                      ? `M ${blX + 0.5} ${yBot - 6} A 6 6 0 0 1 ${blX + 3} ${yBot - 5.2}`
                      : `M ${tlX + 0.5} ${yTop + 6} A 6 6 0 0 0 ${tlX + 3} ${yTop + 5.2}`
                  }
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="0.9"
                />
                <text x={Math.min(tlX, blX) + 1} y={7.5} fontSize="7" fontWeight="700" fill="#ea580c">
                  {parsed.leftAngle}°
                </text>
              </>
            )}

            {rightAngled && (
              <>
                <line
                  x1={Math.max(trX, brX)}
                  y1={yTop}
                  x2={Math.max(trX, brX)}
                  y2={yBot}
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                  strokeDasharray="1.5,1.5"
                />
                <line
                  x1={trX}
                  y1={yTop}
                  x2={brX}
                  y2={yBot}
                  stroke="#ea580c"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d={
                    trX > brX
                      ? `M ${trX - 0.5} ${yTop + 6} A 6 6 0 0 1 ${trX - 3} ${yTop + 5.2}`
                      : `M ${brX - 0.5} ${yBot - 6} A 6 6 0 0 0 ${brX - 3} ${yBot - 5.2}`
                  }
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="0.9"
                />
                <text x={Math.max(trX, brX) - 11} y={7.5} fontSize="7" fontWeight="700" fill="#ea580c">
                  {parsed.rightAngle}°
                </text>
              </>
            )}
          </svg>
        </>
      )}

      {parsed.holes.length > 0 && (
        <div className="inline-flex items-center gap-1 flex-wrap">
          {parsed.holes.map((h, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-[11px] font-extrabold text-sky-900 whitespace-nowrap tabular-nums"
            >
              <span>{h.count}×</span>
              <DiameterSymbol className="w-3 h-3 text-sky-600 shrink-0" />
              <span>{h.diameter} mm</span>
            </span>
          ))}
        </div>
      )}

      {parsed.freeText && <span className="text-xs font-medium text-slate-700">{parsed.freeText}</span>}
    </div>
  );
}

// ============================================================================
// OPTIMALIZACE ŘEZNÉHO PLÁNU (FFD BIN PACKING S PŘÍDAVKEM +100 MM A OŘEZEM 50 MM)
// ============================================================================
function optimizeProfileGroup(
  items,
  actualStockLength,
  kerf,
  stockLimit,
  addReserve,
  trimCut = 50,
  clampMin = 80,
  enforceClamp = false
) {
  const pieces = [];
  items.forEach((item) => {
    const len = Number(item.length);
    const qty = Number(item.qty);
    if (len > 0 && qty > 0) {
      for (let i = 0; i < qty; i++) {
        pieces.push({ ...item, length: len });
      }
    }
  });

  if (addReserve && pieces.length > 0) {
    const longest = pieces.reduce((a, b) => (b.length > a.length ? b : a), pieces[0]);
    pieces.push({
      ...longest,
      note: longest.note ? `${longest.note} (Rezerva)` : 'Rezerva'
    });
  }

  pieces.sort((a, b) => b.length - a.length);

  const safeTrim = Math.max(0, Number(trimCut) || 0);
  const safeClamp = Math.max(0, Number(clampMin) || 0);
  const reservedTail = enforceClamp ? safeClamp : 0;
  const effectiveMaxLength = actualStockLength - safeTrim - reservedTail;

  const bars = [];
  let oversized = false;

  for (const piece of pieces) {
    const minNeededForSingle = piece.length + (reservedTail > 0 ? kerf : 0);
    if (minNeededForSingle > effectiveMaxLength) {
      oversized = true;
      continue;
    }

    let placed = false;
    for (const bar of bars) {
      const nextPiecesSum = bar.piecesSum + piece.length;
      const nextCount = bar.cuts.length + 1;
      const kerfsNeeded = reservedTail > 0 ? nextCount * kerf : (nextCount - 1) * kerf;

      if (nextPiecesSum + kerfsNeeded <= effectiveMaxLength) {
        bar.cuts.push(piece);
        bar.piecesSum = nextPiecesSum;
        placed = true;
        break;
      }
    }

    if (!placed) {
      bars.push({
        stockLength: actualStockLength,
        cuts: [piece],
        piecesSum: piece.length
      });
    }
  }

  const formattedBars = bars.map((bar, idx) => {
    const grouped = [];
    bar.cuts.forEach((c) => {
      const key = `${c.length}|${c.drawing}|${c.position}|${c.angle}|${c.note}|${c.edgeVisible}`;
      const existing = grouped.find((g) => g._key === key);
      if (existing) {
        existing.count += 1;
      } else {
        grouped.push({ ...c, count: 1, _key: key });
      }
    });

    const rawRemAfterInterCuts =
      bar.stockLength - safeTrim - bar.piecesSum - (bar.cuts.length - 1) * kerf;
    let pieceCutCount = 0;
    let remaining = 0;

    if (rawRemAfterInterCuts <= 0) {
      pieceCutCount = Math.max(bar.cuts.length - 1, 0);
      remaining = 0;
    } else {
      pieceCutCount = bar.cuts.length;
      remaining = Math.max(0, Math.round(rawRemAfterInterCuts - kerf));
    }

    const totalKerfMm = pieceCutCount * kerf;
    const trimCutCount = safeTrim > 0 ? 1 : 0;
    const cutCount = pieceCutCount + trimCutCount;
    const isStock = remaining >= stockLimit;
    const clampWarning = safeClamp > 0 && remaining > 0 && remaining < safeClamp;

    return {
      barNumber: idx + 1,
      stockLength: bar.stockLength,
      trimCut: safeTrim,
      rawCuts: bar.cuts,
      groupedCuts: grouped,
      totalPiecesOnBar: bar.cuts.length,
      piecesSum: bar.piecesSum,
      totalKerfMm,
      remaining,
      isStock,
      clampWarning,
      cutCount
    };
  });

  const totalBars = formattedBars.length;
  const totalPurchasedMm = totalBars * actualStockLength;
  const totalPartsMm = formattedBars.reduce((s, b) => s + b.piecesSum, 0);
  const totalKerfMm = formattedBars.reduce((s, b) => s + b.totalKerfMm, 0);
  const totalTrimMm = formattedBars.reduce((s, b) => s + b.trimCut, 0);
  const totalStockMm = formattedBars.reduce((s, b) => s + (b.isStock ? b.remaining : 0), 0);
  const totalScrapMm = formattedBars.reduce((s, b) => s + (!b.isStock ? b.remaining : 0), 0);
  const totalCuts = formattedBars.reduce((s, b) => s + b.cutCount, 0);
  const hasClampWarnings = formattedBars.some((b) => b.clampWarning);
  const partsYieldPct = totalPurchasedMm > 0 ? (totalPartsMm / totalPurchasedMm) * 100 : 0;

  return {
    oversized,
    bars: formattedBars,
    totalBars,
    totalPurchasedMm,
    totalPartsMm,
    totalKerfMm,
    totalTrimMm,
    totalStockMm,
    totalScrapMm,
    totalCuts,
    hasClampWarnings,
    partsYieldPct
  };
}

// ============================================================================
// ZAMYKACÍ OBRAZOVKA: BETA PŘÍSTUP
// ============================================================================
function BetaLockScreen({
  isPreview,
  onSubmitKey,
  onBypassPreview,
  authError,
  isChecking
}) {
  const [inputKey, setInputKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitKey(inputKey);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-950 text-white p-6 flex flex-col items-center text-center space-y-3">
          <RikvanLogo size={56} />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
              <Lock className="w-3 h-3" />
              Beta provoz
            </div>
            <h1 className="text-xl font-black tracking-tight">RIKVAN Řezný Plán</h1>
            <p className="text-xs text-slate-400 mt-1">
              Pro vstup do aplikace a AI čtení výkresů zadejte svůj přístupový klíč.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
              Přístupový Beta klíč
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="např. RIKVAN-SEF"
                autoFocus
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-300 bg-slate-50 font-mono font-bold text-sm uppercase tracking-wide focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isChecking || !inputKey.trim()}
            className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60"
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {isChecking ? 'Ověřuji klíč...' : 'Vstoupit do aplikace'}
          </button>

          {isPreview && (
            <div className="pt-2 border-t border-slate-100 space-y-2 text-center">
              <p className="text-[11px] text-slate-500">
                Testovací náhled zámku (zkuste zadat <code className="font-bold text-slate-800">RIKVAN-SEF</code> nebo se rovnou vraťte):
              </p>
              <button
                type="button"
                onClick={onBypassPreview}
                className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Zpět do náhledu aplikace
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MODÁLNÍ OKNO: EXPORT PRO CNC PILY (USB / LAN / WIFI)
// ============================================================================
function CncExportModal({
  isOpen,
  onClose,
  calculation,
  orderNumber,
  kerf,
  trimCut,
  clampMin
}) {
  const [cncFormat, setCncFormat] = useState('csv');
  const [zeroIsStraight, setZeroIsStraight] = useState(true);
  const [transferTab, setTransferTab] = useState('usb');
  const [lanEndpoint, setLanEndpoint] = useState('http://192.168.1.50:8080/api/cnc-import');
  const [lanToken, setLanToken] = useState('');
  const [sendStatus, setSendStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportFile = useMemo(
    () =>
      generateCncExportContent({
        format: cncFormat,
        calculation,
        orderNumber,
        kerf,
        trimCut,
        clampMin,
        zeroIsStraight
      }),
    [cncFormat, calculation, orderNumber, kerf, trimCut, clampMin, zeroIsStraight]
  );

  if (!isOpen) return null;

  const handleSaveToUsbOrLanFolder = async () => {
    setSendStatus(null);
    const ext = cncFormat === 'csv' ? '.csv' : cncFormat === 'nc1' ? '.nc1' : '.xml';

    if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: exportFile.filename,
          types: [
            {
              description: `CNC soubor (${ext.toUpperCase()})`,
              accept: { [exportFile.mimeType.split(';')[0]]: [ext] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(exportFile.content);
        await writable.close();
        setSendStatus({
          type: 'success',
          text: `Soubor ${exportFile.filename} byl úspěšně uložen do zvolené složky / na USB disk.`
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    const blob = new Blob([exportFile.content], { type: exportFile.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSendStatus({
      type: 'success',
      text: `Soubor ${exportFile.filename} byl stažen. Zkopírujte ho na USB disk nebo do síťové složky pily.`
    });
  };

  const handleCopyCode = () => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = exportFile.content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setSendStatus({ type: 'error', text: 'Nepodařilo se zkopírovat do schránky.' });
    }
  };

  const handleSendLanWifi = async () => {
    if (!lanEndpoint.trim()) {
      setSendStatus({ type: 'error', text: 'Zadejte prosím IP adresu nebo URL cílové CNC pily / můstku.' });
      return;
    }

    setIsSending(true);
    setSendStatus(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (lanToken.trim()) headers.Authorization = `Bearer ${lanToken.trim()}`;

      const res = await fetch(lanEndpoint.trim(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderNumber,
          format: cncFormat,
          filename: exportFile.filename,
          content: exportFile.content
        }),
        signal: controller.signal
      });

      if (res.ok) {
        setSendStatus({
          type: 'success',
          text: `Plán ${exportFile.filename} byl odeslán přes LAN/WiFi na ${lanEndpoint}.`
        });
      } else {
        setSendStatus({
          type: 'error',
          text: `Cílové zařízení odpovědělo chybou (${res.status}). Zkontrolujte adresu nebo oprávnění.`
        });
      }
    } catch (err) {
      setSendStatus({
        type: 'warning',
        text:
          err.name === 'AbortError'
            ? 'Časový limit vypršel – CNC pila nebo síťový můstek v LAN neodpovídá.'
            : 'Prohlížeč zablokoval přímé spojení na lokální IP (HTTPS → HTTP / CORS) nebo server na této IP neběží. Pro firemní LAN doporučujeme uložit soubor přímo do namapované síťové složky pily (záložka USB / LAN složka).'
      });
    } finally {
      clearTimeout(timeoutId);
      setIsSending(false);
    }
  };

  const handleShareWifiFile = async () => {
    try {
      const file = new File([exportFile.content], exportFile.filename, {
        type: exportFile.mimeType.split(';')[0]
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `RIKVAN CNC: ${orderNumber}`,
          text: `Řezný plán ${orderNumber}`,
          files: [file]
        });
        setSendStatus({ type: 'success', text: 'Soubor byl předán ke sdílení přes WiFi / systém.' });
      } else {
        handleSaveToUsbOrLanFolder();
      }
    } catch {
      // zrušeno uživatelem
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto">
        <div className="bg-slate-900 text-white px-4 sm:px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg leading-tight">
                Export řezného plánu pro CNC pily
              </h2>
              <p className="text-xs text-slate-300">
                Zakázka: {orderNumber || 'ZAK-2026'} • Prořez: {kerf} mm • Ořez čela: {trimCut} mm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 inline-flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              1. Formát CNC stroje
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'csv', title: 'CSV (Bomar / Pilous)', desc: 'Univerzální tabulka ;' },
                { id: 'nc1', title: 'DSTV (.nc1)', desc: 'Kaltenbach / Voortman' },
                { id: 'xml', title: 'XML (Po tyčích)', desc: 'Kasto / Behringer / ERP' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setCncFormat(fmt.id)}
                  className={`text-left p-3 rounded-xl border-2 h-full transition ${
                    cncFormat === fmt.id
                      ? 'border-indigo-600 bg-indigo-50/70'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="font-extrabold text-xs sm:text-sm text-slate-900">{fmt.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {cncFormat !== 'nc1' && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Konvence úhlů na displeji pily:</span>
              <div className="grid grid-cols-2 rounded-lg bg-white p-0.5 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setZeroIsStraight(true)}
                  className={`h-8 px-3 rounded-md transition ${
                    zeroIsStraight ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  0° = rovně
                </button>
                <button
                  type="button"
                  onClick={() => setZeroIsStraight(false)}
                  className={`h-8 px-3 rounded-md transition ${
                    !zeroIsStraight ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  90° = rovně
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              2. Způsob přenosu k pile
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransferTab('usb')}
                className={`h-11 flex items-center justify-center gap-2 px-3 rounded-xl border-2 font-bold text-xs sm:text-sm transition ${
                  transferTab === 'usb'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <HardDrive className="w-4 h-4 shrink-0" />
                USB / LAN složka
              </button>
              <button
                type="button"
                onClick={() => setTransferTab('wifi')}
                className={`h-11 flex items-center justify-center gap-2 px-3 rounded-xl border-2 font-bold text-xs sm:text-sm transition ${
                  transferTab === 'wifi'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Wifi className="w-4 h-4 shrink-0" />
                Síť LAN / WiFi
              </button>
            </div>

            {transferTab === 'usb' ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  V prohlížeči Chrome/Edge na počítači můžete jedním kliknutím uložit soubor{' '}
                  <strong className="text-slate-900">{exportFile.filename}</strong> přímo na{' '}
                  <strong>USB flash disk</strong> nebo do{' '}
                  <strong>sdílené síťové LAN složky pily</strong> (např. <code className="bg-slate-200 px-1 rounded">Z:\CNC_Import</code>).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSaveToUsbOrLanFolder}
                    className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-sm transition"
                  >
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    Uložit na USB / LAN
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWifiFile}
                    className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm transition"
                  >
                    <Share2 className="w-4 h-4 shrink-0" />
                    Sdílet (WiFi)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      IP adresa / Endpoint pily nebo LAN můstku
                    </label>
                    <input
                      type="text"
                      value={lanEndpoint}
                      onChange={(e) => setLanEndpoint(e.target.value)}
                      placeholder="http://192.168.1.50:8080/api/cnc-import"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Přístupový klíč (volitelné)
                    </label>
                    <input
                      type="password"
                      value={lanToken}
                      onChange={(e) => setLanToken(e.target.value)}
                      placeholder="PIN / Token"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={handleSendLanWifi}
                    className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition disabled:opacity-60"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-emerald-400" />
                    )}
                    Odeslat přes LAN / WiFi
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWifiFile}
                    className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-extrabold text-sm transition"
                  >
                    <Share2 className="w-4 h-4" />
                    Poslat na tablet
                  </button>
                </div>
              </div>
            )}

            {sendStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 border ${
                  sendStatus.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : sendStatus.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {sendStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                )}
                <span>{sendStatus.text}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Náhled souboru: {exportFile.filename}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Zkopírováno' : 'Kopírovat obsah'}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-48 border border-slate-700">
              {exportFile.content.replace(/^\uFEFF/, '')}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HLAVNÍ APLIKACE
// ============================================================================
export default function CuttingPlanOptimizer() {
  const isPreview = useMemo(() => isPreviewEnvironment(), []);

  // Beta zámek je vypnutý – aplikace se otevírá rovnou bez hesla
  const [authStatus, setAuthStatus] = useState('unlocked');
  const [betaKey, setBetaKey] = useState('');
  const [betaInfo, setBetaInfo] = useState({
    keyName: isPreview ? 'NÁHLED' : '',
    permanent: true,
    expiresAt: null
  });
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Parametry zakázky a pily
  const [orderNumber, setOrderNumber] = useState('ZAK-2026');
  const [steelGrade, setSteelGrade] = useState('S235JR');
  const [defaultProfile, setDefaultProfile] = useState('IPE 140');
  const [kerf, setKerf] = useState(2);
  const [trimCut, setTrimCut] = useState(50);
  const [steelAllowance, setSteelAllowance] = useState(100);
  const [clampMin, setClampMin] = useState(80);
  const [enforceClamp, setEnforceClamp] = useState(false);
  const [stockLimit, setStockLimit] = useState(1000);
  const [addReserve, setAddReserve] = useState(false);
  const [cutPrice, setCutPrice] = useState(15);
  const [price6m, setPrice6m] = useState(25);
  const [price12m, setPrice12m] = useState(28);
  const [price15m, setPrice15m] = useState(32);
  const [purchaseNote, setPurchaseNote] = useState('Požadujeme atest 3.1 u materiálu S355J2 a tlakových trubek.');

  const [items, setItems] = useState([
    {
      id: 1,
      length: '1500',
      qty: '2',
      profile: 'IPE 140',
      material: 'S355J2',
      drawing: 'V-01',
      position: '1',
      angle: '12° /',
      note: 'Zabrousit',
      edgeVisible: false
    },
    {
      id: 2,
      length: '1250',
      qty: '4',
      profile: 'L 60x60x5',
      material: 'S235JR',
      drawing: 'V-02',
      position: '2',
      angle: '30° / | 2× Ø 14',
      note: 'Půdorys kontrola',
      edgeVisible: true
    },
    {
      id: 3,
      length: '2200',
      qty: '3',
      profile: 'Tr. Ø 60,3 x 4',
      material: 'P235GH (Tlaková)',
      drawing: 'V-04',
      position: '3',
      angle: '45° // 45°',
      note: 'Tlakové potrubí (bez přídavku)',
      edgeVisible: true
    },
    {
      id: 4,
      length: '1000',
      qty: '5',
      profile: 'Pl 20x2',
      material: '1.4301 (Nerez)',
      drawing: 'V-03',
      position: '4',
      angle: '22× Ø 10, 4× Ø 14',
      note: 'Plocháč kotvení',
      edgeVisible: true
    }
  ]);

  const [view, setView] = useState('editor');
  const [showResults, setShowResults] = useState(true);
  const [previewTab, setPreviewTab] = useState('both');
  const [printMode, setPrintMode] = useState('plan');
  const [isCncModalOpen, setIsCncModalOpen] = useState(false);
  const [selectedStockByProfile, setSelectedStockByProfile] = useState({});
  const [checkedCuts, setCheckedCuts] = useState({});
  const [openHolePickerId, setOpenHolePickerId] = useState(null);
  const [holeCountDraft, setHoleCountDraft] = useState('2');
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [copiedOrder, setCopiedOrder] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const excelInputRef = useRef(null);
  const dxfInputRef = useRef(null);
  const resultsRef = useRef(null);

  // Ověření Beta klíče při startu na ostrém Vercelu
  const verifyBetaKeyWithServer = async (candidateKey, silent = false) => {
    const cleanKey = String(candidateKey || '').trim().toUpperCase();
    if (!cleanKey) {
      setAuthStatus('locked');
      if (!silent) setAuthError('Zadejte prosím svůj přístupový klíč.');
      return;
    }

    if (isPreview) {
      if (cleanKey === 'RIKVAN-SEF' || cleanKey.startsWith('RIKVAN') || cleanKey.startsWith('BETA')) {
        setBetaKey(cleanKey);
        setBetaInfo({ keyName: cleanKey, permanent: true, expiresAt: null });
        setAuthError('');
        setAuthStatus('unlocked');
      } else {
        setAuthError('V testovacím náhledu zadejte např. RIKVAN-SEF.');
        setAuthStatus('locked');
      }
      return;
    }

    setIsAuthSubmitting(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.valid) {
        saveBetaKeyCookie(cleanKey);
        setBetaKey(cleanKey);
        setBetaInfo({
          keyName: data.keyName || cleanKey,
          permanent: !!data.permanent,
          expiresAt: data.expiresAt || null
        });
        setAuthStatus('unlocked');
      } else {
        clearBetaKeyCookie();
        setAuthStatus('locked');
        setAuthError(data.message || 'Neplatný přístupový klíč nebo byl přístup odebrán.');
      }
    } catch {
      setAuthStatus('locked');
      setAuthError('Nepodařilo se ověřit klíč na serveru. Zkontrolujte připojení.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Automatická kontrola Beta klíče je vypnuta (přímý přístup bez hesla)

  const handleLogoutBeta = () => {
    clearBetaKeyCookie();
    setAuthError('');
    setAuthStatus('locked');
  };

  const toggleCutDone = (cutKey) => {
    setCheckedCuts((prev) => ({ ...prev, [cutKey]: !prev[cutKey] }));
  };

  const addItem = () => {
    const newId = Date.now();
    const initialMaterial = isPipeProfile(defaultProfile) ? 'P235GH (Tlaková)' : steelGrade;
    setItems((prev) => [
      {
        id: newId,
        length: '',
        qty: '1',
        profile: defaultProfile,
        material: initialMaterial,
        drawing: '',
        position: '',
        angle: '',
        note: '',
        edgeVisible: true
      },
      ...prev
    ]);
    setNewlyAddedId(newId);
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'profile' && isPipeProfile(value) && !item.material) {
          updated.material = 'P235GH (Tlaková)';
        }
        return updated;
      })
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearItems = () => {
    setItems([
      {
        id: Date.now(),
        length: '',
        qty: '1',
        profile: defaultProfile,
        material: steelGrade,
        drawing: '',
        position: '',
        angle: '',
        note: '',
        edgeVisible: true
      }
    ]);
    setCheckedCuts({});
  };

  const applyAngleSymbol = (item, symbol) => {
    const raw = item.angle || '';
    const [angleSectionRaw, ...rest] = raw.split('|');
    const holeSuffix = rest.length > 0 ? ` | ${rest.join('|').trim()}` : '';
    const angleSection = (angleSectionRaw || '').trim();

    if (symbol === '°') {
      if (!angleSection) {
        updateItem(item.id, 'angle', `45° /${holeSuffix}`);
      } else if (!angleSection.includes('°')) {
        updateItem(item.id, 'angle', `${angleSection}°${holeSuffix}`);
      }
      return;
    }

    const parsed = parseDetailString(angleSection);
    const isDoubleTarget = ['//', '\\\\', '/\\', '\\/'].includes(symbol);

    let newAnglePart = '';
    if (parsed.hasAngle) {
      const deg1 = parsed.leftAngle ?? parsed.rightAngle ?? 45;
      const deg2 = parsed.rightAngle ?? deg1;
      newAnglePart = isDoubleTarget ? `${deg1}° ${symbol} ${deg2}°` : `${deg1}° ${symbol}`;
    } else {
      const m = angleSection.match(/(\d+(?:[.,]\d+)?)/);
      const deg = m ? m[1] : '45';
      newAnglePart = isDoubleTarget ? `${deg}° ${symbol} ${deg}°` : `${deg}° ${symbol}`;
    }

    updateItem(item.id, 'angle', `${newAnglePart}${holeSuffix}`);
  };

  const addHoleToItem = (item, diameter) => {
    const count = Math.max(1, parseInt(holeCountDraft, 10) || 1);
    const holeTag = `${count}× Ø ${diameter}`;
    const raw = (item.angle || '').trim();
    if (!raw) {
      updateItem(item.id, 'angle', holeTag);
    } else if (raw.includes('|')) {
      updateItem(item.id, 'angle', `${raw}, ${holeTag}`);
    } else if (/[Øø]/.test(raw) && !/[°/\\]/.test(raw)) {
      updateItem(item.id, 'angle', `${raw}, ${holeTag}`);
    } else {
      updateItem(item.id, 'angle', `${raw} | ${holeTag}`);
    }
    setOpenHolePickerId(null);
  };

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result || '';
        const base64 = String(result).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const renderPdfFirstPageToPngBase64 = async (file) => {
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/png').split(',')[1];
  };

  const ensureSheetJsLoaded = async () => {
    if (window.XLSX) return window.XLSX;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return window.XLSX;
  };

  const mapAiMaterialToGrade = (rawMat = '', profile = '') => {
    const m = String(rawMat || '').toUpperCase();
    if (m.includes('355')) return 'S355J2';
    if (
      m.includes('1.43') ||
      m.includes('1.44') ||
      m.includes('NEREZ') ||
      m.includes('AISI') ||
      m.includes('304') ||
      m.includes('316')
    ) {
      return '1.4301 (Nerez)';
    }
    if (m.includes('16MO') || m.includes('CRMO') || m.includes('ŽÁR') || m.includes('ZARUVZDOR')) {
      return '16Mo3 (Žáruvzdorná)';
    }
    if (m.includes('P235') || m.includes('P265') || m.includes('TLAK') || m.includes('KOTL')) {
      return 'P235GH (Tlaková)';
    }
    if (m.includes('ALMG') || m.includes('HLIN') || m.includes('AL ')) {
      return 'AlMgSi0.5 (Hliník)';
    }
    if (m.includes('235')) return 'S235JR';
    if (isPipeProfile(profile)) return 'P235GH (Tlaková)';
    return steelGrade;
  };

  const fetchWithBackoff = async (url, options, maxRetries = 3) => {
    let delay = 1000;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await fetch(url, options);
      if (response.status !== 429 && response.status < 500) {
        return response;
      }
      if (attempt === maxRetries) return response;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  };

  const callAiPayload = async (parts) => {
    const payload = {
      contents: [{ parts }],
      generationConfig: { responseMimeType: 'application/json' }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      if (!isPreview) {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.text || '';
          if (text) return text;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Chyba AI serveru (${res.status})`);
      }

      const apiKey = '';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      const response = await fetchWithBackoff(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Chyba AI serveru (${response.status})`);
      }
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const buildExtractionPrompt = (extraInstructions = '') => `Jsi strojírenský technolog. Přečti z tohoto podkladu (kusovník, tabulka, Excel nebo AutoCAD DXF výkres ocelové konstrukce) všechny položky hutního materiálu určené k řezání.
${extraInstructions}
Vrať POUZE čistý JSON ve formátu:
{
  "orderNumber": "číslo zakázky pokud existuje, jinak prázdný řetězec",
  "steelGrade": "jakost oceli např. S235JR, S355J2, 1.4301, P235GH, 16Mo3, AlMgSi0.5",
  "items": [
    {
      "length": 1500,
      "qty": 2,
      "profile": "Pl 20x2",
      "material": "jakost materiálu dané položky pokud je uvedena",
      "drawing": "číslo výkresu",
      "position": "pozice",
      "angle": "úhel řezu nebo vrtání např. 45° / | 2× Ø 14",
      "note": "poznámka"
    }
  ]
}
Pravidla:
- Délku vždy převeď na milimetry (celé číslo).
- Pokud u výkresu chybí počet kusů, doplň 1.
- Rozpoznávej profily podle velkoskladového značení: Pl (plocháč), L (úhelníky), IPE, HEA, HEB, UPN, JEKL, Tr. Ø, Kul. Ø, Hranol (čtyřhran).`;

  const applyExtractedJsonToState = (parsed, sourceLabel) => {
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      setErrorMessage(`Ze souboru (${sourceLabel}) se nepodařilo načíst žádné položky s délkou a počtem.`);
      return;
    }

    if (parsed.orderNumber) setOrderNumber(parsed.orderNumber);
    if (parsed.steelGrade) {
      setSteelGrade(mapAiMaterialToGrade(parsed.steelGrade));
    }

    const newItems = parsed.items
      .filter((it) => Number(it.length) > 0)
      .map((it, idx) => {
        const prof = it.profile || defaultProfile;
        return {
          id: Date.now() + idx,
          length: String(Math.round(Number(it.length))),
          qty: String(Math.max(1, Number(it.qty) || 1)),
          profile: prof,
          material: mapAiMaterialToGrade(it.material || parsed.steelGrade, prof),
          drawing: it.drawing || '',
          position: it.position || '',
          angle: it.angle || '',
          note: it.note || '',
          edgeVisible: true
        };
      });

    if (newItems.length === 0) {
      setErrorMessage('Nebyly nalezeny žádné platné délky v milimetrech.');
      return;
    }

    setItems(newItems);
    setShowResults(true);
    setSuccessMessage(`Úspěšně načteno ${newItems.length} položek (${sourceLabel}).`);
  };

  const handleFileUpload = async (event, isPdf = false) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    setErrorMessage('');
    setSuccessMessage('');
    setIsAnalyzing(true);
    setStatusMessage(isPdf ? 'Načítám PDF výkres...' : 'Analyzuji fotografii výkresu...');

    try {
      const base64 = await readFileAsBase64(file);
      const mimeType = file.type || (isPdf ? 'application/pdf' : 'image/jpeg');

      let parsed = null;
      try {
        const rawText = await callAiPayload([
          { text: buildExtractionPrompt() },
          { inlineData: { mimeType, data: base64 } }
        ]);
        parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      } catch (e) {
        if (e.message === 'AUTH_REVOKED') return;
        parsed = null;
      }

      if (isPdf && (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0)) {
        setStatusMessage('Převádím CAD PDF do obrazu ve vysokém rozlišení...');
        const pngBase64 = await renderPdfFirstPageToPngBase64(file);
        const rawText = await callAiPayload([
          { text: buildExtractionPrompt() },
          { inlineData: { mimeType: 'image/png', data: pngBase64 } }
        ]);
        parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      }

      applyExtractedJsonToState(parsed, isPdf ? 'PDF výkres' : 'Fotografie');
    } catch (err) {
      if (err.message === 'AUTH_REVOKED') return;
      if (err.name === 'AbortError') {
        setErrorMessage('Čtení dokumentu trvalo příliš dlouho. Zkuste prosím menší soubor nebo fotku.');
      } else {
        setErrorMessage('Nepodařilo se přečíst dokument. Zkontrolujte připojení nebo formát souboru.');
      }
    } finally {
      setIsAnalyzing(false);
      setStatusMessage('');
    }
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    setErrorMessage('');
    setSuccessMessage('');
    setIsAnalyzing(true);
    setStatusMessage(`Načítám tabulku MS Excel (${file.name})...`);

    try {
      const XLSX = await ensureSheetJsLoaded();
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      const sheetsData = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name];
        return {
          name,
          rows: XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }),
          csv: XLSX.utils.sheet_to_csv(sheet)
        };
      });

      const localItems = parseSpreadsheetRowsLocally(
        sheetsData,
        defaultProfile,
        steelGrade,
        mapAiMaterialToGrade
      );

      if (localItems.length > 0) {
        setItems(localItems);
        setShowResults(true);
        setSuccessMessage(
          `Přesně načteno ${localItems.length} položek přímo z MS Excelu (${file.name}).`
        );
        return;
      }

      setStatusMessage('Nestandardní hlavičky tabulky – rovnám kusovník pomocí AI...');
      const combinedCsv = sheetsData
        .map((s) => `--- LIST: ${s.name} ---\n${s.csv}`)
        .join('\n')
        .slice(0, 28000);

      const rawText = await callAiPayload([
        {
          text: `${buildExtractionPrompt('Níže je obsah tabulky z MS Excel (CSV):')}\n\n${combinedCsv}`
        }
      ]);
      const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      applyExtractedJsonToState(parsed, `MS Excel: ${file.name}`);
    } catch (err) {
      if (err.message === 'AUTH_REVOKED') return;
      setErrorMessage('Nepodařilo se přečíst Excel soubor. Zkontrolujte, že soubor není zamčený heslem.');
    } finally {
      setIsAnalyzing(false);
      setStatusMessage('');
    }
  };

  const handleDxfUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    setErrorMessage('');
    setSuccessMessage('');

    if (file.name.toLowerCase().endsWith('.dwg')) {
      setErrorMessage(
        'Soubor .DWG je uzavřený binární formát Autodesku. V AutoCADu zvolte Soubor → Uložit jako → AutoCAD DXF (.dxf) nebo Export do PDF a nahrajte jej sem.'
      );
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage(`Analyzuji AutoCAD výkres (${file.name})...`);

    try {
      const text = await file.text();
      const { texts, dimensions } = extractTextAndDimsFromDxf(text);

      if (texts.length === 0 && dimensions.length === 0) {
        setErrorMessage('V souboru DXF nebyly nalezeny žádné texty kusovníku ani zakótované rozměry.');
        return;
      }

      const dxfSummary = [
        `SOUBOR: ${file.name}`,
        texts.length > 0 ? `TEXTY A KUSOVNÍK Z DXF:\n${texts.join('\n')}` : '',
        dimensions.length > 0 ? `KÓTY (DIMENSION) Z DXF:\n${dimensions.join(', ')}` : ''
      ]
        .filter(Boolean)
        .join('\n\n')
        .slice(0, 28000);

      const rawText = await callAiPayload([
        {
          text: `${buildExtractionPrompt('Níže jsou vyextrahované texty, kusovník a kóty z AutoCAD výkresu (.dxf):')}\n\n${dxfSummary}`
        }
      ]);
      const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      applyExtractedJsonToState(parsed, `AutoCAD DXF: ${file.name}`);
    } catch (err) {
      if (err.message === 'AUTH_REVOKED') return;
      setErrorMessage('Nepodařilo se zpracovat DXF výkres. Ujistěte se, že jde o textový formát AutoCAD DXF.');
    } finally {
      setIsAnalyzing(false);
      setStatusMessage('');
    }
  };

  // ============================================================================
  // HLAVNÍ VÝPOČET (SESKUPENÍ PODLE PROFILU + DRUHU MATERIÁLU)
  // ============================================================================
  const calculation = useMemo(() => {
    const validItems = items.filter((it) => Number(it.length) > 0 && Number(it.qty) > 0);
    const groupsMap = new Map();

    validItems.forEach((it) => {
      const prof = (it.profile || defaultProfile || 'IPE 140').trim();
      const matId = it.material || steelGrade || 'S235JR';
      const groupKey = `${prof}__${matId}`;
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, { profileName: prof, materialId: matId, items: [] });
      }
      groupsMap.get(groupKey).items.push(it);
    });

    const stockOptions = [
      { nominalLength: 6000, label: '6 m', pricePerKg: Number(price6m) || 25 },
      { nominalLength: 12000, label: '12 m', pricePerKg: Number(price12m) || 28 },
      { nominalLength: 15000, label: '15 m', pricePerKg: Number(price15m) || 32 }
    ];

    const profileResults = [];
    let grandTotalBars = 0;
    let grandTotalMeters = 0;
    let grandPurchaseKg = 0;
    let grandPartsKg = 0;
    let grandStockKg = 0;
    let grandScrapKg = 0;
    let grandMaterialCost = 0;
    let grandCutCount = 0;

    groupsMap.forEach(({ profileName, materialId, items: groupItems }, groupKey) => {
      const gradeInfo = getGradeInfo(materialId);
      const allowanceMm = hasRollingAllowance(profileName, materialId)
        ? Math.max(0, Number(steelAllowance) || 0)
        : 0;
      const kgPerM = getProfileWeightPerMeter(profileName, defaultProfile, materialId);

      const variants = stockOptions.map((opt) => {
        const actualLength = opt.nominalLength + allowanceMm;
        const res = optimizeProfileGroup(
          groupItems,
          actualLength,
          Number(kerf) || 0,
          Number(stockLimit) || 0,
          addReserve,
          Number(trimCut) || 0,
          Number(clampMin) || 0,
          enforceClamp
        );
        const purchaseKg = (res.totalPurchasedMm / 1000) * kgPerM;
        const partsKg = (res.totalPartsMm / 1000) * kgPerM;
        const stockKg = (res.totalStockMm / 1000) * kgPerM;
        const scrapKg = (res.totalScrapMm / 1000) * kgPerM;
        const materialCost = purchaseKg * opt.pricePerKg;
        const cutsCost = res.totalCuts * (Number(cutPrice) || 0);
        return {
          ...opt,
          actualLength,
          allowanceMm,
          ...res,
          purchaseKg,
          partsKg,
          stockKg,
          scrapKg,
          materialCost,
          cutsCost,
          totalCost: materialCost + cutsCost
        };
      });

      const validVariants = variants.filter((v) => !v.oversized && v.totalBars > 0);
      const bestVariant =
        validVariants.length > 0
          ? validVariants.reduce((best, cur) => {
              if (Math.abs(cur.totalCost - best.totalCost) > 1) {
                return cur.totalCost < best.totalCost ? cur : best;
              }
              return cur.partsYieldPct > best.partsYieldPct ? cur : best;
            }, validVariants[0])
          : variants[0];

      const chosenNominal = selectedStockByProfile[groupKey] || bestVariant.nominalLength;
      const active =
        variants.find((v) => v.nominalLength === chosenNominal && !v.oversized) || bestVariant;

      grandTotalBars += active.totalBars;
      grandTotalMeters += active.totalPurchasedMm / 1000;
      grandPurchaseKg += active.purchaseKg;
      grandPartsKg += active.partsKg;
      grandStockKg += active.stockKg;
      grandScrapKg += active.scrapKg;
      grandMaterialCost += active.materialCost;
      grandCutCount += active.totalCuts;

      profileResults.push({
        groupKey,
        profileName,
        materialId,
        gradeInfo,
        allowanceMm,
        kgPerM,
        variants,
        bestNominalLength: bestVariant.nominalLength,
        active
      });
    });

    const grandCutsCost = grandCutCount * (Number(cutPrice) || 0);
    const grandTotalCost = grandMaterialCost + grandCutsCost;

    return {
      profileResults,
      grandTotalBars,
      grandTotalMeters,
      grandPurchaseKg,
      grandPartsKg,
      grandStockKg,
      grandScrapKg,
      grandMaterialCost,
      grandCutCount,
      grandCutsCost,
      grandTotalCost
    };
  }, [
    items,
    defaultProfile,
    steelGrade,
    kerf,
    trimCut,
    steelAllowance,
    clampMin,
    enforceClamp,
    stockLimit,
    addReserve,
    cutPrice,
    price6m,
    price12m,
    price15m,
    selectedStockByProfile
  ]);

  const handleCalculateClick = () => {
    setShowResults(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const triggerPrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 80);
  };

  const formatMoney = (val) => `${Math.round(val).toLocaleString('cs-CZ')} Kč`;
  const formatKg = (val) => (val > 0 && val < 1 ? val.toFixed(2) : val.toFixed(1));

  const buildPurchaseOrderText = () => {
    const today = new Date().toLocaleDateString('cs-CZ');
    const lines = [
      `OBJEDNÁVKA / POPTÁVKA HUTNÍHO MATERIÁLU`,
      `Zakázka: ${orderNumber || 'Bez čísla'} | Datum: ${today}`,
      `--------------------------------------------------------`
    ];

    calculation.profileResults.forEach(({ profileName, gradeInfo, allowanceMm, active }, idx) => {
      const totalBm = (active.totalPurchasedMm / 1000).toFixed(1);
      const lenDesc = allowanceMm > 0 ? `${active.label} (+${allowanceMm} mm)` : `${active.label} (přesná)`;
      lines.push(
        `${idx + 1}. ${profileName} | ${gradeInfo.id} | ${active.totalBars} ks × ${lenDesc} | celkem ${totalBm} bm (cca ${formatKg(active.purchaseKg)} kg)`
      );
    });

    lines.push(`--------------------------------------------------------`);
    lines.push(
      `CELKEM K OBJEDNÁNÍ: ${calculation.grandTotalBars} ks tyčí | ${calculation.grandTotalMeters.toFixed(1)} bm | cca ${calculation.grandPurchaseKg.toFixed(1)} kg`
    );

    if (purchaseNote.trim()) {
      lines.push(`Poznámka: ${purchaseNote.trim()}`);
    }

    return lines.join('\n');
  };

  const handleCopyPurchaseOrder = () => {
    const text = buildPurchaseOrderText();
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2500);
    } catch {
      setErrorMessage('Nepodařilo se zkopírovat text objednávky do schránky.');
    }
  };

  const handleDownloadPurchaseCsv = () => {
    const safeOrder = (orderNumber || 'ZAK-2026').replace(/[^a-zA-Z0-9_-]/g, '_');
    const header = [
      'POLOZKA',
      'PROFIL',
      'JAKOST',
      'OBCHODNI_DELKA_TYCE',
      'PRIDAVEK_MM',
      'POCET_TYCI_KS',
      'CELKEM_BM',
      'HMOTNOST_KG',
      'ORIENTACNI_CENA_KC_BEZ_DPH'
    ].join(';');

    const rows = [header];
    calculation.profileResults.forEach(({ profileName, gradeInfo, allowanceMm, active }, idx) => {
      rows.push(
        [
          idx + 1,
          profileName,
          gradeInfo.id,
          active.label,
          allowanceMm,
          active.totalBars,
          (active.totalPurchasedMm / 1000).toFixed(2).replace('.', ','),
          formatKg(active.purchaseKg).replace('.', ','),
          Math.round(active.materialCost)
        ].join(';')
      );
    });

    const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RIKVAN_${safeOrder}_OBJEDNAVKA.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const summary = buildPurchaseOrderText();
    if (navigator.share) {
      try {
        await navigator.share({ title: `RIKVAN ${orderNumber}`, text: summary });
        return;
      } catch {
        // zrušeno uživatelem
      }
    }
    handleCopyPurchaseOrder();
    setSuccessMessage('Sumárum pro nákup bylo zkopírováno do schránky.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ============================================================================
  // BRÁNA BETA ZÁMKU
  // ============================================================================
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-3 p-4">
        <RikvanLogo size={54} />
        <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          Ověřuji Beta přístup...
        </div>
      </div>
    );
  }

  if (authStatus === 'locked') {
    return (
      <BetaLockScreen
        isPreview={isPreview}
        onSubmitKey={(k) => verifyBetaKeyWithServer(k, false)}
        onBypassPreview={() => {
          setAuthError('');
          setAuthStatus('unlocked');
        }}
        authError={authError}
        isChecking={isAuthSubmitting}
      />
    );
  }

  // ============================================================================
  // RENDER 1: ČISTÝ NÁHLED TISKU A4 (DÍLNA / OBJEDNÁVKA PRO NÁKUP / EKONOMIKA)
  // ============================================================================
  if (view === 'print') {
    const showPurchaseOnScreen = previewTab === 'both' || previewTab === 'purchase';
    const showPlanOnScreen = previewTab === 'both' || previewTab === 'plan';
    const showEcoOnScreen = previewTab === 'both' || previewTab === 'economy';

    return (
      <div className="min-h-screen bg-slate-200/80 text-slate-900 pb-14">
        <style>{`
          @media print {
            @page { size: A4; margin: 10mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-hidden { display: none !important; }
            .a4-sheet {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
            }
          }
        `}</style>

        <CncExportModal
          isOpen={isCncModalOpen}
          onClose={() => setIsCncModalOpen(false)}
          calculation={calculation}
          orderNumber={orderNumber}
          kerf={kerf}
          trimCut={trimCut}
          clampMin={clampMin}
        />

        <div className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-300 px-3 py-3 shadow-sm">
          <div className="max-w-5xl mx-auto space-y-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                onClick={() => setView('editor')}
                className="h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm hover:bg-slate-200 transition whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                Zpět k výpočtu
              </button>

              <button
                onClick={() => setIsCncModalOpen(true)}
                className="h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm hover:bg-amber-400 shadow-sm transition whitespace-nowrap"
              >
                <Cpu className="w-4 h-4 shrink-0" />
                Export CNC
              </button>

              <button
                onClick={() => triggerPrint('purchase')}
                className="h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 shadow-sm transition whitespace-nowrap"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                Objednávka (PDF)
              </button>

              <button
                onClick={() => triggerPrint('plan')}
                className="h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm hover:bg-indigo-700 shadow-sm transition whitespace-nowrap"
              >
                <Printer className="w-4 h-4 shrink-0" />
                Tisk plánu (A4)
              </button>

              <button
                onClick={() => triggerPrint('economy')}
                className="h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 shadow-sm transition whitespace-nowrap col-span-2 sm:col-span-1"
              >
                <Calculator className="w-4 h-4 shrink-0" />
                Ekonomika (PDF)
              </button>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Náhled stránky A4:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold w-full sm:w-auto gap-1">
                <button
                  onClick={() => setPreviewTab('both')}
                  className={`h-8 px-3 rounded-lg transition whitespace-nowrap ${
                    previewTab === 'both' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Vše pod sebou
                </button>
                <button
                  onClick={() => setPreviewTab('purchase')}
                  className={`h-8 px-3 rounded-lg transition whitespace-nowrap ${
                    previewTab === 'purchase' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Objednávka
                </button>
                <button
                  onClick={() => setPreviewTab('plan')}
                  className={`h-8 px-3 rounded-lg transition whitespace-nowrap ${
                    previewTab === 'plan' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Dílenský plán
                </button>
                <button
                  onClick={() => setPreviewTab('economy')}
                  className={`h-8 px-3 rounded-lg transition whitespace-nowrap ${
                    previewTab === 'economy' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Ekonomika
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-6 space-y-6">
          {/* LIST 1: ČISTÁ OBJEDNÁVKA HUTNÍHO MATERIÁLU PRO DODAVATELE (BEZ INTERNÍCH CEN) */}
          {showPurchaseOnScreen && (
            <section
              className={`a4-sheet bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden ${
                printMode !== 'purchase' ? 'print-hidden' : ''
              }`}
            >
              <div className="p-4 sm:p-6 border-b-2 border-emerald-700 flex flex-wrap items-center justify-between gap-4 bg-emerald-50/40">
                <div className="flex items-center gap-3">
                  <RikvanLogo size={46} />
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-emerald-700" />
                      <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                        OBJEDNÁVKA / SUMÁRUM PRO NÁKUP MATERIÁLU
                      </h1>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Zakázka: <strong className="text-slate-900">{orderNumber || 'Bez čísla'}</strong> • Datum:{' '}
                      <strong>{new Date().toLocaleDateString('cs-CZ')}</strong>
                    </p>
                  </div>
                </div>

                <div className="no-print flex items-center gap-2">
                  <button
                    onClick={handleCopyPurchaseOrder}
                    className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-50 transition"
                  >
                    {copiedOrder ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedOrder ? 'Zkopírováno' : 'Kopírovat text'}
                  </button>
                  <button
                    onClick={() => triggerPrint('purchase')}
                    className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Tisk / PDF
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      <th className="py-3 px-3 text-center w-10">#</th>
                      <th className="py-3 px-3 whitespace-nowrap">Profil (Hutní materiál)</th>
                      <th className="py-3 px-3 whitespace-nowrap">Jakost / Značení</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">Délka tyče</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">Počet tyčí</th>
                      <th className="py-3 px-3 text-right whitespace-nowrap">Celkem (bm)</th>
                      <th className="py-3 px-3 text-right whitespace-nowrap">Váha cca (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs sm:text-sm tabular-nums">
                    {calculation.profileResults.map(
                      ({ groupKey, profileName, materialId, allowanceMm, active }, idx) => (
                        <tr key={groupKey}>
                          <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}.</td>
                          <td className="py-3 px-3 font-black text-slate-900 whitespace-nowrap">
                            {profileName}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <MaterialBadge gradeId={materialId} compact />
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="font-extrabold text-slate-900">{active.label}</span>
                            <span className="block text-[10px] text-slate-500 font-semibold">
                              {allowanceMm > 0 ? `s přídavkem +${allowanceMm} mm` : 'přesná délka'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-black text-sm">
                              {active.totalBars} ks
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                            {(active.totalPurchasedMm / 1000).toFixed(1)} m
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                            {formatKg(active.purchaseKg)} kg
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-50/70 border-t-2 border-emerald-300 font-black text-xs sm:text-sm tabular-nums">
                      <td colSpan={4} className="py-3.5 px-3 text-slate-900 uppercase tracking-wide">
                        CELKEM K OBJEDNÁNÍ ({calculation.profileResults.length} položek)
                      </td>
                      <td className="py-3.5 px-3 text-center text-emerald-800 text-base">
                        {calculation.grandTotalBars} ks
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-900">
                        {calculation.grandTotalMeters.toFixed(1)} m
                      </td>
                      <td className="py-3.5 px-3 text-right text-emerald-900 text-base">
                        {calculation.grandPurchaseKg.toFixed(1)} kg
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Poznámka pro dodavatele (atest, doprava, termín):
                </label>
                <input
                  type="text"
                  value={purchaseNote}
                  onChange={(e) => setPurchaseNote(e.target.value)}
                  placeholder="Např. Požadujeme atest 3.1, závoz do pátku..."
                  className="no-print w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                />
                {purchaseNote.trim() && (
                  <p className="hidden print:block text-xs font-semibold text-slate-800">
                    {purchaseNote}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* LIST 2: VÝROBNÍ ŘEZNÝ PLÁN PRO DÍLNU */}
          {showPlanOnScreen && (
            <section
              className={`a4-sheet bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden ${
                printMode !== 'plan' ? 'print-hidden' : ''
              }`}
            >
              <div className="p-4 sm:p-6 border-b-2 border-slate-900 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <RikvanLogo size={46} />
                  <div>
                    <div className="flex items-center gap-2">
                      <SawBladeIcon className="w-4 h-4 text-orange-600" />
                      <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        VÝROBNÍ ŘEZNÝ PLÁN
                      </h1>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Zakázka: <strong className="text-slate-900">{orderNumber || 'Bez čísla'}</strong> • Prořez:{' '}
                      {kerf} mm • Ořez čela: <strong>{trimCut} mm</strong> • Přídavek válc. profilů:{' '}
                      <strong>+{steelAllowance} mm</strong> (Trubky/Kul./Hranol/Jekl/Nerez/Al: 0 mm)
                    </p>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <div className="font-bold text-slate-800 uppercase tracking-wide">
                    Nákresy vždy v půdorysu • Délky = vnější L max
                  </div>
                  <div>Plná = viditelná hrana | Přerušovaná = skrytá</div>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Tyče ze skladu:
                  </span>
                  {calculation.profileResults.map(({ groupKey, profileName, materialId, allowanceMm, active }) => (
                    <span
                      key={groupKey}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-300 font-bold text-slate-800"
                    >
                      <MaterialBadge gradeId={materialId} compact />
                      <span>{profileName}:</span>
                      <span className="text-indigo-700">
                        {active.totalBars}× {active.label}
                        {allowanceMm > 0 ? ` (+${allowanceMm})` : ' (přesná)'}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300 text-[10px] sm:text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      <th className="py-2.5 px-2 text-center w-9 whitespace-nowrap">OK</th>
                      <th className="py-2.5 px-2.5 whitespace-nowrap">Tyč / Pozice</th>
                      <th className="py-2.5 px-2.5 whitespace-nowrap">Profil & Jakost</th>
                      <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Délka (L max)</th>
                      <th className="py-2.5 px-2 text-center whitespace-nowrap">Ks</th>
                      <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Zbytek</th>
                      <th className="py-2.5 px-2.5 whitespace-nowrap">Detail (Půdorys / Úhel / Díry)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                    {calculation.profileResults.map(({ groupKey, profileName, materialId, kgPerM, active }) =>
                      active.bars.map((bar) =>
                        bar.groupedCuts.map((cut, cutIdx) => {
                          const isFirstOnBar = cutIdx === 0;
                          const pieceWeight = formatKg((cut.length / 1000) * kgPerM);
                          const remWeight = formatKg((bar.remaining / 1000) * kgPerM);
                          const parsedCut = parseDetailString(cut.angle);
                          const cutKey = `${groupKey}-${bar.barNumber}-${cutIdx}`;
                          const isDone = !!checkedCuts[cutKey];

                          return (
                            <tr
                              key={cutKey}
                              className={`${isFirstOnBar ? 'border-t-2 border-slate-400' : ''} ${
                                isDone ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <td className="py-2.5 px-2 align-middle text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleCutDone(cutKey)}
                                  title="Odškrtnout uříznutou položku"
                                  className={`w-5 h-5 rounded border-2 inline-flex items-center justify-center transition ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-400 bg-white'
                                  }`}
                                >
                                  {isDone && <Check className="w-3.5 h-3.5" />}
                                </button>
                              </td>

                              <td className="py-2.5 px-2.5 align-middle whitespace-nowrap">
                                {isFirstOnBar && (
                                  <div className="flex flex-wrap items-center gap-1 mb-1">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold">
                                      Tyč #{bar.barNumber} ({bar.stockLength} mm)
                                    </span>
                                    {bar.trimCut > 0 && (
                                      <span className="px-1 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-bold">
                                        Ořez -{bar.trimCut}mm
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="text-xs font-extrabold text-slate-900 tabular-nums">
                                  {cut.drawing || '—'}
                                  {cut.position ? ` / poz. ${cut.position}` : ''}
                                </div>
                              </td>

                              <td className="py-2.5 px-2.5 align-middle whitespace-nowrap">
                                <div className="font-extrabold text-slate-900">{profileName}</div>
                                <div className="mt-0.5">
                                  <MaterialBadge gradeId={materialId} compact />
                                </div>
                              </td>

                              <td className="py-2.5 px-2.5 align-middle text-right whitespace-nowrap tabular-nums">
                                <div className="font-extrabold text-slate-900">
                                  {cut.length} <span className="text-[11px] font-medium text-slate-500">mm</span>
                                </div>
                                <div className="text-[11px] font-semibold text-indigo-600">
                                  {pieceWeight} kg/ks
                                </div>
                              </td>

                              <td className="py-2.5 px-2 align-middle text-center whitespace-nowrap tabular-nums">
                                <span className="font-black text-indigo-700 text-sm">{cut.count}×</span>
                              </td>

                              {isFirstOnBar && (
                                <td
                                  rowSpan={bar.groupedCuts.length}
                                  className="py-2.5 px-2.5 align-middle text-right whitespace-nowrap tabular-nums border-l border-slate-200 bg-slate-50/40"
                                >
                                  <div
                                    className={`font-extrabold ${
                                      bar.isStock ? 'text-emerald-700' : 'text-rose-600'
                                    }`}
                                  >
                                    {bar.remaining}{' '}
                                    <span className="text-[11px] font-medium opacity-75">mm</span>
                                  </div>
                                  <span
                                    className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                      bar.isStock
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    {bar.isStock ? `SKLAD • ${remWeight} kg` : `ŠROT • ${remWeight} kg`}
                                  </span>
                                  {bar.clampWarning && (
                                    <div className="mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-extrabold">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      Svěrák &lt;{clampMin}mm
                                    </div>
                                  )}
                                </td>
                              )}

                              <td className="py-2.5 px-2.5 align-middle border-l border-slate-200">
                                <CutDetailDiagram
                                  detail={cut.angle}
                                  profile={profileName}
                                  edgeVisible={cut.edgeVisible !== false}
                                  compact
                                />
                                {parsedCut.hasAngle && supportsOrientationToggle(profileName) && (
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {getOrientationLabels(profileName, cut.edgeVisible !== false).print}
                                  </div>
                                )}
                                {cut.note && (
                                  <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                                    {cut.note}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* LIST 3: INTERNÍ EKONOMICKÁ REKAPITULACE */}
          {showEcoOnScreen && (
            <section
              className={`a4-sheet bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden ${
                printMode !== 'economy' ? 'print-hidden' : ''
              }`}
            >
              <div className="p-4 sm:p-5 border-b-2 border-slate-900 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
                <div className="flex items-center gap-3">
                  <RikvanLogo size={40} />
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                      EKONOMICKÁ REKAPITULACE ZAKÁZKY
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold">
                      Zakázka: <strong className="text-slate-900">{orderNumber || 'Bez čísla'}</strong> • Ořez čela:{' '}
                      {trimCut} mm • Cena 1 řezu: {cutPrice} Kč
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => triggerPrint('economy')}
                  className="no-print h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Uložit ekonomiku (PDF)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="py-3 px-3 text-slate-600 whitespace-nowrap">Profil & Jakost</th>
                      <th className="py-3 px-3 text-right text-indigo-700 whitespace-nowrap">K nákupu</th>
                      <th className="py-3 px-3 text-right text-emerald-700 whitespace-nowrap">Čistá váha</th>
                      <th className="py-3 px-3 text-right text-teal-700 whitespace-nowrap">Na sklad</th>
                      <th className="py-3 px-3 text-right text-rose-600 whitespace-nowrap">Šrot</th>
                      <th className="py-3 px-3 text-right text-slate-900 whitespace-nowrap">Cena nákup</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs sm:text-sm tabular-nums">
                    {calculation.profileResults.map(
                      ({ groupKey, profileName, materialId, allowanceMm, active }) => (
                        <tr key={groupKey}>
                          <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{profileName}</span>
                              <MaterialBadge gradeId={materialId} compact />
                            </div>
                            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                              {active.totalBars}× {active.actualLength / 1000} m
                              {allowanceMm > 0 ? ` (${active.label} +${allowanceMm} mm)` : ' (přesná délka)'} •{' '}
                              {active.pricePerKg} Kč/kg
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo-700 whitespace-nowrap">
                            {formatKg(active.purchaseKg)} kg
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                            {formatKg(active.partsKg)} kg
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-teal-700 whitespace-nowrap">
                            {formatKg(active.stockKg)} kg
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-rose-600 whitespace-nowrap">
                            {formatKg(active.scrapKg)} kg
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                            {formatMoney(active.materialCost)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-300 font-extrabold text-xs sm:text-sm tabular-nums">
                      <td className="py-3 px-3 text-slate-900 whitespace-nowrap">CELKEM HMOTNOST</td>
                      <td className="py-3 px-3 text-right text-indigo-700 whitespace-nowrap">
                        {calculation.grandPurchaseKg.toFixed(1)} kg
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700 whitespace-nowrap">
                        {calculation.grandPartsKg.toFixed(1)} kg
                      </td>
                      <td className="py-3 px-3 text-right text-teal-700 whitespace-nowrap">
                        {calculation.grandStockKg.toFixed(1)} kg
                      </td>
                      <td className="py-3 px-3 text-right text-rose-600 whitespace-nowrap">
                        {calculation.grandScrapKg.toFixed(1)} kg
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 whitespace-nowrap">
                        {formatMoney(calculation.grandMaterialCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="bg-slate-900 text-white p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Nákup hutního materiálu
                  </div>
                  <div className="text-lg font-extrabold text-white mt-0.5">
                    {formatMoney(calculation.grandMaterialCost)}
                  </div>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                    <SawBladeIcon className="w-3.5 h-3.5 text-orange-400" />
                    Práce pily ({calculation.grandCutCount} řezů)
                  </div>
                  <div className="text-lg font-extrabold text-orange-300 mt-0.5">
                    {formatMoney(calculation.grandCutsCost)}
                  </div>
                </div>
                <div className="bg-indigo-600 rounded-xl p-3 border border-indigo-400">
                  <div className="text-[11px] uppercase tracking-wider text-indigo-100 font-semibold">
                    Celkem zakázka (bez DPH)
                  </div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {formatMoney(calculation.grandTotalCost)}
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
  // RENDER 2: HLAVNÍ EDITOR + SUMÁRUM PRO NÁKUP + ROZPAD TYČÍ + CNC EXPORT
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-4 px-3 sm:px-6 pb-20">
      <CncExportModal
        isOpen={isCncModalOpen}
        onClose={() => setIsCncModalOpen(false)}
        calculation={calculation}
        orderNumber={orderNumber}
        kerf={kerf}
        trimCut={trimCut}
        clampMin={clampMin}
      />

      <div className="max-w-3xl mx-auto space-y-4">
        <header className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3.5">
              <RikvanLogo size={48} />
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                  RIKVAN Řezný Plán
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Import PDF / Excel / AutoCAD (DXF), sumárum nákupu & CNC export
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs transition whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                Sdílet
              </button>
            </div>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, false)}
            className="hidden"
          />
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileUpload(e, true)}
            className="hidden"
          />
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelUpload}
            className="hidden"
          />
          <input
            ref={dxfInputRef}
            type="file"
            accept=".dxf,.dwg"
            onChange={handleDxfUpload}
            className="hidden"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={() => imageInputRef.current?.click()}
              className="h-11 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-sm transition disabled:opacity-60 whitespace-nowrap"
            >
              <Camera className="w-4 h-4 shrink-0" />
              Z fotky
            </button>
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={() => pdfInputRef.current?.click()}
              className="h-11 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-sm transition disabled:opacity-60 whitespace-nowrap"
            >
              <FileText className="w-4 h-4 shrink-0" />
              Z PDF
            </button>
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={() => excelInputRef.current?.click()}
              className="h-11 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-sm transition disabled:opacity-60 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              Z Excelu
            </button>
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={() => dxfInputRef.current?.click()}
              className="h-11 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm shadow-sm transition disabled:opacity-60 whitespace-nowrap"
            >
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              AutoCAD (DXF)
            </button>
          </div>

          {isAnalyzing && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
              <span>{statusMessage || 'Zpracovávám dokument...'}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-rose-500 hover:text-rose-700 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                className="text-emerald-600 hover:text-emerald-800 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </header>

        {/* NASTAVENÍ ZAKÁZKY, PILY A CEN */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              Nastavení zakázky, pily a cen
            </h2>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Parametry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Číslo zakázky
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ZAK-2026"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Výchozí jakost oceli
              </label>
              <select
                value={steelGrade}
                onChange={(e) => setSteelGrade(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-xs sm:text-sm"
              >
                {MATERIAL_GRADES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Výchozí profil
              </label>
              <select
                value={defaultProfile}
                onChange={(e) => setDefaultProfile(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-xs sm:text-sm"
              >
                {PROFILE_CATEGORIES.map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {PROFILE_CATALOG.filter((p) => p.category === cat).map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.weight} kg/m)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Prořez (mm)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={kerf}
                onChange={(e) => setKerf(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Ořez čela (mm)
              </label>
              <input
                type="number"
                min="0"
                value={trimCut}
                onChange={(e) => setTrimCut(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Přídavek tyče
              </label>
              <input
                type="number"
                min="0"
                value={steelAllowance}
                onChange={(e) => setSteelAllowance(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Svěrák (mm)
              </label>
              <input
                type="number"
                min="0"
                value={clampMin}
                onChange={(e) => setClampMin(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm tabular-nums"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Sklad od (mm)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={stockLimit}
                onChange={(e) => setStockLimit(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Cena 6 m (Kč/kg)
              </label>
              <input
                type="number"
                min="0"
                value={price6m}
                onChange={(e) => setPrice6m(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Cena 12 m (Kč/kg)
              </label>
              <input
                type="number"
                min="0"
                value={price12m}
                onChange={(e) => setPrice12m(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Cena 15 m (Kč/kg)
              </label>
              <input
                type="number"
                min="0"
                value={price15m}
                onChange={(e) => setPrice15m(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Cena 1 řezu (Kč)
              </label>
              <input
                type="number"
                min="0"
                value={cutPrice}
                onChange={(e) => setCutPrice(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={enforceClamp}
                onChange={(e) => setEnforceClamp(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Hlídat svěrák v plánu
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={addReserve}
                onChange={(e) => setAddReserve(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Přidat rezervu (+1 nejdelší kus)
            </label>
          </div>
        </section>

        {/* POŽADOVANÉ KUSY K NAŘEZÁNÍ */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              Požadované kusy ({items.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addItem}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Přidat kus
              </button>
              <button
                type="button"
                onClick={clearItems}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Vymazat
              </button>
            </div>
          </div>

          <datalist id="rikvan-profiles">
            {PROFILE_CATALOG.map((p) => (
              <option key={p.name} value={p.name} />
            ))}
          </datalist>

          <div className="space-y-3">
            {items.map((item, idx) => {
              const parsedItemDetail = parseDetailString(item.angle);
              const hasOrientToggle = supportsOrientationToggle(item.profile);
              const orientLabels = getOrientationLabels(item.profile, item.edgeVisible !== false);
              const isHolePickerOpen = openHolePickerId === item.id;
              const itemGrade = getGradeInfo(item.material || steelGrade);
              const itemHasAllowance = hasRollingAllowance(item.profile, item.material || steelGrade);

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-3 sm:p-3.5 space-y-2.5 transition ${
                    item.id === newlyAddedId
                      ? 'border-indigo-400 bg-indigo-50/30 ring-2 ring-indigo-100'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        #{idx + 1} Délka
                      </label>
                      <input
                        type="number"
                        autoFocus={item.id === newlyAddedId}
                        value={item.length}
                        onChange={(e) => updateItem(item.id, 'length', e.target.value)}
                        placeholder="1500"
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white font-extrabold text-sm text-indigo-700 tabular-nums"
                      />
                    </div>

                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Počet
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white font-extrabold text-sm text-center tabular-nums"
                      />
                    </div>

                    <div className="col-span-5 sm:col-span-3">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Profil
                      </label>
                      <input
                        list="rikvan-profiles"
                        value={item.profile}
                        onChange={(e) => updateItem(item.id, 'profile', e.target.value)}
                        placeholder="Pl 20x2 / Hranol 30x30"
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white font-bold text-xs sm:text-sm"
                      />
                    </div>

                    <div className="col-span-10 sm:col-span-4">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${itemGrade.dotClass}`} />
                        Druh materiálu ({itemGrade.colorName})
                      </label>
                      <select
                        value={item.material || steelGrade}
                        onChange={(e) => updateItem(item.id, 'material', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white font-bold text-xs"
                      >
                        {MATERIAL_GRADES.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <button
                        onClick={() => removeItem(item.id)}
                        title="Smazat položku"
                        className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5 sm:col-span-4">
                      <input
                        type="text"
                        value={item.drawing}
                        onChange={(e) => updateItem(item.id, 'drawing', e.target.value)}
                        placeholder="Výkres (např. V-01)"
                        className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <input
                        type="text"
                        value={item.position}
                        onChange={(e) => updateItem(item.id, 'position', e.target.value)}
                        placeholder="Pol."
                        className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-center"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-6 flex items-center justify-end gap-1.5 flex-wrap">
                      <MaterialBadge gradeId={item.material || steelGrade} compact />
                      <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">
                        {itemHasAllowance ? `+${steelAllowance} mm tyč` : 'Přesná tyč (+0)'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500">
                        Úhel / Vrtání
                      </label>
                      <div className="flex flex-wrap items-center gap-1">
                        {['°', '/', '\\', '//', '\\\\', '/\\', '\\/'].map((sym) => (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => applyAngleSymbol(item, sym)}
                            className="h-8 w-8 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 inline-flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 transition"
                          >
                            {sym}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setOpenHolePickerId(isHolePickerOpen ? null : item.id)
                          }
                          className="h-8 inline-flex items-center justify-center gap-1 px-2.5 rounded-lg bg-sky-50 border border-sky-300 text-xs font-bold text-sky-800 hover:bg-sky-100 transition whitespace-nowrap"
                        >
                          <DiameterSymbol className="w-3 h-3 shrink-0" />
                          Díra
                        </button>
                      </div>
                    </div>

                    {isHolePickerOpen && (
                      <div className="p-2.5 rounded-xl bg-sky-50/90 border border-sky-200 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-sky-900">
                            Počet děr a průměr (&lt; 45 mm):
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 4, 6].map((cnt) => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => setHoleCountDraft(String(cnt))}
                                className={`h-7 w-9 rounded-lg text-xs font-bold inline-flex items-center justify-center transition ${
                                  String(holeCountDraft) === String(cnt)
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-white text-sky-800 border border-sky-200'
                                }`}
                              >
                                {cnt}×
                              </button>
                            ))}
                            <div className="inline-flex items-center gap-1 pl-1">
                              <span className="text-[10px] font-bold text-sky-800 uppercase">
                                Jiný:
                              </span>
                              <input
                                type="number"
                                min="1"
                                max="999"
                                value={holeCountDraft}
                                onChange={(e) => setHoleCountDraft(e.target.value)}
                                className="w-14 h-7 px-1.5 rounded-lg border border-sky-300 bg-white text-xs font-extrabold text-sky-950 text-center tabular-nums"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                          {HOLE_DIAMETERS.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => addHoleToItem(item, d)}
                              className="h-8 w-full rounded-lg bg-white border border-sky-200 text-xs font-bold text-sky-900 hover:bg-sky-600 hover:text-white transition tabular-nums inline-flex items-center justify-center"
                            >
                              Ø{d}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={item.angle}
                        onChange={(e) => updateItem(item.id, 'angle', e.target.value)}
                        placeholder="např. 30° / | 22× Ø 14"
                        className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold"
                      />
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => updateItem(item.id, 'note', e.target.value)}
                        placeholder="Poznámka (např. Zabrousit)"
                        className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {(item.angle || (hasOrientToggle && parsedItemDetail.hasAngle)) && (
                    <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {parsedItemDetail.hasAngle ? 'Náhled (Půdorys):' : 'Detail vrtání:'}
                        </span>
                        <CutDetailDiagram
                          detail={item.angle}
                          profile={item.profile}
                          edgeVisible={item.edgeVisible !== false}
                        />
                      </div>

                      {hasOrientToggle && parsedItemDetail.hasAngle && (
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, 'edgeVisible', item.edgeVisible === false)}
                          className={`h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                            item.edgeVisible !== false
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item.edgeVisible !== false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              {orientLabels.button}
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              {orientLabels.button}
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

          <button
            onClick={handleCalculateClick}
            className="w-full h-12 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition"
          >
            <SawBladeIcon className="w-5 h-5 text-orange-400 shrink-0" />
            Porovnat a vypočítat plán
          </button>
        </section>

        {/* VÝSLEDKY VÝPOČTU + SUMÁRUM PRO NÁKUP + ROZPAD TYČÍ */}
        {showResults && calculation.profileResults.length > 0 && (
          <section ref={resultsRef} className="space-y-4 pt-1">
            {/* HLAVNÍ SOUHRN ZAKÁZKY */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                    <BarChart3 className="w-4 h-4" />
                    Výsledek optimalizace ({orderNumber || 'Zakázka'})
                  </div>
                  <div className="text-xl sm:text-2xl font-black mt-1 tabular-nums">
                    {formatMoney(calculation.grandTotalCost)}{' '}
                    <span className="text-xs font-semibold text-slate-400">bez DPH</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setPreviewTab('purchase');
                      setView('print');
                    }}
                    className="h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition whitespace-nowrap"
                  >
                    <ShoppingCart className="w-4 h-4 shrink-0" />
                    Objednávka
                  </button>
                  <button
                    onClick={() => {
                      setPreviewTab('plan');
                      setView('print');
                    }}
                    className="h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition whitespace-nowrap"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    Plán A4
                  </button>
                  <button
                    onClick={() => {
                      setPreviewTab('economy');
                      setView('print');
                    }}
                    className="h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition whitespace-nowrap"
                  >
                    <Calculator className="w-4 h-4 text-amber-400 shrink-0" />
                    Ekonomika
                  </button>
                  <button
                    onClick={() => setIsCncModalOpen(true)}
                    className="h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition whitespace-nowrap"
                  >
                    <Cpu className="w-4 h-4 shrink-0" />
                    CNC
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/80">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">K nákupu</div>
                  <div className="font-extrabold text-white text-sm mt-0.5">
                    {calculation.grandTotalBars} tyčí • {calculation.grandPurchaseKg.toFixed(1)} kg
                  </div>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/80">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Čistá váha</div>
                  <div className="font-extrabold text-emerald-400 text-sm mt-0.5">
                    {calculation.grandPartsKg.toFixed(1)} kg
                  </div>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/80">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Sklad / Šrot</div>
                  <div className="font-extrabold text-sm mt-0.5">
                    <span className="text-teal-300">{calculation.grandStockKg.toFixed(1)}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-rose-400">{calculation.grandScrapKg.toFixed(1)} kg</span>
                  </div>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/80">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Počet řezů</div>
                  <div className="font-extrabold text-orange-300 text-sm mt-0.5">
                    {calculation.grandCutCount}× ({formatMoney(calculation.grandCutsCost)})
                  </div>
                </div>
              </div>
            </div>

            {/* NOVÁ KARTA: SUMÁRUM PRO NÁKUP (CO PŘESNĚ OBJEDNAT VE VELKOSKLADU) */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-emerald-200 overflow-hidden">
              <div className="p-4 sm:p-5 bg-emerald-50/70 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 leading-tight">
                      Sumárum pro nákup (Objednávka tyčí)
                    </h2>
                    <p className="text-xs text-emerald-900/80 font-semibold mt-0.5">
                      Přesný přehled tyčí k objednání u dodavatele • změna 6/12/15 m níže se ihned promítne sem
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyPurchaseOrder}
                    className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition whitespace-nowrap"
                  >
                    {copiedOrder ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                    {copiedOrder ? 'Zkopírováno' : 'Kopírovat'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPurchaseCsv}
                    className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs transition whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    Excel CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewTab('purchase');
                      setView('print');
                    }}
                    className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5 shrink-0" />
                    PDF list
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-3 whitespace-nowrap">Profil & Jakost</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Objednat tyčí</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Celkem bm</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Váha (kg)</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Cena mat.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm tabular-nums">
                    {calculation.profileResults.map(
                      ({ groupKey, profileName, materialId, allowanceMm, active }) => (
                        <tr key={groupKey} className="hover:bg-emerald-50/30 transition">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-black text-slate-900">{profileName}</span>
                              <MaterialBadge gradeId={materialId} compact />
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                              {allowanceMm > 0
                                ? `Tyč ${active.label} + ${allowanceMm} mm přídavek (${active.actualLength} mm)`
                                : `Tyč ${active.label} přesná délka (${active.actualLength} mm)`}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs sm:text-sm">
                              {active.totalBars} ks × {active.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-700 whitespace-nowrap">
                            {(active.totalPurchasedMm / 1000).toFixed(1)} m
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                            {formatKg(active.purchaseKg)} kg
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-indigo-700 whitespace-nowrap">
                            {formatMoney(active.materialCost)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-50/60 border-t-2 border-emerald-200 font-black text-xs sm:text-sm tabular-nums">
                      <td className="py-3 px-3 text-slate-900 whitespace-nowrap">
                        CELKEM K NÁKUPU
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-800 whitespace-nowrap">
                        {calculation.grandTotalBars} ks tyčí
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 whitespace-nowrap">
                        {calculation.grandTotalMeters.toFixed(1)} m
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 whitespace-nowrap">
                        {calculation.grandPurchaseKg.toFixed(1)} kg
                      </td>
                      <td className="py-3 px-3 text-right text-indigo-800 whitespace-nowrap">
                        {formatMoney(calculation.grandMaterialCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* DETAILNÍ SROVNÁNÍ A GRAFICKÝ ROZPAD JEDNOTLIVÝCH PROFILŮ */}
            {calculation.profileResults.map(
              ({ groupKey, profileName, materialId, allowanceMm, kgPerM, variants, bestNominalLength, active }) => (
                <div
                  key={groupKey}
                  className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">{profileName}</h3>
                        <MaterialBadge gradeId={materialId} compact />
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {kgPerM} kg/m • díly: {(active.totalPartsMm / 1000).toFixed(2)} m •{' '}
                        {allowanceMm > 0
                          ? `tyč s přídavkem +${allowanceMm} mm`
                          : 'přesná délka tyče (bez přídavku)'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-extrabold tabular-nums">
                      {active.totalBars}× {active.actualLength / 1000} m ({formatKg(active.purchaseKg)} kg)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-stretch">
                    {variants.map((v) => {
                      const isSelected = active.nominalLength === v.nominalLength;
                      const isBest = bestNominalLength === v.nominalLength && !v.oversized;
                      return (
                        <button
                          key={v.nominalLength}
                          disabled={v.oversized}
                          onClick={() =>
                            setSelectedStockByProfile((prev) => ({
                              ...prev,
                              [groupKey]: v.nominalLength
                            }))
                          }
                          className={`relative text-left p-2.5 sm:p-3 rounded-xl border-2 flex flex-col justify-between h-full transition ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                              : v.oversized
                              ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="h-5 mb-1">
                              {isBest && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase tracking-wide">
                                  <Award className="w-2.5 h-2.5" />
                                  Nejlevnější
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline justify-between gap-1">
                              <span className="font-black text-sm sm:text-base text-slate-900">
                                {v.label}
                                {v.allowanceMm > 0 && (
                                  <span className="text-[10px] font-bold text-indigo-600 ml-0.5">
                                    +{v.allowanceMm}
                                  </span>
                                )}
                              </span>
                              <span className="text-xs font-extrabold text-indigo-700 tabular-nums">
                                {v.oversized ? 'Krátké' : `${v.totalBars} ks`}
                              </span>
                            </div>
                          </div>

                          {!v.oversized && (
                            <div className="mt-1.5 space-y-0.5 text-[11px] tabular-nums">
                              <div className="font-bold text-slate-700">
                                Díly {v.partsYieldPct.toFixed(0)} %
                              </div>
                              <div className="text-[10px] font-semibold text-slate-500">
                                {v.totalScrapMm > 0
                                  ? `Šrot ${v.totalScrapMm} mm`
                                  : `Sklad ${v.totalStockMm} mm`}
                              </div>
                              <div className="font-extrabold text-indigo-700 pt-0.5">
                                {formatMoney(v.totalCost)}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Grafický rozpad tyčí ({active.actualLength} mm • ořez čela {trimCut} mm)
                    </div>
                    {active.bars.map((bar) => (
                      <div key={bar.barNumber} className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold tabular-nums">
                          <span className="text-slate-800 flex items-center gap-1.5">
                            Tyč #{bar.barNumber} ({bar.stockLength} mm)
                            {bar.clampWarning && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                                <AlertTriangle className="w-3 h-3" />
                                Svěrák &lt; {clampMin} mm
                              </span>
                            )}
                          </span>
                          <span className={bar.isStock ? 'text-emerald-700' : 'text-rose-600'}>
                            Zbytek: {bar.remaining} mm ({bar.isStock ? 'SKLAD' : 'ŠROT'})
                          </span>
                        </div>

                        <div className="w-full h-7 rounded-lg overflow-hidden bg-slate-200 flex border border-slate-300">
                          {bar.trimCut > 0 && (
                            <div
                              style={{ width: `${Math.max((bar.trimCut / bar.stockLength) * 100, 1.8)}%` }}
                              title={`Ořez čela: ${bar.trimCut} mm`}
                              className="h-full bg-amber-400 text-amber-950 text-[8px] font-extrabold flex items-center justify-center border-r border-white/80 shrink-0"
                            >
                              {bar.trimCut}
                            </div>
                          )}
                          {bar.rawCuts.map((c, cIdx) => {
                            const widthPct = (c.length / bar.stockLength) * 100;
                            return (
                              <div
                                key={cIdx}
                                style={{ width: `${widthPct}%` }}
                                title={`${c.length} mm (${c.drawing || 'Kus'})`}
                                className="h-full bg-indigo-600 text-white text-[9px] sm:text-[10px] font-extrabold flex items-center justify-center border-r border-white/80 overflow-hidden px-0.5 truncate tabular-nums"
                              >
                                {widthPct > 5.5 ? c.length : ''}
                              </div>
                            );
                          })}
                          {bar.remaining > 0 && (
                            <div
                              style={{ width: `${(bar.remaining / bar.stockLength) * 100}%` }}
                              className={`h-full text-[9px] sm:text-[10px] font-extrabold flex items-center justify-center overflow-hidden px-0.5 truncate tabular-nums ${
                                bar.isStock
                                  ? 'bg-teal-400/90 text-teal-950'
                                  : bar.clampWarning
                                  ? 'bg-amber-300 text-amber-950'
                                  : 'bg-rose-400/90 text-rose-950'
                              }`}
                            >
                              {(bar.remaining / bar.stockLength) * 100 > 8 ? bar.remaining : ''}
                            </div>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium tabular-nums flex flex-wrap items-center justify-between gap-1">
                          <span>
                            Kusy:{' '}
                            <strong className="text-slate-700">
                              {bar.groupedCuts.map((g) => `${g.count}× ${g.length} mm`).join(' + ')}
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
              )
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => {
                  setPreviewTab('purchase');
                  setView('print');
                }}
                className="h-12 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
              >
                <ShoppingCart className="w-5 h-5 shrink-0" />
                Objednávka materiálu (PDF)
              </button>
              <button
                onClick={() => {
                  setPreviewTab('both');
                  setView('print');
                }}
                className="h-12 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
              >
                <Printer className="w-5 h-5 shrink-0" />
                Náhled tisku A4 a kalkulace
              </button>
              <button
                onClick={() => setIsCncModalOpen(true)}
                className="h-12 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
              >
                <Download className="w-5 h-5 shrink-0" />
                Export CNC (USB / LAN)
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
