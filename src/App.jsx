import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, PieChart, 
  AlignLeft, AlertCircle, Printer, FileText, CheckCircle2,
  TrendingUp, Layers, Eye, ArrowLeft, Camera, Loader2,
  Coins, Share2, RotateCcw
} from 'lucide-react';

export default function App() {
  // --- STAV APLIKACE ---
  const [kerf, setKerf] = useState(2); 
  const [addReserve, setAddReserve] = useState(false);
  const [minUsableLength, setMinUsableLength] = useState(1000); 
  
  // Ekonomika
  const [pricePerCut, setPricePerCut] = useState(15); 
  const [pricePerKg6m, setPricePerKg6m] = useState(25); 
  const [pricePerKg12m, setPricePerKg12m] = useState(28); 
  const [pricePerKg15m, setPricePerKg15m] = useState(32); 

  // Údaje o zakázce
  const [job, setJob] = useState({ orderNo: '', profile: 'IPE 140' });

  // Požadované řezy
  const [items, setItems] = useState([
    { id: 'init-1', profile: '', length: 1500, count: 2, drawingNo: 'V-01', itemNo: '1', detail: '45° / 45°', note: 'Zabrousit' },
    { id: 'init-2', profile: '', length: 2200, count: 3, drawingNo: 'V-02', itemNo: '5', detail: 'Kolejnice', note: '' }
  ]);
  
  // Výsledky a Stavy
  const [plans, setPlans] = useState(null);
  const [selectedPlanLength, setSelectedPlanLength] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [shareError, setShareError] = useState(false);
  
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Paleta barev
  const colorPalette = [
    'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 
    'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 
    'bg-fuchsia-600', 'bg-orange-600', 'bg-teal-600', 'bg-indigo-600'
  ];

  // --- MATEMATICKÝ MODUL (VÁHY) ---
  const getWeightPerMeter = (profileStr) => {
    if (!profileStr) return 0;
    const p = profileStr.toLowerCase().replace(/,/g, '.').replace(/\s+/g, '');
    const density = 0.00785;
    
    try {
      let m = p.match(/(?:tr\.|trubka|tr|tr\..*?ø|ø|d).*?(?:ø|d|o|0)?(\d+(?:\.\d+)?)(?:x|\*)(\d+(?:\.\d+)?)/);
      if (m) return Math.PI * (parseFloat(m[1]) - parseFloat(m[2])) * parseFloat(m[2]) * density;

      m = p.match(/(?:jekl|jkl|čtyřhran|obdélník).*?(\d+(?:\.\d+)?)(?:x|\*)(\d+(?:\.\d+)?)(?:(?:x|\*)(\d+(?:\.\d+)?))?/);
      if (m) {
        const a = parseFloat(m[1]), b = parseFloat(m[2]), t = m[3] ? parseFloat(m[3]) : b;
        return 2 * (a + (m[3] ? b : a) - 2 * t) * t * density;
      }

      m = p.match(/(?:kul\.|kulatina|kul\..*?ø|kr).*?(?:ø|d|o)?(\d+(?:\.\d+)?)/);
      if (m) return Math.PI * Math.pow(parseFloat(m[1]) / 2, 2) * density;

      m = p.match(/(?:pl\.|plochá|plocha|fl|pásovina).*?(\d+(?:\.\d+)?)(?:x|\*)(\d+(?:\.\d+)?)/);
      if (m) return parseFloat(m[1]) * parseFloat(m[2]) * density;

      const dict = {
        'hea100':16.7, 'hea120':19.9, 'hea140':24.7, 'hea160':30.4, 'hea180':35.5, 'hea200':42.3,
        'heb100':20.4, 'heb120':26.7, 'heb140':33.7, 'heb160':42.6, 'heb180':51.2, 'heb200':61.3,
        'ipe80':6.0, 'ipe100':8.1, 'ipe120':10.4, 'ipe140':12.9, 'ipe160':15.8, 'ipe180':18.8, 'ipe200':22.4, 'ipe220':26.2, 'ipe240':30.7,
        'u80':8.6, 'u100':10.6, 'u120':13.4, 'u140':16.0, 'u160':18.8, 'u180':22.0, 'u200':25.3,
        'upe80':7.9, 'upe100':9.8, 'upe120':12.1, 'upe140':14.5, 'upe160':17.0, 'upe180':19.7, 'upe200':22.8
      };
      for (let key in dict) {
        if (p.includes(key)) return dict[key];
      }
    } catch (e) {}
    return 0;
  };

  // --- MANIPULACE S FORMULÁŘEM ---
  const addItem = () => setItems([...items, { id: generateId(), profile: '', length: '', count: 1, drawingNo: '', itemNo: '', detail: '', note: '' }]);
  const removeItem = (id) => { if (items.length > 1) setItems(items.filter(item => item.id !== id)); };
  const clearAllItems = () => {
    setItems([{ id: generateId(), profile: '', length: '', count: 1, drawingNo: '', itemNo: '', detail: '', note: '' }]);
    setPlans(null);
    setSuccessMsg('');
  };
  const updateItem = (id, field, value) => setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  const updateJob = (field, value) => setJob({ ...job, [field]: value });

  const appendToDetail = (id, symbol) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      let cur = (item.detail || '').trim();
      cur = cur.replace(/°\s*(\d+(?:[.,]\d+)?)/g, '$1°');

      if (symbol === '°') {
        if (!cur) return { ...item, detail: '45°' };
        if (/\d$/.test(cur)) return { ...item, detail: `${cur}°` };
        if (!cur.includes('°')) return { ...item, detail: `${cur}°` };
        return { ...item, detail: cur };
      }

      const nums = cur.match(/\d+(?:[.,]\d+)?/g) || [];
      const firstAngle = nums[0] || '';
      const secondAngle = nums[1] || firstAngle;

      if (symbol === '/' || symbol === '\\') {
        if (firstAngle) return { ...item, detail: `${firstAngle}° ${symbol}` };
        return { ...item, detail: cur ? `${cur} ${symbol}` : `45° ${symbol}` };
      }

      if (symbol === '//' || symbol === '\\\\' || symbol === '/\\' || symbol === '\\/') {
        if (firstAngle) return { ...item, detail: `${firstAngle}° ${symbol} ${secondAngle}°` };
        return { ...item, detail: cur ? `${cur} ${symbol} ` : `45° ${symbol} 45°` };
      }

      return { ...item, detail: `${cur} ${symbol}`.trim() };
    }));
  };

  // --- POMOCNÁ FUNKCE: PŘEVOD PDF NA OBRÁZKY PŘES PDF.JS (ZÁLOŽNÍ METODA) ---
  const convertPdfToImages = async (file) => {
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images = [];
    const maxPages = Math.min(pdf.numPages, 3);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      images.push(dataUrl.split(',')[1]);
    }
    return images;
  };

  const parseSafeNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/,/g, '.').replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  // --- VOLÁNÍ GEMINI API (PODPORA VERCEL SERVERU I NÁHLEDU V CHATU) ---
  const callGeminiVision = async (inlineParts) => {
    const promptText = `Jsi zkušený mistr a technolog ve strojírenské výrobě.
Tvým úkolem je vyčíst z přiloženého dokumentu (což může být řezný plán, kusovník, tabulka materiálu, objednávka nebo výrobní výkres z CADu) všechny položky k nařezání.

PRAVIDLA PRO ČTENÍ:
1. Pokud je dokument TABULKA / KUSOVNÍK / ŘEZNÝ PLÁN:
   - Vytáhni každý řádek, který představuje tyčový materiál, profil, trubku, jekl, kulatinu, plochou ocel nebo díl s délkou.
   - Délku uveď v milimetrech (mm) jako číslo (např. pokud je napsáno "1500 mm" nebo "L=1500", délka je 1500; pokud je rozměr napsán jako "IPE 140 - 2200", profil je "IPE 140" a délka je 2200).
   - Pokud počet kusů (count) není v řádku uveden, nastav count na 1.
2. Pokud je dokument VÝROBNÍ VÝKRES JEDNOHO DÍLU (CAD výkres):
   - Najdi hlavní celkovou délku dílu (největší délkovou kótu v mm na výkresu) a ulož ji jako délku (length).
   - Z rohového razítka (tabulky vpravo dole) vyčti číslo výkresu (drawing), pozici/položku (item), profil/materiál (profile) a počet kusů (count - pokud není uveden, dej 1).
   - Pokud je na profilu zakótovaný úhlový řez jen z jedné strany (např. 12°), zapiš do detail pouze jeden úhel (např. "12°"). Dva úhly (např. "45° / 45°") zapiš pouze tehdy, když je profil seříznutý z obou stran.
3. Ignoruj čistě spojovací materiál (šrouby M8, matice, podložky), ale započítej všechny ocelové profily, trubky, kulatiny a přířezy.`;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: promptText },
          ...inlineParts
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            orderNo: { type: "STRING" },
            material: { type: "STRING" },
            cuts: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  profile: { type: "STRING" },
                  length: { type: "NUMBER" },
                  count: { type: "NUMBER" },
                  drawing: { type: "STRING" },
                  item: { type: "STRING" },
                  detail: { type: "STRING" },
                  note: { type: "STRING" }
                }
              }
            }
          }
        }
      }
    };

    // 1. Zkusit bezpečný vlastní server na Vercelu (/api/analyze)
    try {
      const serverRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (serverRes.ok) {
        return await serverRes.json();
      }
      // Pokud server existuje, ale hlásí chybu (např. chybějící API klíč na Vercelu), zobrazíme ji
      if (serverRes.status !== 404) {
        const errData = await serverRes.json().catch(() => ({}));
        throw new Error(errData.error || `Chyba serveru (${serverRes.status}).`);
      }
    } catch (e) {
      if (e.message && e.message.includes('Chyba serveru')) throw e;
      // Pokud /api/analyze neexistuje (např. běžíme v náhledu chatu), pokračujeme na přímé volání
    }

    // 2. Záložní přímé volání pro náhledové prostředí v chatu
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!fallbackRes.ok) {
        throw new Error(`Chyba spojení se serverem AI (${response.status}).`);
      }
      return await fallbackRes.json();
    }

    return await response.json();
  };

  const extractCutsFromResult = (result) => {
    if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) return null;
    let jsonText = result.candidates[0].content.parts[0].text;
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(jsonText);

    const rawCuts = Array.isArray(parsedData) 
      ? parsedData 
      : (parsedData.cuts || parsedData.items || parsedData.polozky || []);

    const validCuts = rawCuts
      .map(c => {
        const len = parseSafeNumber(c.length ?? c.delka);
        const cnt = Math.max(1, Math.round(parseSafeNumber(c.count ?? c.pocet ?? 1)));
        return {
          id: generateId(),
          profile: c.profile || c.material || parsedData.material || '',
          length: len,
          count: cnt,
          drawingNo: c.drawing || c.vykres || '',
          itemNo: c.item || c.polozka || '',
          detail: c.detail || c.uhel || '',
          note: c.note || c.poznamka || ''
        };
      })
      .filter(c => c.length > 0);

    return {
      orderNo: parsedData.orderNo || '',
      material: parsedData.material || (validCuts[0]?.profile) || '',
      cuts: validCuts
    };
  };

  // --- HLAVNÍ OBSLUHA NAHRÁNÍ SOUBORU (FOTKA I PDF) ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAnalyzing(true);
    setLoadingStep('Načítám soubor...');
    setError('');
    setSuccessMsg('');

    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const fileMimeType = isPdf ? 'application/pdf' : (file.type || 'image/jpeg');

      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
      });

      setLoadingStep(isPdf ? 'Analyzuji PDF dokument...' : 'Analyzuji fotku výkresu...');
      
      let extracted = null;

      try {
        const result = await callGeminiVision([
          { inlineData: { mimeType: fileMimeType, data: base64Data } }
        ]);
        extracted = extractCutsFromResult(result);
      } catch (directErr) {
        console.warn('Přímé čtení selhalo, zkouším záložní metodu:', directErr);
      }

      if (isPdf && (!extracted || extracted.cuts.length === 0)) {
        setLoadingStep('Převádím CAD PDF na obraz...');
        const pageImages = await convertPdfToImages(file);
        if (pageImages.length > 0) {
          setLoadingStep('Čtu vykreslený výkres...');
          const imageParts = pageImages.map(imgBase64 => ({
            inlineData: { mimeType: 'image/jpeg', data: imgBase64 }
          }));
          const fallbackResult = await callGeminiVision(imageParts);
          extracted = extractCutsFromResult(fallbackResult);
        }
      }

      if (extracted && extracted.cuts.length > 0) {
        if (extracted.material) {
          setJob(prev => ({ ...prev, profile: extracted.material }));
        }
        if (extracted.orderNo) {
          setJob(prev => ({ ...prev, orderNo: prev.orderNo || extracted.orderNo }));
        }

        setItems(prev => {
          const isOnlyDemo = prev.every(item => String(item.id).startsWith('init-'));
          return isOnlyDemo ? extracted.cuts : [...prev, ...extracted.cuts];
        });

        setSuccessMsg(`Úspěšně načteno ${extracted.cuts.length} položek z dokumentu "${file.name}".`);
      } else {
        setError('V dokumentu se nepodařilo najít žádné čitelné délky v mm. Zkuste prosím zkontrolovat, zda dokument obsahuje číselné rozměry.');
      }
    } catch (err) {
      console.error(err);
      setError(`Chyba při čtení souboru: ${err.message || 'Zkontrolujte připojení a zkuste to znovu.'}`);
    } finally {
      setIsAnalyzing(false);
      setLoadingStep('');
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  // --- VÝPOČET FFD ---
  const calculateFFD = (stockLength, parsedItems, safeKerf, minUsable) => {
    const invalidItems = parsedItems.filter(item => item.length > stockLength);
    if (invalidItems.length > 0) return null;

    const itemsByProfile = {};
    parsedItems.forEach(item => {
      const prof = (item.profile || job.profile || 'IPE 140').trim();
      if (!itemsByProfile[prof]) itemsByProfile[prof] = [];
      itemsByProfile[prof].push({ ...item, resolvedProfile: prof });
    });

    const bars = [];
    let totalPieces = 0;
    let totalLengthReq = 0;

    Object.keys(itemsByProfile).forEach(prof => {
      const profItems = itemsByProfile[prof];
      const weightPerMeter = getWeightPerMeter(prof);
      const flatCuts = [];

      profItems.forEach(item => {
        for (let i = 0; i < item.count; i++) {
          flatCuts.push({ 
            ...item, 
            profile: prof,
            weight: (item.length / 1000) * weightPerMeter 
          });
          totalPieces++;
          totalLengthReq += item.length;
        }
      });

      flatCuts.sort((a, b) => b.length - a.length);

      const profBars = [];
      flatCuts.forEach(cutObj => {
        let placed = false;
        for (let i = 0; i < profBars.length; i++) {
          const bar = profBars[i];
          const spaceNeeded = bar.cuts.length === 0 ? cutObj.length : cutObj.length + safeKerf;
          const remainingSpace = Math.round(bar.remaining * 100) / 100;
          
          if (remainingSpace >= spaceNeeded) {
            bar.cuts.push(cutObj);
            bar.remaining = Math.round((bar.remaining - spaceNeeded) * 100) / 100;
            placed = true;
            break;
          }
        }
        
        if (!placed) {
          profBars.push({
            id: generateId(),
            profile: prof,
            cuts: [cutObj],
            remaining: Math.round((stockLength - cutObj.length) * 100) / 100
          });
        }
      });

      bars.push(...profBars);
    });

    let totalWeightReq = 0;
    let totalWasteWeight = 0; 
    let totalUsableWeight = 0; 
    let totalPurchasedWeight = 0;

    const profileSummary = {};

    bars.forEach(bar => {
      const prof = bar.profile || job.profile || 'Nespecifikováno';
      const weightPerMeter = getWeightPerMeter(prof);
      bar.barWeight = (stockLength / 1000) * weightPerMeter;
      bar.isUsableRemnant = bar.remaining >= minUsable;
      
      const remWeight = (bar.remaining / 1000) * weightPerMeter;
      if (bar.isUsableRemnant) {
        bar.usableWeight = remWeight;
        bar.scrapWeight = 0;
        totalUsableWeight += remWeight;
      } else {
        bar.usableWeight = 0;
        bar.scrapWeight = remWeight;
        totalWasteWeight += remWeight;
      }
      
      totalPurchasedWeight += bar.barWeight;
      let barPartsWeight = 0;
      bar.cuts.forEach(cut => { 
        totalWeightReq += cut.weight; 
        barPartsWeight += cut.weight;
      });

      if (!profileSummary[prof]) {
        profileSummary[prof] = {
          profile: prof,
          barsCount: 0,
          purchasedWeight: 0,
          partsWeight: 0,
          usableWeight: 0,
          scrapWeight: 0,
          cutsCount: 0
        };
      }
      profileSummary[prof].barsCount += 1;
      profileSummary[prof].purchasedWeight += bar.barWeight;
      profileSummary[prof].partsWeight += barPartsWeight;
      profileSummary[prof].usableWeight += bar.usableWeight;
      profileSummary[prof].scrapWeight += bar.scrapWeight;
      profileSummary[prof].cutsCount += bar.cuts.length;
    });

    totalLengthReq = Math.round(totalLengthReq * 100) / 100;
    const totalUsedStock = bars.length * stockLength;
    const efficiency = totalUsedStock > 0 ? (totalLengthReq / totalUsedStock) * 100 : 0;
    const totalWaste = Math.round(bars.reduce((sum, bar) => sum + bar.remaining, 0) * 100) / 100;
    const totalScrapLength = Math.round(bars.reduce((sum, bar) => sum + (bar.isUsableRemnant ? 0 : bar.remaining), 0) * 100) / 100;
    const totalUsableLength = Math.round(bars.reduce((sum, bar) => sum + (bar.isUsableRemnant ? bar.remaining : 0), 0) * 100) / 100;
    
    let appliedPricePerKg = parseFloat(pricePerKg6m) || 0;
    if (stockLength > 6000 && stockLength <= 12000) appliedPricePerKg = parseFloat(pricePerKg12m) || 0;
    if (stockLength > 12000) appliedPricePerKg = parseFloat(pricePerKg15m) || 0;

    const totalCost = totalPurchasedWeight * appliedPricePerKg;

    return { 
      stockLength, bars, originalItems: parsedItems, totalCount: totalPieces, 
      totalLengthReq, totalUsedStock, efficiency, totalWaste, totalScrapLength, totalUsableLength,
      totalWeightReq, totalWasteWeight, totalUsableWeight, totalPurchasedWeight, totalCost, appliedPricePerKg,
      profileSummary: Object.values(profileSummary)
    };
  };

  const calculatePlans = () => {
    setError('');
    let parsedItems = items.map(item => ({
      ...item,
      length: parseFloat(item.length) || 0,
      count: parseInt(item.count) || 0,
    })).filter(item => item.length > 0 && item.count > 0);

    if (parsedItems.length === 0) {
      setError('Zadejte prosím alespoň jeden platný řez.');
      return;
    }

    if (addReserve) {
      const maxLenItem = [...parsedItems].sort((a,b) => b.length - a.length)[0];
      parsedItems.push({ ...maxLenItem, count: 1, isReserve: true, note: '(Rezerva)' });
    }

    const safeKerf = parseFloat(kerf) || 0;
    const minUsable = parseFloat(minUsableLength) || 0;
    const lengthsToTest = [6000, 12000, 15000];
    const generatedPlans = {};
    let bestLength = null;
    let maxEfficiency = -1;

    lengthsToTest.forEach(len => {
      const plan = calculateFFD(len, parsedItems, safeKerf, minUsable);
      generatedPlans[len] = plan;
      if (plan && plan.efficiency > maxEfficiency) {
        maxEfficiency = plan.efficiency;
        bestLength = len;
      }
    });

    const validPlans = Object.values(generatedPlans).filter(p => p !== null);
    if (validPlans.length === 0) {
      setError('Chyba: Některé řezy jsou příliš dlouhé i pro materiál 15m.');
      setPlans(null);
      return;
    }

    setPlans(generatedPlans);
    setSelectedPlanLength(bestLength || validPlans[0].stockLength);
  };

  const currentPlan = plans && selectedPlanLength ? plans[selectedPlanLength] : null;

  const colorMap = useMemo(() => {
    if (!currentPlan) return {};
    const uniqueLengths = [...new Set(currentPlan.originalItems.map(i => i.length))].sort((a, b) => b - a);
    const map = {};
    uniqueLengths.forEach((len, idx) => map[len] = colorPalette[idx % colorPalette.length]);
    return map;
  }, [currentPlan]);

  const getGroupedCuts = (cutsArray) => {
    const groups = {};
    cutsArray.forEach(cut => {
      const key = `${cut.profile}|${cut.length}|${cut.drawingNo}|${cut.itemNo}|${cut.detail}|${cut.note}`;
      if (!groups[key]) groups[key] = { ...cut, count: 0 };
      groups[key].count++;
    });
    return Object.values(groups).sort((a, b) => b.length - a.length);
  };

  const handleShare = () => {
    setShareError(true);
    setTimeout(() => setShareError(false), 8000);
  };

  // --- STROJÍRENSKÁ IKONA PILOVÉHO KOTOUČE ---
  const SawBladeIcon = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41" />
    </svg>
  );

  // --- HLAVNÍ PRŮMYSLOVÉ LOGO RIKVAN (VARIANTA 2: ŘEZ IPE PROFILEM) ---
  const RikvanLogo = ({ className = "w-8 h-8 sm:w-9 sm:h-9 shrink-0" }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <path d="M8 7h24v5H23v16h9v5H8v-5h9V12H8V7z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" strokeLinejoin="round" />
      <line x1="5" y1="29" x2="35" y2="11" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="5" y1="29" x2="35" y2="11" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />
      <circle cx="35" cy="11" r="2" fill="#fbbf24" />
      <path d="M35 11l3-3M35 11l4 1M35 11l1-4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  const AngleDrawing = ({ detail, profile }) => {
    if (!detail || !detail.trim()) {
      return <span className="text-[10px] sm:text-xs text-slate-400 font-medium">—</span>;
    }

    const raw = detail.trim();
    const normalizedText = raw.replace(/°\s*(\d+(?:[.,]\d+)?)/g, '$1°');

    const hasDegreeOrSlash = /[°\/\\]/.test(raw) || /^\d+(?:[.,]\d+)?$/.test(raw);
    if (!hasDegreeOrSlash) {
      return <span className="text-[10px] sm:text-xs text-slate-700 font-medium">{raw}</span>;
    }

    const isParallelSlash = raw.includes('//');
    const isParallelBackslash = raw.includes('\\\\');
    const isTrapUp = raw.includes('/\\');
    const isTrapDown = raw.includes('\\/');
    const isDoubleMultiplier = /2\s*[x×]/i.test(raw);

    const parseAngleVal = (str) => {
      if (!str) return 0;
      const m = str.match(/(\d+(?:[.,]\d+)?)/);
      if (!m) return 0;
      const val = parseFloat(m[1].replace(',', '.'));
      return (val === 90 || val <= 0 || val > 89) ? 0 : val;
    };

    const parts = normalizedText.split(/\/\/|\\\\|\/\\|\\\/|[\/\\\-+;]/).map(s => s.trim()).filter(Boolean);

    let leftAngle = 0;
    let rightAngle = 0;
    let leftDir = 'none';
    let rightDir = 'none';

    if (isParallelSlash || isParallelBackslash || isTrapUp || isTrapDown || isDoubleMultiplier) {
      const a1 = parseAngleVal(parts[0]);
      const a2 = parts.length >= 2 ? parseAngleVal(parts[1]) : a1;
      leftAngle = a1;
      rightAngle = a2 || a1;

      if (isParallelSlash) {
        leftDir = leftAngle > 0 ? 'slash' : 'none';
        rightDir = rightAngle > 0 ? 'slash' : 'none';
      } else if (isParallelBackslash) {
        leftDir = leftAngle > 0 ? 'backslash' : 'none';
        rightDir = rightAngle > 0 ? 'backslash' : 'none';
      } else if (isTrapUp) {
        leftDir = leftAngle > 0 ? 'slash' : 'none';
        rightDir = rightAngle > 0 ? 'backslash' : 'none';
      } else {
        leftDir = leftAngle > 0 ? 'backslash' : 'none';
        rightDir = rightAngle > 0 ? 'slash' : 'none';
      }
    } else if (parts.length >= 2) {
      leftAngle = parseAngleVal(parts[0]);
      rightAngle = parseAngleVal(parts[1]);
      if (raw.includes('\\')) {
        leftDir = leftAngle > 0 ? 'slash' : 'none';
        rightDir = rightAngle > 0 ? 'backslash' : 'none';
      } else {
        leftDir = leftAngle > 0 ? 'backslash' : 'none';
        rightDir = rightAngle > 0 ? 'slash' : 'none';
      }
    } else if (parts.length === 1) {
      const singleAngle = parseAngleVal(parts[0]);
      const isBackslash = raw.includes('\\');
      if (/^[\/\\]/.test(raw)) {
        leftAngle = singleAngle;
        leftDir = singleAngle > 0 ? (isBackslash ? 'backslash' : 'slash') : 'none';
      } else {
        rightAngle = singleAngle;
        rightDir = singleAngle > 0 ? (isBackslash ? 'backslash' : 'slash') : 'none';
      }
    }

    if (leftAngle === 0 && rightAngle === 0) {
      return <span className="text-[10px] sm:text-xs text-slate-700 font-medium">{normalizedText}</span>;
    }

    const p = (profile || '').toUpperCase();
    const isIProfile = p.includes('IPE') || p.includes('HE') || p.includes('INP');
    const isUProfile = p.includes('UPE') || p.match(/\bU\s*\d/);
    const isTube = p.includes('TR') || p.includes('JEKL');

    const leftAngled = leftAngle > 0 && leftDir !== 'none';
    const rightAngled = rightAngle > 0 && rightDir !== 'none';

    const getOffset = (ang) => Math.min(8, Math.max(4, Math.round((ang / 45) * 6.5)));
    const leftOffset = leftAngled ? getOffset(leftAngle) : 0;
    const rightOffset = rightAngled ? getOffset(rightAngle) : 0;

    const yTop = 8;
    const yBot = 20;
    const barH = yBot - yTop;

    const topLeftX = leftDir === 'slash' ? 6 + leftOffset : 6;
    const bottomLeftX = leftDir === 'backslash' ? 6 + leftOffset : 6;
    const topRightX = rightDir === 'backslash' ? 58 - rightOffset : 58;
    const bottomRightX = rightDir === 'slash' ? 58 - rightOffset : 58;

    const getLeftX = (y) => topLeftX + ((y - yTop) / barH) * (bottomLeftX - topLeftX);
    const getRightX = (y) => topRightX + ((y - yTop) / barH) * (bottomRightX - topRightX);

    const polygonPoints = `${topLeftX},${yTop} ${topRightX},${yTop} ${bottomRightX},${yBot} ${bottomLeftX},${yBot}`;

    const displayLabel = normalizedText.includes('°')
      ? normalizedText
      : (leftAngled && rightAngled ? `${leftAngle}° / ${rightAngle}°` : `${rightAngle || leftAngle}°`);

    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] sm:text-xs font-extrabold text-slate-900 whitespace-nowrap tabular-nums bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded">
          {displayLabel}
        </span>
        <svg width="64" height="22" viewBox="0 0 64 22" className="overflow-visible shrink-0">
          <polygon points={polygonPoints} fill="#f1f5f9" stroke="#334155" strokeWidth="1.2" strokeLinejoin="round" />

          {isIProfile && (
            <>
              <line x1={getLeftX(11) + 1} y1="11" x2={getRightX(11) - 1} y2="11" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2 1.5" />
              <line x1={getLeftX(17) + 1} y1="17" x2={getRightX(17) - 1} y2="17" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2 1.5" />
            </>
          )}
          {isUProfile && (
            <>
              <line x1={getLeftX(10.5) + 1} y1="10.5" x2={getRightX(10.5) - 1} y2="10.5" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2 1.5" />
              <line x1={getLeftX(13) + 1} y1="13" x2={getRightX(13) - 1} y2="13" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2 1.5" />
            </>
          )}
          {isTube && (
            <>
              <line x1={getLeftX(10.5) + 1} y1="10.5" x2={getRightX(10.5) - 1} y2="10.5" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="1.5 1" />
              <line x1={getLeftX(17.5) + 1} y1="17.5" x2={getRightX(17.5) - 1} y2="17.5" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="1.5 1" />
            </>
          )}

          {leftAngled && (
            <>
              <line x1="6" y1={yTop} x2="6" y2={yBot} stroke="#94a3b8" strokeWidth="0.7" strokeDasharray="1.5 1.5" />
              <path
                d={
                  leftDir === 'slash'
                    ? `M 6 ${yBot - 6} A 6 6 0 0 1 ${6 + leftOffset * 0.5} ${yBot - 5.5}`
                    : `M 6 ${yTop + 6} A 6 6 0 0 0 ${6 + leftOffset * 0.5} ${yTop + 5.5}`
                }
                fill="none"
                stroke="#ea580c"
                strokeWidth="1.1"
              />
              <line x1={topLeftX} y1={yTop} x2={bottomLeftX} y2={yBot} stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
              <text x="2" y="6" fill="#c2410c" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">
                {leftAngle}°
              </text>
            </>
          )}

          {rightAngled && (
            <>
              <line x1="58" y1={yTop} x2="58" y2={yBot} stroke="#94a3b8" strokeWidth="0.7" strokeDasharray="1.5 1.5" />
              <path
                d={
                  rightDir === 'slash'
                    ? `M 58 ${yTop + 6} A 6 6 0 0 1 ${58 - rightOffset * 0.5} ${yTop + 5.5}`
                    : `M 58 ${yBot - 6} A 6 6 0 0 0 ${58 - rightOffset * 0.5} ${yBot - 5.5}`
                }
                fill="none"
                stroke="#ea580c"
                strokeWidth="1.1"
              />
              <line x1={topRightX} y1={yTop} x2={bottomRightX} y2={yBot} stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
              <text x="62" y="6" textAnchor="end" fill="#c2410c" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">
                {rightAngle}°
              </text>
            </>
          )}
        </svg>
      </div>
    );
  };

  // ==========================================
  // RENDER NÁHLEDU TISKU
  // ==========================================
  if (isPreviewMode && currentPlan) {
    const totalCutCount = currentPlan.bars.reduce((sum, bar) => sum + bar.cuts.length, 0);
    const totalCutCost = totalCutCount * (parseFloat(pricePerCut) || 0);
    const totalMatCost = currentPlan.totalCost;

    return (
      <div className="min-h-screen bg-slate-200/80 py-3 sm:py-8 px-1.5 sm:px-4 flex flex-col items-center print:bg-white print:p-0 print:m-0 font-sans">
        
        <div className="sticky top-2 z-50 flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 print:hidden bg-slate-900/95 text-white backdrop-blur px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl shadow-xl border border-slate-700">
          <button onClick={() => setIsPreviewMode(false)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors border border-slate-600">
            <ArrowLeft className="w-4 h-4" /> Zpět
          </button>
          
          <div className="relative">
            <button onClick={handleShare} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors">
              <Share2 className="w-4 h-4" /> Sdílet
            </button>
            {shareError && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-2xl z-50 border border-slate-600">
                <p className="font-bold text-amber-400 mb-1">Jak uložit nebo poslat PDF?</p>
                <p className="opacity-90 leading-relaxed">Klikněte na modré tlačítko <b>Tisk</b> vedle a v systémovém okně vyberte <b>Uložit jako PDF</b>.</p>
              </div>
            )}
          </div>

          <button onClick={() => window.print()} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors">
            <Printer className="w-4 h-4" /> Tisk / PDF
          </button>
        </div>

        <div className="w-full max-w-[210mm] bg-white shadow-2xl rounded-xl sm:rounded-none px-2.5 py-5 sm:px-8 sm:py-10 md:px-10 md:py-12 text-slate-900 print:w-full print:max-w-none print:shadow-none print:p-0 relative flex flex-col mx-auto">
          
          <div className="border-2 border-slate-900 mb-5 sm:mb-6">
            <div className="bg-slate-900 text-white px-3 py-2 sm:px-4 sm:py-2.5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SawBladeIcon className="w-4 h-4 text-amber-400 print:hidden" />
                <span className="font-black text-xs sm:text-base tracking-widest uppercase">Výrobní Řezný Plán</span>
              </div>
              <span className="text-[10px] sm:text-xs font-mono text-slate-300 tabular-nums">
                RIKVAN INDUSTRIAL
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-slate-300 text-left bg-slate-50/50">
              <div className="p-2 sm:p-3">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Zakázka</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 truncate block mt-0.5">
                  {job.orderNo || "— Nezadáno —"}
                </span>
              </div>
              <div className="p-2 sm:p-3">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Výchozí tyč</span>
                <span className="text-xs sm:text-sm font-black text-indigo-700 tabular-nums block mt-0.5">
                  {selectedPlanLength} mm ({selectedPlanLength / 1000} m)
                </span>
              </div>
              <div className="p-2 sm:p-3">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Celkem tyčí / Řezů</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 tabular-nums block mt-0.5">
                  {currentPlan.bars.length} ks / {totalCutCount}× řez
                </span>
              </div>
              <div className="p-2 sm:p-3">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Využití (Prořez {kerf} mm)</span>
                <span className="text-xs sm:text-sm font-black text-emerald-700 tabular-nums block mt-0.5">
                  {currentPlan.efficiency.toFixed(1)} %
                </span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto print:overflow-visible mb-6">
            <table className="w-full border-collapse border-2 border-slate-900 text-left tabular-nums">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-900 text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="border-r border-slate-400 py-2 px-1.5 sm:px-2.5 text-center w-12">Tyč</th>
                  <th className="border-r border-slate-400 py-2 px-1.5 sm:px-2.5">Výkres / Pol.</th>
                  <th className="border-r border-slate-400 py-2 px-1.5 sm:px-2.5">Profil</th>
                  <th className="border-r border-slate-400 py-2 px-1.5 sm:px-2.5 text-right">Délka kusu</th>
                  <th className="border-r border-slate-400 py-2 px-1.5 sm:px-2 text-center w-9">Ks</th>
                  <th className="border-r border-slate-400 py-2 px-1.5 sm:px-2.5 text-right">Zbytek z tyče</th>
                  <th className="py-2 px-1.5 sm:px-2.5">Úhel / Pozn.</th>
                </tr>
              </thead>
              <tbody className="text-[10px] sm:text-xs">
                {currentPlan.bars.map((bar, bIdx) => {
                  const grouped = getGroupedCuts(bar.cuts);
                  return grouped.map((g, gIdx) => (
                    <tr 
                      key={`${bIdx}-${gIdx}`} 
                      className={`bg-white ${gIdx === 0 && bIdx > 0 ? 'border-t-2 border-slate-800' : 'border-t border-slate-300'}`}
                    >
                      {gIdx === 0 && (
                        <td 
                          rowSpan={grouped.length} 
                          className="border-r border-slate-400 py-2 px-1 sm:px-2 text-center align-middle bg-slate-50 whitespace-nowrap"
                        >
                          <div className="font-black text-xs sm:text-base text-slate-900 leading-none">
                            #{bIdx + 1}
                          </div>
                          {bar.barWeight > 0 && (
                            <div className="text-[8px] sm:text-[10px] font-semibold text-slate-500 mt-1 whitespace-nowrap">
                              {bar.barWeight.toFixed(1)} kg
                            </div>
                          )}
                        </td>
                      )}
                      
                      <td className="border-r border-slate-300 py-1.5 px-1.5 sm:px-2.5 font-semibold text-slate-800 whitespace-nowrap">
                        <span>{g.drawingNo || "—"}</span>
                        {g.itemNo && <span className="text-slate-500 font-normal"> / {g.itemNo}</span>}
                      </td>

                      <td className="border-r border-slate-300 py-1.5 px-1.5 sm:px-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {g.profile || job.profile || "—"}
                      </td>
                      
                      <td className="border-r border-slate-300 py-1.5 px-1.5 sm:px-2.5 text-right whitespace-nowrap">
                        <div className="font-black text-slate-900 text-[11px] sm:text-sm leading-tight">
                          {g.length} <span className="text-[9px] sm:text-[10px] font-normal text-slate-500">mm</span>
                        </div>
                        {g.weight > 0 && (
                          <div className="text-[8px] sm:text-[10px] font-semibold text-indigo-600 leading-tight mt-0.5">
                            {g.weight.toFixed(1)} kg/ks
                          </div>
                        )}
                      </td>
                      
                      <td className="border-r border-slate-300 py-1.5 px-1 sm:px-2 text-center font-black text-[11px] sm:text-sm text-indigo-700 bg-indigo-50/30 whitespace-nowrap">
                        {g.count}×
                      </td>

                      {gIdx === 0 && (
                        <td 
                          rowSpan={grouped.length} 
                          className="border-r border-slate-300 py-2 px-1.5 sm:px-2.5 text-right align-middle whitespace-nowrap bg-slate-50/40"
                        >
                          <div className={`font-black text-[11px] sm:text-sm leading-tight ${bar.remaining > 0 ? (bar.isUsableRemnant ? 'text-teal-700' : 'text-rose-600') : 'text-slate-700'}`}>
                            {bar.remaining} <span className="text-[9px] sm:text-[10px] font-normal text-slate-500">mm</span>
                          </div>
                          {bar.remaining > 0 ? (
                            <div className="mt-1">
                              <span className={`inline-block text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-tight ${bar.isUsableRemnant ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                                {bar.isUsableRemnant ? 'SKLAD' : 'ŠROT'} • {(bar.isUsableRemnant ? bar.usableWeight : bar.scrapWeight).toFixed(1)} kg
                              </span>
                            </div>
                          ) : (
                            <div className="text-[8px] sm:text-[9px] text-emerald-600 font-bold mt-0.5">Beze zbytku</div>
                          )}
                        </td>
                      )}

                      <td className="py-1.5 px-1.5 sm:px-2.5 text-left align-middle">
                        <AngleDrawing detail={g.detail} profile={g.profile || job.profile} />
                        {g.note && (
                          <div className="text-[8px] sm:text-[10px] text-slate-500 italic leading-tight mt-0.5">
                            {g.note}
                          </div>
                        )}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-2 page-break-inside-avoid print:hidden">
            <div className="bg-white border-2 border-slate-800 rounded-xl overflow-hidden shadow-sm">
              
              <div className="bg-slate-900 text-white px-3 py-2.5 sm:px-4 sm:py-3 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                  <h3 className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider">
                    Ekonomická a hmotnostní rekapitulace
                  </h3>
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Interní kalkulace • Netiskne se
                </span>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-right tabular-nums">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300 text-[9px] sm:text-[11px] font-extrabold uppercase text-slate-600 tracking-tight">
                      <th className="py-2.5 px-2 sm:px-3 text-left border-r border-slate-200">Profil</th>
                      <th className="py-2.5 px-1.5 sm:px-3 text-indigo-700 border-r border-slate-200 whitespace-nowrap">
                        Nákup <span className="font-normal text-[8px] sm:text-[10px] lowercase">(kg)</span>
                      </th>
                      <th className="py-2.5 px-1.5 sm:px-3 text-emerald-700 border-r border-slate-200 whitespace-nowrap">
                        Díly <span className="font-normal text-[8px] sm:text-[10px] lowercase">(kg)</span>
                      </th>
                      <th className="py-2.5 px-1.5 sm:px-3 text-teal-700 border-r border-slate-200 whitespace-nowrap">
                        Sklad <span className="font-normal text-[8px] sm:text-[10px] lowercase">(kg)</span>
                      </th>
                      <th className="py-2.5 px-1.5 sm:px-3 text-rose-600 border-r border-slate-200 whitespace-nowrap">
                        Šrot <span className="font-normal text-[8px] sm:text-[10px] lowercase">(kg)</span>
                      </th>
                      <th className="py-2.5 px-2 sm:px-3 text-slate-900 whitespace-nowrap">
                        Materiál <span className="font-normal text-[8px] sm:text-[10px]">(bez DPH)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px] sm:text-xs font-bold">
                    {currentPlan.profileSummary.map((ps, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-2 sm:px-3 text-left text-slate-900 font-extrabold border-r border-slate-200 whitespace-nowrap">
                          {ps.profile}
                          <span className="block sm:inline sm:ml-1.5 text-[9px] font-medium text-slate-400">
                            ({ps.barsCount}× tyč)
                          </span>
                        </td>
                        <td className="py-2 px-1.5 sm:px-3 text-indigo-700 border-r border-slate-200 whitespace-nowrap">
                          {ps.purchasedWeight.toFixed(1)} <span className="text-[9px] font-normal text-indigo-400">kg</span>
                        </td>
                        <td className="py-2 px-1.5 sm:px-3 text-emerald-700 border-r border-slate-200 whitespace-nowrap">
                          {ps.partsWeight.toFixed(1)} <span className="text-[9px] font-normal text-emerald-500">kg</span>
                        </td>
                        <td className="py-2 px-1.5 sm:px-3 text-teal-700 border-r border-slate-200 whitespace-nowrap">
                          {ps.usableWeight.toFixed(1)} <span className="text-[9px] font-normal text-teal-500">kg</span>
                        </td>
                        <td className="py-2 px-1.5 sm:px-3 text-rose-600 border-r border-slate-200 whitespace-nowrap">
                          {ps.scrapWeight.toFixed(1)} <span className="text-[9px] font-normal text-rose-400">kg</span>
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-slate-900 font-extrabold whitespace-nowrap bg-slate-50/50">
                          {Math.round(ps.purchasedWeight * currentPlan.appliedPricePerKg).toLocaleString('cs-CZ')} Kč
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-slate-100 border-t-2 border-slate-400 text-xs sm:text-sm font-black">
                      <td className="py-2.5 px-2 sm:px-3 text-left text-slate-900 border-r border-slate-300 whitespace-nowrap">
                        CELKEM
                      </td>
                      <td className="py-2.5 px-1.5 sm:px-3 text-indigo-800 border-r border-slate-300 whitespace-nowrap">
                        {currentPlan.totalPurchasedWeight.toFixed(1)} <span className="text-[9px] font-normal">kg</span>
                      </td>
                      <td className="py-2.5 px-1.5 sm:px-3 text-emerald-800 border-r border-slate-300 whitespace-nowrap">
                        {currentPlan.totalWeightReq.toFixed(1)} <span className="text-[9px] font-normal">kg</span>
                      </td>
                      <td className="py-2.5 px-1.5 sm:px-3 text-teal-800 border-r border-slate-300 whitespace-nowrap">
                        {currentPlan.totalUsableWeight.toFixed(1)} <span className="text-[9px] font-normal">kg</span>
                      </td>
                      <td className="py-2.5 px-1.5 sm:px-3 text-rose-700 border-r border-slate-300 whitespace-nowrap">
                        {currentPlan.totalWasteWeight.toFixed(1)} <span className="text-[9px] font-normal">kg</span>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-slate-900 whitespace-nowrap bg-slate-200/70">
                        {Math.round(totalMatCost).toLocaleString('cs-CZ')} Kč
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-900 text-white px-3 py-3 sm:px-5 sm:py-3.5 border-t border-slate-800 grid grid-cols-3 gap-2 items-center tabular-nums">
                <div>
                  <span className="block text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Nákup materiálu ({currentPlan.appliedPricePerKg} Kč/kg)</span>
                  <span className="text-xs sm:text-base font-extrabold text-white whitespace-nowrap">
                    {Math.round(totalMatCost).toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
                <div className="border-l border-slate-700 pl-2.5 sm:pl-4">
                  <span className="block text-[9px] sm:text-[10px] text-amber-400 uppercase font-semibold">Práce pily ({totalCutCount}× řez)</span>
                  <span className="text-xs sm:text-base font-extrabold text-amber-300 whitespace-nowrap">
                    + {Math.round(totalCutCost).toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
                <div className="border-l border-slate-700 pl-2.5 sm:pl-4 text-right">
                  <span className="block text-[9px] sm:text-[10px] text-emerald-400 uppercase font-bold">Celkem zakázka (bez DPH)</span>
                  <span className="text-sm sm:text-lg font-black text-emerald-300 whitespace-nowrap">
                    {Math.round(totalMatCost + totalCutCost).toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-8 pt-4 border-t-2 border-slate-800 flex flex-row justify-between items-center text-[10px] sm:text-xs text-slate-600 gap-2 tabular-nums">
            <p>Prořez pily: <b>{kerf} mm</b> | Sklad od: <b>{minUsableLength} mm</b></p>
            <p>Využití materiálu: <b className="text-slate-900">{currentPlan.efficiency.toFixed(1)} %</b></p>
            <p className="hidden sm:block">Podpis operátora: .......................................</p>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A4 portrait; margin: 1cm; }
            body { background-color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}} />
      </div>
    );
  }

  // ==========================================
  // RENDER HLAVNÍHO ROZHRANÍ
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-10 relative z-10">
      
      <datalist id="eu-profiles">
        <option value="HEA 100" />
        <option value="HEA 120" />
        <option value="HEB 200" />
        <option value="IPE 140" />
        <option value="UPE 100" />
        <option value="JEKL 100 x 6" />
        <option value="Tr. Ø 101,6 x 5" />
        <option value="Kul. Ø 40" />
      </datalist>

      <div className="p-2 sm:p-4 md:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="bg-slate-900 text-white p-2.5 rounded-2xl shrink-0 shadow-md border border-slate-700">
              <RikvanLogo />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">RIKVAN Řezný Plán</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">PROFI</span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm">Optimalizace hutního materiálu, čtení výkresů a ekonomika</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2.5">
            <input 
              type="file" 
              ref={imageInputRef} 
              accept="image/*, .jpg, .jpeg, .png, .webp" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
            />
            <input 
              type="file" 
              ref={pdfInputRef} 
              accept=".pdf, application/pdf" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
            />
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => imageInputRef.current?.click()}
                disabled={isAnalyzing}
                className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 text-emerald-600" />}
                {isAnalyzing ? (loadingStep || "Načítám...") : "Z fotky"}
              </button>
              <button 
                onClick={() => pdfInputRef.current?.click()}
                disabled={isAnalyzing}
                className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-emerald-600" />}
                {isAnalyzing ? (loadingStep || "Načítám...") : "Z PDF"}
              </button>
            </div>
            
            {currentPlan && (
              <button 
                onClick={() => setIsPreviewMode(true)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Eye className="w-4 h-4" /> Náhled tisku a kalkulace
              </button>
            )}
          </div>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-900 text-xs sm:text-sm flex items-center justify-between gap-3 rounded-r-xl shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <p className="font-bold">{successMsg}</p>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-xs font-semibold text-emerald-700 underline shrink-0">Skrýt</button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-900 text-xs sm:text-sm flex items-start gap-3 rounded-r-xl shadow-sm">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
            <div className="flex-1">
              <h3 className="font-bold text-red-950 mb-0.5">Upozornění</h3>
              <p className="font-medium break-words">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
          
          <div className="xl:col-span-6 space-y-4 sm:space-y-6">
            
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Nastavení zakázky a stroje
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Číslo zakázky</label>
                  <input type="text" value={job.orderNo} onChange={e => updateJob('orderNo', e.target.value)} placeholder="ZAK-2026" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-sm font-semibold focus:border-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Hlavní profil (výchozí pro výpočet váhy)</label>
                  <input type="text" list="eu-profiles" value={job.profile} onChange={e => updateJob('profile', e.target.value)} placeholder="Např. HEB 200, Jekl 40x40" className="w-full px-3 py-2 bg-indigo-50/60 border border-indigo-300 rounded-lg outline-none text-sm text-indigo-950 font-bold focus:border-indigo-600" />
                </div>

                <div className="sm:col-span-3 border-t border-slate-100 pt-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 tabular-nums">
                  
                  <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-2.5">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prořez pily (mm)</label>
                      <input type="number" min="0" step="0.1" value={kerf} onChange={(e) => setKerf(e.target.value)} className="w-full px-2.5 py-1 outline-none text-sm font-black text-slate-800 bg-white border border-slate-300 rounded-md" />
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Limit Sklad (mm)</label>
                      <input type="number" min="0" step="100" value={minUsableLength} onChange={(e) => setMinUsableLength(e.target.value)} className="w-full px-2.5 py-1 outline-none text-sm font-black text-teal-700 bg-white border border-slate-300 rounded-md" />
                    </div>
                  </div>

                  <div className="md:col-span-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative flex items-center justify-center shrink-0">
                        <input type="checkbox" checked={addReserve} onChange={(e) => setAddReserve(e.target.checked)} className="peer sr-only" />
                        <div className="w-8 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight">Rezerva (+1 nejdelší)</span>
                    </label>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                        <SawBladeIcon className="w-3.5 h-3.5 text-indigo-600" /> Cena 1 řezu (Kč)
                      </label>
                      <input type="number" min="0" step="1" value={pricePerCut} onChange={(e) => setPricePerCut(e.target.value)} className="w-full px-2.5 py-1 outline-none text-sm font-black text-indigo-700 text-center bg-white border border-slate-300 rounded-md" />
                    </div>
                  </div>

                  <div className="md:col-span-5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-600" /> Nákupní cena oceli (Kč/kg)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                       <div className="bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col items-center">
                         <span className="text-[9px] bg-slate-100 text-slate-600 w-full text-center py-0.5 border-b border-slate-200 font-bold">Do 6m</span>
                         <input type="number" value={pricePerKg6m} onChange={(e) => setPricePerKg6m(e.target.value)} className="w-full px-1 py-1 outline-none text-xs font-black text-indigo-700 text-center" />
                       </div>
                       <div className="bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col items-center">
                         <span className="text-[9px] bg-amber-50 text-amber-800 w-full text-center py-0.5 border-b border-slate-200 font-bold">Do 12m</span>
                         <input type="number" value={pricePerKg12m} onChange={(e) => setPricePerKg12m(e.target.value)} className="w-full px-1 py-1 outline-none text-xs font-black text-amber-700 text-center" />
                       </div>
                       <div className="bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col items-center">
                         <span className="text-[9px] bg-rose-50 text-rose-800 w-full text-center py-0.5 border-b border-slate-200 font-bold">Do 15m</span>
                         <input type="number" value={pricePerKg15m} onChange={(e) => setPricePerKg15m(e.target.value)} className="w-full px-1 py-1 outline-none text-xs font-black text-rose-700 text-center" />
                       </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlignLeft className="w-5 h-5 text-indigo-600" /> Požadované kusy ({items.length})
                </h2>
                <div className="flex items-center gap-1.5">
                  <button onClick={clearAllItems} className="text-slate-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold">
                    <RotateCcw className="w-3.5 h-3.5" /> Vymazat
                  </button>
                  <button onClick={addItem} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs sm:text-sm font-bold">
                    <Plus className="w-4 h-4" /> Přidat kus
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar tabular-nums">
                {items.map((item, index) => (
                  <div key={item.id} className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/90 relative transition-all focus-within:border-indigo-400 focus-within:bg-white">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      
                      <div className="col-span-5 sm:col-span-3">
                        <label className="block text-[9px] font-extrabold text-slate-500 mb-1 uppercase">
                          #{index + 1} • Délka (mm)
                        </label>
                        <input type="number" min="0.1" step="0.1" value={item.length} onChange={(e) => updateItem(item.id, 'length', e.target.value)} className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg outline-none text-sm font-black text-indigo-700" />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[9px] font-extrabold text-slate-500 mb-1 uppercase">Počet</label>
                        <input type="number" min="1" value={item.count} onChange={(e) => updateItem(item.id, 'count', e.target.value)} className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg outline-none text-sm text-center font-black text-slate-900" />
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <label className="block text-[9px] font-extrabold text-slate-500 mb-1 uppercase">Profil</label>
                        <input type="text" list="eu-profiles" value={item.profile || ''} onChange={(e) => updateItem(item.id, 'profile', e.target.value)} placeholder={job.profile || "profil"} className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg outline-none text-xs font-bold text-slate-900" />
                      </div>
                      <div className="col-span-10 sm:col-span-3">
                        <label className="block text-[9px] font-extrabold text-slate-500 mb-1 uppercase">Výkres / Pol.</label>
                        <div className="flex gap-1">
                          <input type="text" value={item.drawingNo} onChange={(e) => updateItem(item.id, 'drawingNo', e.target.value)} placeholder="výkres" className="w-2/3 py-1.5 px-2 bg-white border border-slate-300 rounded-lg outline-none text-xs font-medium" />
                          <input type="text" value={item.itemNo} onChange={(e) => updateItem(item.id, 'itemNo', e.target.value)} placeholder="pol." className="w-1/3 py-1.5 px-1 bg-white border border-slate-300 rounded-lg outline-none text-xs text-center font-medium" />
                        </div>
                      </div>
                      
                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                         <button onClick={() => removeItem(item.id)} disabled={items.length === 1} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="col-span-6">
                        <label className="flex justify-between items-center text-[9px] font-extrabold text-slate-500 mb-1 uppercase flex-wrap gap-1">
                          <span>Úhel</span>
                          <div className="flex gap-1 flex-wrap">
                             <button type="button" title="Vložit stupně (°)" onClick={() => appendToDetail(item.id, '°')} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-1.5 rounded text-[10px] font-bold">°</button>
                             <button type="button" title="Jednostranný řez (/)" onClick={() => appendToDetail(item.id, '/')} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-1.5 rounded text-[10px] font-bold">/</button>
                             <button type="button" title="Opačný jednostranný řez (\)" onClick={() => appendToDetail(item.id, '\\')} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-1.5 rounded text-[10px] font-bold">\</button>
                             <button type="button" title="Rovnoběžný řez (//)" onClick={() => appendToDetail(item.id, '//')} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-1.5 rounded text-[10px] font-bold">//</button>
                             <button type="button" title="Opačný rovnoběžný řez (\\)" onClick={() => appendToDetail(item.id, '\\\\')} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-1.5 rounded text-[10px] font-bold">\\</button>
                             <button type="button" title="Lichoběžník užší nahoře (/\)" onClick={() => appendToDetail(item.id, '/\\')} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-1.5 rounded text-[10px] font-bold">/\</button>
                             <button type="button" title="Lichoběžník užší dole (\/)" onClick={() => appendToDetail(item.id, '\\/')} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-1.5 rounded text-[10px] font-bold">\/</button>
                          </div>
                        </label>
                        <input type="text" value={item.detail} onChange={(e) => updateItem(item.id, 'detail', e.target.value)} placeholder="např. 25° // 25° nebo 25° \\ 25°" className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg outline-none text-xs font-semibold" />
                        {item.detail && item.detail.trim() !== '' && (
                          <div className="mt-1.5 px-2 py-1 bg-white rounded-md border border-slate-200 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Náhled řezu:</span>
                            <AngleDrawing detail={item.detail} profile={item.profile || job.profile} />
                          </div>
                        )}
                      </div>
                      <div className="col-span-6">
                        <label className="block text-[9px] font-extrabold text-slate-500 mb-1 uppercase">Poznámka</label>
                        <input type="text" value={item.note} onChange={(e) => updateItem(item.id, 'note', e.target.value)} placeholder="volitelné instrukce" className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg outline-none text-xs" />
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              <button onClick={calculatePlans} className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                <PieChart className="w-5 h-5" /> Porovnat a vypočítat plán
              </button>
            </div>
          </div>

          <div className="xl:col-span-6">
            {plans ? (
              <div className="space-y-4 sm:space-y-6 tabular-nums">
                
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" /> Porovnání nakupovaných délek tyčí
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[6000, 12000, 15000].map(len => {
                      const planInfo = plans[len];
                      const isSelected = selectedPlanLength === len;
                      const bestEff = Math.max(...Object.values(plans).filter(p => p !== null).map(p => p.efficiency));
                      const isBest = planInfo && planInfo.efficiency === bestEff;

                      if (!planInfo) {
                        return (
                          <div key={len} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 opacity-60 flex flex-col items-center justify-center text-center min-h-[120px]">
                            <p className="text-base font-bold text-slate-400">{len/1000} m</p>
                            <p className="text-[11px] text-rose-500 mt-1 font-medium">Nelze použít (dlouhé kusy)</p>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={len} 
                          onClick={() => setSelectedPlanLength(len)}
                          className={`cursor-pointer border-2 rounded-xl p-3.5 relative transition-all flex flex-col justify-between min-h-[125px]
                            ${isSelected ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/10' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                        >
                          {isBest && (
                            <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3" /> Nejvyšší výtěžnost
                            </div>
                          )}
                          
                          <div className="flex justify-between items-baseline mb-2 pt-0.5">
                            <span className="text-lg font-black text-slate-900">{len/1000} m</span>
                            <span className={`text-base font-black ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                              {planInfo.efficiency.toFixed(1)} %
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-xs border-t border-slate-200/80 pt-2">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Počet tyčí:</span>
                              <span className="font-bold text-slate-900">{planInfo.bars.length} ks</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Šrot:</span>
                              <span className="font-bold text-rose-600">{planInfo.totalWasteWeight.toFixed(1)} kg</span>
                            </div>
                            {planInfo.totalCost > 0 && (
                                <div className="flex justify-between pt-1 border-t border-slate-200/80">
                                  <span className="text-slate-600 font-semibold">Materiál:</span>
                                  <span className="font-black text-slate-900">{Math.round(planInfo.totalCost).toLocaleString('cs-CZ')} Kč</span>
                                </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {currentPlan && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80">
                    <div className="mb-4 border-b border-slate-100 pb-3 flex flex-wrap justify-between items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-600" /> 
                        Grafický rozpad tyčí ({selectedPlanLength/1000} m)
                      </h2>
                      <button 
                        onClick={() => setIsPreviewMode(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Tabulkový náhled a ceny
                      </button>
                    </div>
                    
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                      {currentPlan.bars.map((bar, index) => (
                        <div key={bar.id} className="space-y-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                          <div className="flex justify-between items-center gap-2 text-xs">
                            <div className="font-bold text-slate-800 truncate">
                              Tyč #{index + 1} • <span className="text-indigo-700">{bar.profile}</span>
                              {bar.barWeight > 0 && <span className="text-slate-500 font-normal ml-1">({bar.barWeight.toFixed(1)} kg)</span>}
                            </div>
                            <span className="text-slate-600 whitespace-nowrap shrink-0">
                              Zbytek: <strong className={bar.isUsableRemnant ? 'text-teal-700' : 'text-rose-600'}>{bar.remaining} mm</strong>
                            </span>
                          </div>
                          
                          <div className="w-full h-9 sm:h-11 bg-slate-200/70 rounded-lg flex overflow-hidden shadow-inner border border-slate-300">
                            {bar.cuts.map((cutObj, idx) => {
                              const cutLength = cutObj.length;
                              const cutPercent = (cutLength / selectedPlanLength) * 100;
                              const kerfPercent = (kerf / selectedPlanLength) * 100;
                              return (
                                <React.Fragment key={idx}>
                                  {idx > 0 && kerf > 0 && (
                                    <div style={{ width: `${kerfPercent}%`, minWidth: '1px' }} className="h-full bg-slate-900" />
                                  )}
                                  <div 
                                    style={{ width: `${cutPercent}%` }} 
                                    className={`h-full ${cutObj.isReserve ? 'bg-amber-500 striped-bg-amber' : colorMap[cutLength]} flex flex-col justify-center items-center text-white border-r border-white/25 transition-all hover:brightness-110 relative overflow-hidden whitespace-nowrap px-0.5`} 
                                    title={`Délka: ${cutLength} mm | Profil: ${cutObj.profile} | Váha: ${(cutObj.weight || 0).toFixed(1)} kg`}
                                  >
                                    <span className="text-[10px] sm:text-xs font-extrabold truncate block w-full text-center drop-shadow">
                                      {cutPercent > 5 ? cutLength : ''}
                                    </span>
                                  </div>
                                </React.Fragment>
                              );
                            })}
                            {bar.remaining > 0 && (
                              <div 
                                style={{ width: `${(bar.remaining / selectedPlanLength) * 100}%` }} 
                                className={`h-full flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold overflow-hidden whitespace-nowrap ${bar.isUsableRemnant ? 'text-teal-800 bg-teal-100/80 striped-bg-teal' : 'text-rose-700 bg-rose-100/70 striped-bg-rose'}`}
                              >
                                {((bar.remaining / selectedPlanLength) * 100) > 8 ? (bar.isUsableRemnant ? 'SKLAD' : 'ŠROT') : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[300px] sm:min-h-[500px] bg-white/60 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <Camera className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-base sm:text-lg font-bold text-slate-600 mb-1">Žádná data k výpočtu</p>
                <p className="text-xs sm:text-sm max-w-sm mx-auto text-slate-500">Vyplňte kusy vlevo nebo nahrajte dokument přes tlačítka <b>Z fotky</b> / <b>Z PDF</b> a klikněte na <b>Porovnat a vypočítat plán</b>.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .striped-bg-amber { background-image: repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.9), rgba(245, 158, 11, 0.9) 8px, rgba(217, 119, 6, 0.9) 8px, rgba(217, 119, 6, 0.9) 16px); }
        .striped-bg-teal { background-image: repeating-linear-gradient(45deg, rgba(20, 184, 166, 0.12), rgba(20, 184, 166, 0.12) 6px, rgba(20, 184, 166, 0.24) 6px, rgba(20, 184, 166, 0.24) 12px); }
        .striped-bg-rose { background-image: repeating-linear-gradient(45deg, rgba(244, 63, 94, 0.08), rgba(244, 63, 94, 0.08) 6px, rgba(244, 63, 94, 0.18) 6px, rgba(244, 63, 94, 0.18) 12px); }
        .page-break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        @media (min-width: 640px) { .custom-scrollbar::-webkit-scrollbar { width: 6px; } }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}} />
    </div>
  );
}