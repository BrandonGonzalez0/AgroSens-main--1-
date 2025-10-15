import React, { useState, useEffect, useMemo, useRef } from "react";
import { float32ToBase64 } from './lib/heatmapUtils';
import InstallPromptIOS from './InstallPromptIOS';
import logo from "./logo.png";
import { motion } from "framer-motion";
import { validarCultivo, sugerirCultivos, cultivos } from "./ServiciosCultivos";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import SuggestedCarousel from './SuggestedCarousel';
import TelemetryDashboard from './TelemetryDashboard';
import cultivosDB from "./data/cultivos.json";
import { enqueueItem, getPendingItems, addReadingLocally } from './lib/offlineDB';
import { flushQueue } from './lib/sync';
import WeatherRotator from './WeatherRotator';

// Normaliza un nombre para buscar en cultivosDB (quita acentos, espacios y minúsculas)
function normalizeKey(name) {
  if (!name) return "";
  return name
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Devuelve una sugerencia breve según el parámetro y su rango
function getSuggestionFor(paramLabel, value, range) {
  if (!range || !Array.isArray(range)) return 'Revisar condiciones del cultivo.';
  const v = Number(value);
  if (isNaN(v)) return 'Introduce un valor numérico válido.';

  if (paramLabel.toLowerCase().includes('ph')) {
    if (v < range[0]) return 'Aumentar pH: aplicar cal agrícola y monitorizar cada semana.';
    if (v > range[1]) return 'Reducir pH: aplicar azufre o enmiendas ácidas.';
  }

  if (paramLabel.toLowerCase().includes('humedad')) {
    if (v < range[0]) return 'Incrementar humedad: aumentar riego o mulching.';
    if (v > range[1]) return 'Reducir humedad: mejorar drenaje y reducir riegos.';
  }

  if (paramLabel.toLowerCase().includes('temperatura')) {
    if (v < range[0]) return 'Aumentar temperatura: coberturas, invernadero o calefacción.';
    if (v > range[1]) return 'Reducir temperatura: sombreo, ventilación o mallas.';
  }

  return 'Ajustar según buenas prácticas agronómicas.';
}

// --- Carta de cultivo ---
function CultivoCard({ cultivo, onClick, selected }) {
  // cultivo: { nombre, ph, humedad, temperatura, imagen }
  return (
    <motion.button
      onClick={() => onClick(cultivo)}
      layout
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`text-left bg-white dark:bg-gray-800 rounded-2xl shadow p-3 transition-colors focus:outline-none border-2 ${
        selected ? "border-green-400" : "border-transparent"
      }`}
    >
      <div className="w-full h-36 overflow-hidden rounded-xl mb-3">
        <img
          src={cultivo.imagen}
          alt={cultivo.nombre}
          className="w-full h-full object-cover hover:opacity-90 transition-opacity pointer-events-none"
        />
      </div>
      <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-1">{cultivo.nombre}</h3>
      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
        <div><strong>pH:</strong> {cultivo.ph}</div>
        <div><strong>Humedad:</strong> {cultivo.humedad}</div>
        <div><strong>Temp.:</strong> {cultivo.temperatura}</div>
      </div>
    </motion.button>
  );
}

function DetallePanel({ item, onClose, currentPh, currentHum, currentTemp }) {
  const [showRecs, setShowRecs] = useState(false);
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    // reset when item changes
    setShowRecs(false);
    setRecs([]);
  }, [item]);

  if (!item) return null;

  const buildRecommendations = () => {
    const list = [];
    const db = cultivosDB[item.nombre.toLowerCase()];
    const phVal = parseFloat(currentPh);
    const humVal = parseFloat(currentHum);
    const tempVal = parseFloat(currentTemp);

    if (db && Array.isArray(db.ph)) {
      if (!isNaN(phVal)) {
        if (phVal < db.ph[0]) list.push({ id: 'ph_low', text: 'Aumentar pH: aplicar cal agrícola (monitorizar cada semana).', done: false });
        else if (phVal > db.ph[1]) list.push({ id: 'ph_high', text: 'Reducir pH: aplicar azufre o enmiendas ácidas.', done: false });
      }
    }

    if (db && Array.isArray(db.humedad)) {
      if (!isNaN(humVal)) {
        if (humVal < db.humedad[0]) list.push({ id: 'hum_low', text: 'Incrementar humedad: aumentar riego/uso de mulching.', done: false });
        else if (humVal > db.humedad[1]) list.push({ id: 'hum_high', text: 'Reducir humedad: mejorar drenaje y reducir riegos.', done: false });
      }
    }

    if (db && Array.isArray(db.temperatura)) {
      if (!isNaN(tempVal)) {
        if (tempVal < db.temperatura[0]) list.push({ id: 'temp_low', text: 'Aumentar temperatura: considerar invernadero o coberturas.', done: false });
        else if (tempVal > db.temperatura[1]) list.push({ id: 'temp_high', text: 'Reducir temperatura: sombreo, ventilación o mallas.', done: false });
      }
    }

    // Si no hay reglas específicas, ofrecer recomendaciones generales
    if (list.length === 0) {
      list.push({ id: 'general1', text: 'Realizar análisis de suelo completo antes de decisiones mayores.', done: false });
      list.push({ id: 'general2', text: 'Mejorar materia orgánica para retención de agua y nutrientes.', done: false });
    }

    return list;
  };

  const onToggleRec = (id) => {
    setRecs((prev) => {
      const updated = prev.map(r => r.id === id ? { ...r, done: !r.done } : r);
      try {
        const key = `recsProgress:${normalizeKey(item.nombre)}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.warn('No se pudo guardar progreso en localStorage', e);
      }
      return updated;
    });
  };

  const onShowRecs = () => {
    // Si la DB del cultivo tiene pasos de siembra, usarlos como recomendaciones seleccionables
    try {
      const db = cultivosDB[item.nombre.toLowerCase()];
      if (db && Array.isArray(db.siembra) && db.siembra.length > 0) {
        const built = db.siembra.map((text, i) => ({ id: `siembra-${i}`, text, done: false }));
        // intentar restaurar progreso desde localStorage
        try {
          const key = `recsProgress:${normalizeKey(item.nombre)}`;
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            // merge by id
            for (const b of built) {
              const found = parsed.find(p => p.id === b.id);
              if (found) b.done = !!found.done;
            }
          }
        } catch (e) {
          // ignore restore errors
        }
        setRecs(built);
        setShowRecs(true);
        return;
      }
    } catch (e) {
      // ignore and fall back
    }

    const built = buildRecommendations();
    // intentar restaurar progreso para recomendaciones generadas
    try {
      const key = `recsProgress:${normalizeKey(item.nombre)}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const b of built) {
          const found = parsed.find(p => p.id === b.id);
          if (found) b.done = !!found.done;
        }
      }
    } catch (e) {
      // ignore
    }
    setRecs(built);
    setShowRecs(true);
  };

  const doneCount = recs.filter(r => r.done).length;
  const progress = recs.length ? Math.round((doneCount / recs.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full md:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
      <div className="w-full h-36 mb-3 overflow-hidden rounded-xl">
        <a href={item.imagen} target="_blank" rel="noreferrer">
          <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
        </a>
      </div>
      <h2 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">{item.nombre}</h2>
      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>pH ideal:</strong> {item.ph}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Humedad:</strong> {item.humedad}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Temperatura:</strong> {item.temperatura}</p>
      <div className="mt-4 flex gap-2">
        <button onClick={onClose} className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm">Cerrar</button>
        <button onClick={onShowRecs} className="px-3 py-2 rounded-lg bg-green-700 text-white text-sm">Ver recomendaciones</button>
      </div>

      {showRecs && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Progreso: {progress}%</div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-3">
            <div className="h-2 rounded-full bg-green-500" style={{ width: `${progress}%` }} />
          </div>
          <ul className="space-y-2">
            {recs.map(r => (
              <li key={r.id} className="flex items-center gap-2">
                <input type="checkbox" checked={r.done} onChange={() => onToggleRec(r.id)} />
                <span className={`text-sm ${r.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pasos de siembra (estáticos) sólo cuando no se muestran las recomendaciones seleccionables */}
      {!showRecs && item && item.nombre && (() => {
        const db = cultivosDB[item.nombre.toLowerCase()];
        if (db && Array.isArray(db.siembra) && db.siembra.length > 0) {
          return (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Paso a paso para sembrar {item.nombre}</h4>
              <ol className="list-decimal list-inside text-sm space-y-2 text-gray-700 dark:text-gray-300">
                {db.siembra.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ol>
            </div>
          );
        }
        return null;
      })()}

      {/* Nota: el gráfico comparativo se muestra únicamente en el modo 'definido' al validar un cultivo. */}
      <div className="mt-4">
        <p className="text-sm text-gray-500">El gráfico comparativo (Actual vs Ideal) se muestra en el panel de validación cuando trabajas en el modo <strong>Definido</strong>.</p>
      </div>
    </motion.div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState(null);
  const [cultivo, setCultivo] = useState("");
  const [ph, setPh] = useState("");
  const [humedad, setHumedad] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [resultado, setResultado] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  // UI para modo sugerido
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCultivo, setSelectedCultivo] = useState(null);
  // Cámara / IA
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const heatmapCanvasRef = useRef(null);
  const [dangerAlert, setDangerAlert] = useState(null);
  const [mlEnabled, setMlEnabled] = useState(false);
  const [mlPredictions, setMlPredictions] = useState(null);
  const [customModelUrl, setCustomModelUrl] = useState('');
  const lastHeatmapRef = useRef(null);
  const [autoSendAnalysis, setAutoSendAnalysis] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showAnalisisModal, setShowAnalisisModal] = useState(false);
  const [analisisList, setAnalisisList] = useState([]);
  // Reloj en tiempo real para la pantalla principal
  const [now, setNow] = useState(new Date());
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallManual, setShowInstallManual] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('agrosens_custom_model');
      if (saved) setCustomModelUrl(saved);
      const savedAuto = localStorage.getItem('agrosens_auto_send');
      if (savedAuto) setAutoSendAnalysis(savedAuto === '1');
    } catch (e) {}
  }, []);

  // crear worker de análisis (si el navegador lo soporta)
  useEffect(() => {
    try {
      // Vite soporta new URL(import.meta.url)
      const w = new Worker(new URL('./lib/analysisWorker.js', import.meta.url), { type: 'module' });
      workerRef.current = w;
    } catch (e) {
      console.warn('Worker no disponible:', e);
      workerRef.current = null;
    }
    return () => {
      if (workerRef.current) {
        try { workerRef.current.terminate(); } catch (e) {}
        workerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onBefore = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const onManualInstallClick = async () => {
    if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        console.log('PWA install choice', choice);
      } catch (e) { console.warn('install prompt error', e); }
      setDeferredPrompt(null);
      // mark dismissed to avoid duplicate banners in InstallPromptIOS
      localStorage.setItem('agrosens_install_dismissed', '1');
    } else {
      // show manual instructions modal
      setShowInstallManual(true);
    }
  };

  // refresh pending count periodically
  useEffect(() => {
    let mounted = true;
    async function loadPending() {
      const items = await getPendingItems();
      if (mounted) setPendingCount(items.length);
    }
    loadPending();
    const id = setInterval(loadPending, 3000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Splash screen
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Inicia la cámara mostrando modal
  const startCamera = async () => {
    try {
      setAnalysisResult(null);
      setCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;

      // Intentar adjuntar el stream al video cuando el elemento esté montado.
      const attach = async (tries = 0) => {
        if (videoRef.current) {
          try {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          } catch (e) {
            console.warn('Error al reproducir video', e);
          }
        } else if (tries < 20) {
          // reintentar en 100ms
          setTimeout(() => attach(tries + 1), 100);
        } else {
          console.warn('No se pudo montar videoRef para la cámara');
        }
      };

      attach();
    } catch (err) {
      console.error("No se pudo acceder a la cámara", err);
      setCameraOpen(false);
    }
  };

  const stopCamera = () => {
    try {
      // stop stream from streamRef or from video element
      const s = streamRef.current || (videoRef.current && videoRef.current.srcObject);
      if (s && s.getTracks) {
        const tracks = s.getTracks();
        tracks.forEach(t => t.stop());
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      streamRef.current = null;
    } catch (e) {
      console.warn(e);
    }
    setCameraOpen(false);
    setAnalyzing(false);
  };

  // Heurística simple de análisis: color dominante y tamaño relativo
  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;
    setAnalyzing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const maxW = 640;

    const makeFrame = () => {
      const w = Math.min(video.videoWidth || 640, maxW);
      const aspect = (video.videoHeight || 480) / (video.videoWidth || 640);
      const h = Math.round(w * aspect);
      canvas.width = w; canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const img = ctx.getImageData(0, 0, w, h);
      // copiar buffer para transferir al worker
      const copy = new Uint8ClampedArray(img.data);
      return { width: w, height: h, buffer: copy.buffer };
    };

    // capturar 3 frames con pequeño retardo
    const frames = [];
    for (let i = 0; i < 3; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 80));
      frames.push(makeFrame());
    }

    const processFrame = (frame, idx) => new Promise((resolve) => {
      const wkr = workerRef.current;
      const id = `${Date.now()}-${Math.random()}-${idx}`;
      if (wkr) {
        const handler = (ev) => {
          if (ev.data && ev.data.id === id) {
            wkr.removeEventListener('message', handler);
            resolve(ev.data);
          }
        };
        wkr.addEventListener('message', handler);
        try {
          // decide mode: prefer ML if enabled, otherwise heatmap if enabled, else default
          if (mlEnabled) {
            wkr.postMessage({ id, width: frame.width, height: frame.height, buffer: frame.buffer, mode: 'ml', customModelUrl }, [frame.buffer]);
          } else if (heatmapEnabled) {
            const gridW = 40; const gridH = Math.max(8, Math.round((gridW * frame.height) / frame.width));
            wkr.postMessage({ id, width: frame.width, height: frame.height, buffer: frame.buffer, mode: 'heatmap', gridW, gridH }, [frame.buffer]);
          } else {
            wkr.postMessage({ id, width: frame.width, height: frame.height, buffer: frame.buffer }, [frame.buffer]);
          }
        } catch (e) {
          // fallback si transfer falla
          wkr.removeEventListener('message', handler);
          resolve({ id, error: String(e) });
        }
      } else {
        // fallback: procesar en hilo principal (simple)
        try {
          const arr = new Uint8ClampedArray(frame.buffer);
          let rSum = 0, gSum = 0, bSum = 0, count = 0, plantPixels = 0, redPixels = 0;
          for (let i = 0; i < arr.length; i += 4) {
            const r = arr[i] / 255, g = arr[i+1] / 255, b = arr[i+2] / 255;
            rSum += arr[i]; gSum += arr[i+1]; bSum += arr[i+2]; count++;
            const max = Math.max(r, g, b); const min = Math.min(r, g, b); const delta = max - min;
            let h = 0;
            if (delta !== 0) {
              if (max === r) h = ((g - b) / delta) % 6;
              else if (max === g) h = (b - r) / delta + 2;
              else h = (r - g) / delta + 4;
              h = Math.round(h * 60); if (h < 0) h += 360;
            }
            const s = max === 0 ? 0 : delta / max; const v = max;
            if (h >= 70 && h <= 160 && s > 0.2 && v > 0.05) plantPixels++;
            if ((h <= 15 || h >= 345) && s > 0.35 && v > 0.15) redPixels++;
          }
          resolve({ id, rSum, gSum, bSum, count, plantPixels, redPixels });
        } catch (err) { resolve({ id, error: String(err) }); }
      }
    });

    const results = [];
    for (let i = 0; i < frames.length; i++) {
      results.push(await processFrame(frames[i], i));
    }

    // combinar resultados
    let rSum = 0, gSum = 0, bSum = 0, count = 0, plantPixels = 0, redPixels = 0;
    for (const res of results) {
      if (res.error) continue;
      rSum += res.rSum || 0; gSum += res.gSum || 0; bSum += res.bSum || 0; count += res.count || 0;
      plantPixels += res.plantPixels || 0; redPixels += res.redPixels || 0;
    }
    const avgR = count ? (rSum / count) : 0;
    const avgG = count ? (gSum / count) : 0;
    const avgB = count ? (bSum / count) : 0;
    const greenRatio = count ? (plantPixels / count) : 0;
    const redPortion = (avgR + avgG + avgB) ? (avgR / (avgR + avgG + avgB)) : 0;

    // aplicar reglas existentes
    const key = normalizeKey(cultivo || '');
    let verdict = 'Insuficiente información';
    let estimateDays = null;
    if (key.includes('tomate') || key.includes('tomato')) {
      if (redPortion > 0.35) verdict = 'Maduro';
      else { verdict = 'No maduro'; estimateDays = Math.max(1, Math.round((0.35 - redPortion) * 60)); }
    } else if (key.includes('palta') || key.includes('aguacate') || key.includes('avocado')) {
      if (greenRatio > 0.02 && avgG < 120) verdict = 'Probablemente madura';
      else { verdict = 'Necesita más crecimiento/maduración'; estimateDays = Math.max(2, Math.round((0.02 - greenRatio) * 200)); }
    } else {
      if (greenRatio > 0.02) verdict = 'Planta con buen desarrollo';
      else { verdict = 'Planta pequeña o fondo dominante'; estimateDays = Math.max(3, Math.round((0.02 - greenRatio) * 150)); }
    }

    const result = { avg: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) }, greenRatio: Number(greenRatio.toFixed(4)), redPortion: Number(redPortion.toFixed(4)), verdict, estimateDays, timestamp: Date.now() };
    setAnalysisResult(result);
    // Auto-send analysis if enabled
    if (autoSendAnalysis && navigator.onLine) {
      try {
        // capture thumbnail from canvas
        let thumb = null;
        try {
          if (canvasRef.current) {
            thumb = canvasRef.current.toDataURL('image/jpeg', 0.8).replace(/^data:image\/[a-z]+;base64,/, '');
          }
        } catch (e) { console.warn('No thumbnail', e); }

        const payload = {
          deviceId: 'cam-01',
          cultivo: cultivo || null,
          verdict: result.verdict,
          estimateDays: result.estimateDays,
          avgColor: result.avg,
          greenRatio: result.greenRatio,
          redPortion: result.redPortion,
          bboxArea: result.bboxArea || null,
          areaRatio: result.areaRatio || null,
          mlPredictions: mlPredictions || null,
          heatmap: lastHeatmapRef.current || null,
          image: thumb || null,
          raw: { timestamp: Date.now() }
        };
        fetch('/api/analisis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then(r => r.json()).then(j => console.log('analisis guardado', j)).catch(e => console.warn('Error enviando analisis', e));
      } catch (e) { console.warn('Error auto-send', e); }
    }
    // If heatmapEnabled and any worker returned a heatmap, draw it and check for danger
    // process worker results for heatmap or ML
    for (const res of results) {
      if (!res) continue;
      if (res.heatmap && res.gridW && res.gridH) {
        try {
          const floats = new Float32Array(res.heatmap);
          drawHeatmapOnOverlay(floats, res.gridW, res.gridH);
          let maxV = 0; for (let i = 0; i < floats.length; i++) if (floats[i] > maxV) maxV = floats[i];
          if (maxV > 0.6) setDangerAlert('Peligro detectado: posible presencia de insectos/plagas en la zona analizada.');
          else setDangerAlert(null);
        } catch (e) { console.warn('Error procesando heatmap', e); }
      }

      if (res.ml && res.predictions) {
        setMlPredictions(res.predictions);
        // heurística simple: si alguna clase contiene palabras sospechosas -> alerta
        const suspicious = ['insect', 'bug', 'fly', 'ant', 'aphid', 'beetle', 'weevil', 'caterpillar'];
        const found = res.predictions.find(p => suspicious.some(s => p.className.toLowerCase().includes(s)) && p.probability > 0.15);
        if (found) setDangerAlert(`Peligro detectado por ML: ${found.className} (${(found.probability*100).toFixed(1)}%)`);
        else {
          // if ML says no insect, clear only if no heatmap indicates danger
          if (!dangerAlert) setDangerAlert(null);
        }
      }
      if (res.error) console.warn('Worker error:', res.error);
    }
    setAnalyzing(false);
  };

  // dibuja el heatmap sobre el canvas overlay
  const drawHeatmapOnOverlay = (grid, gridW, gridH) => {
    const canvas = heatmapCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    const w = video.clientWidth || video.videoWidth;
    const h = video.clientHeight || video.videoHeight;
    canvas.width = w; canvas.height = h;
    ctx.clearRect(0,0,w,h);
    // each cell size
    const cellW = w / gridW; const cellH = h / gridH;
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const v = grid[gy * gridW + gx];
        if (v <= 0) continue;
        // colormap: from transparent -> yellow -> red
        const alpha = Math.min(0.8, v * 0.9 + 0.1);
        let color = `rgba(255,0,0,${alpha})`;
        if (v < 0.4) color = `rgba(255,230,0,${alpha})`;
        ctx.fillStyle = color;
        ctx.fillRect(gx * cellW, gy * cellH, Math.ceil(cellW)+1, Math.ceil(cellH)+1);
      }
    }
    try {
      // store base64 for sending later
      lastHeatmapRef.current = float32ToBase64(grid);
    } catch (e) { console.warn('Error encoding heatmap', e); }
  };

  const handleValidar = () => {
    const res = validarCultivo(cultivo, ph, humedad, temperatura);

    // If offline, enqueue the reading to send later
    if (!navigator.onLine) {
      const payload = {
        deviceId: cultivo || 'manual-entry',
        timestamp: new Date().toISOString(),
        ph: parseFloat(ph) || null,
        soilMoisture: parseFloat(humedad) || null,
        temperature: parseFloat(temperatura) || null
      };
      // save locally in readings cache and outbox
      addReadingLocally(payload).then(() => {
        enqueueItem({ type: 'reading', payload }).then((e) => {
          setResultado({ viable: res.viable, mensaje: `📥 Lectura guardada localmente y en cola para sincronizar. ${res.mensaje || ''}`, detalles: res.detalles || null });
        }).catch(() => {
          setResultado({ viable: res.viable, mensaje: `📥 Lectura guardada localmente (no se pudo encolar). ${res.mensaje || ''}`, detalles: res.detalles || null });
        });
      }).catch(() => {
        setResultado({ viable: res.viable, mensaje: `📥 Error guardando localmente. ${res.mensaje || ''}`, detalles: res.detalles || null });
      });
      return;
    }

    if (res.viable) {
      setResultado({
        viable: true,
        mensaje: `✅ ${res.mensaje}`,
        detalles: res.detalles || null,
      });
    } else {
      setResultado({
        viable: false,
        mensaje: `❌ ${res.mensaje}`,
        pasos: [
          "Ajustar el pH del suelo aplicando enmiendas (cal para subirlo, azufre para bajarlo).",
          "Mejorar la retención de humedad usando riego por goteo o cobertura orgánica.",
          "Optimizar la temperatura mediante invernaderos, mallas de sombreo o ventilación.",
          "Realizar un análisis de suelo para identificar nutrientes faltantes.",
        ],
        detalles: res.detalles || null,
      });
    }
  };

  const handleSugerir = () => {
    const res = sugerirCultivos(ph, humedad, temperatura);
    setResultado(
      res.length > 0
        ? { viable: true, sugerencias: res }
        : { viable: false, mensaje: "No hay cultivos compatibles con estas condiciones." }
    );
  };

  const filteredSugerencias = useMemo(() => {
    if (!resultado || !resultado.sugerencias) return [];
    const term = searchTerm.trim().toLowerCase();
    return resultado.sugerencias.filter(s => s.nombre.toLowerCase().includes(term));
  }, [resultado, searchTerm]);

  // Estado derivado: si la validación devolvió viable
  const isViable = resultado && resultado.viable;

  // --- Splash ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-green-100 via-green-200 to-green-300 dark:from-gray-800 dark:via-gray-900 dark:to-black transition-colors">
        <motion.img
          src={logo}
          alt="AgroSens Logo"
          className="w-48 h-48 drop-shadow-lg"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <motion.h1
          className="mt-6 text-3xl font-bold text-green-900 dark:text-green-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          Bienvenido a AgroSens
        </motion.h1>
      </div>
    );
  }

  // --- Selección de modo ---
  if (!modo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-green-100 via-green-200 to-green-300 dark:from-gray-800 dark:via-gray-900 dark:to-black text-gray-800 dark:text-gray-100 p-6 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <motion.img
            src={logo}
            alt="AgroSens Logo"
            className="w-36 h-36 drop-shadow-lg"
            initial={{ scale: 0.8, rotate: -6, opacity: 0 }}
            animate={{ scale: [0.9, 1.05, 1], rotate: [ -6, 4, 0], opacity: 1 }}
            transition={{ duration: 1.2, repeat: 0, ease: 'easeOut' }}
          />
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-700 via-green-400 to-teal-300"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            AgroSens — Herramienta de control y gestión para tus cultivos
          </motion.h1>

          <div className="mt-1 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <div>Elige cómo quieres trabajar hoy · <span className="font-medium">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(now)}</span></div>
            <div className={`px-2 py-1 rounded text-xs ${isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{isOnline ? 'Online' : 'Offline'}</div>
            <div className="ml-2 flex items-center gap-2">
              <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs" onClick={onManualInstallClick}>Instalar App</button>
              <div className="text-xs text-gray-600 dark:text-gray-300">{deferredPrompt ? 'Prompt listo' : 'Prompt no disponible'}</div>
              <button className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded" onClick={() => { localStorage.removeItem('agrosens_install_dismissed'); alert('Marca de dismiss eliminada'); }}>Reset Dismiss</button>
            </div>
            
          </div>

          {/* Form creativo con los 4 botones principales */}
          <form className="mt-6 w-full max-w-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-3xl shadow-lg grid grid-cols-2 gap-4">
            <motion.button
              type="button"
              onClick={() => setModo('definido')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl btn-primary shadow-lg"
            >
              <div className="text-2xl">🌱</div>
              <div className="text-sm font-semibold">Modo Cultivo Definido</div>
              <div className="text-xs opacity-90">Valida un cultivo con datos específicos</div>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setModo('sugerido')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl btn-primary shadow-lg"
            >
              <div className="text-2xl">🤝</div>
              <div className="text-sm font-semibold">Modo Cultivo Sugerido</div>
              <div className="text-xs opacity-90">Recibe recomendaciones según tus condiciones</div>
            </motion.button>

            <motion.button
              type="button"
              onClick={startCamera}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl btn-primary shadow-lg"
            >
              <div className="text-2xl">🔍</div>
              <div className="text-sm font-semibold">Analizar con cámara (IA)</div>
              <div className="text-xs opacity-90">Detecta madurez y condición de la planta</div>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl btn-primary shadow-lg"
            >
              <div className="text-2xl">{darkMode ? '☀️' : '🌙'}</div>
              <div className="text-sm font-semibold">Cambiar tema</div>
              <div className="text-xs opacity-90">Alterna modo claro/oscuro</div>
            </motion.button>
          </form>

          {/* Panel de estadísticas/histórico simple */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-4xl">
            <WeatherRotator />
          </div>

      {/* Telemetry modal (también accesible desde la pantalla de selección) */}
      {showTelemetry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-[95%] max-w-4xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Telemetry POC</h3>
              <div className="flex gap-2">
                  <button onClick={() => setShowTelemetry(false)} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded">Cerrar</button>
                  <button onClick={async () => { const res = await flushQueue(); console.log('Flush results', res); }} className="px-3 py-1 bg-green-600 text-white rounded">Sincronizar ahora</button>
              </div>
            </div>
            <TelemetryDashboard deviceId="sensor-001" />
          </div>
        </div>
      )}

      {/* Modal de cámara (también accesible desde la pantalla de selección) */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-[90%] max-w-3xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Análisis por cámara</h3>
              <div className="flex gap-2">
                <button onClick={() => { captureAndAnalyze(); }} className="px-3 py-1 bg-green-600 text-white rounded">Analizar</button>
                <button onClick={stopCamera} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded">Cerrar</button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <video ref={videoRef} className="w-full rounded" playsInline muted />
                  <canvas ref={heatmapCanvasRef} className="pointer-events-none absolute inset-0 w-full h-full" />
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div>
                <h4 className="font-semibold">Resultado</h4>
                        <div className="mt-2 space-y-2">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={heatmapEnabled} onChange={(e) => setHeatmapEnabled(e.target.checked)} />
                            <span>Mostrar mapa de calor (detección de plagas)</span>
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={mlEnabled} onChange={(e) => setMlEnabled(e.target.checked)} />
                            <span>Activar detección por ML (mobilenet)</span>
                          </label>
                          {dangerAlert && <div className="mt-2 text-sm text-red-600 font-semibold">⚠️ {dangerAlert}</div>}
                          {mlPredictions && (
                            <div className="mt-2 text-sm">
                              <div className="font-semibold">Predicciones (ML):</div>
                              <ul className="list-disc pl-5 text-sm">
                                {mlPredictions.map((p, i) => (
                                  <li key={i}>{p.className} — {(p.probability * 100).toFixed(1)}%</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="mt-3">
                            <label className="text-sm">Modelo custom (opcional):</label>
                            <div className="flex gap-2 mt-1">
                              <input value={customModelUrl} onChange={(e) => setCustomModelUrl(e.target.value)} placeholder="https://.../model.json" className="flex-1 p-2 rounded border text-sm" />
                              <button onClick={() => { localStorage.setItem('agrosens_custom_model', customModelUrl); alert('URL guardada en localStorage'); }} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Guardar</button>
                            </div>
                            <label className="inline-flex items-center gap-2 text-sm mt-2">
                              <input type="checkbox" checked={autoSendAnalysis} onChange={(e) => { setAutoSendAnalysis(e.target.checked); localStorage.setItem('agrosens_auto_send', e.target.checked ? '1' : '0'); }} />
                              <span>Enviar análisis automáticamente al backend</span>
                            </label>
                          </div>
                        </div>
                {analyzing ? <div className="text-sm">Analizando...</div> : (
                  analysisResult ? (
                    <div className="text-sm space-y-2">
                      <div><strong>Veredicto:</strong> {analysisResult.verdict}</div>
                      {analysisResult.estimateDays && <div><strong>Estimación:</strong> ~{analysisResult.estimateDays} días</div>}
                      <div><strong>Color promedio:</strong> R {analysisResult.avg.r} G {analysisResult.avg.g} B {analysisResult.avg.b}</div>
                      <div><strong>Proporción verde:</strong> {analysisResult.greenRatio}</div>
                    </div>
                  ) : <div className="text-sm text-gray-600">Captura una imagen y presiona Analizar.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>
    );
  }

  // --- Formulario común ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-green-100 via-green-200 to-green-300 dark:from-gray-800 dark:via-gray-900 dark:to-black text-gray-800 dark:text-gray-100 p-6 transition-colors">
      <h1 className="text-3xl font-bold mb-6">
        {modo === "definido" ? "🌱 Validacion de cultivos" : "🤝 Cultivos Sugeridos"}
      </h1>

      {modo === "definido" ? (
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <div />
            <div className="flex gap-2">
              <button onClick={() => { setModo(null); setResultado(null); }} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg">⬅ Volver</button>
              <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-1 bg-gray-800 text-white rounded">{darkMode ? '☀️' : '🌙'}</button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors">
            <div className="mb-4">
              <label className="block mb-1 font-semibold">Selecciona el cultivo</label>
              <select value={cultivo} onChange={(e) => setCultivo(e.target.value)} className="w-full border rounded-lg p-2 text-black">
                <option value="">-- Elige un cultivo --</option>
                {cultivos.map(c => (
                  <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold">pH</label>
              <input
                type="number"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                className="w-full border rounded-lg p-2 text-black"
                placeholder="Ej: 6.5"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold">Humedad (%)</label>
              <input
                type="number"
                value={humedad}
                onChange={(e) => setHumedad(e.target.value)}
                className="w-full border rounded-lg p-2 text-black"
                placeholder="Ej: 70"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold">Temperatura (°C)</label>
              <input
                type="number"
                value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)}
                className="w-full border rounded-lg p-2 text-black"
                placeholder="Ej: 22"
              />
            </div>

            <motion.button
              onClick={handleValidar}
              className="w-full bg-green-700 text-white py-2 rounded-xl font-semibold hover:bg-green-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Validar Cultivo
            </motion.button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors">
            <h3 className="text-lg font-semibold mb-3">Vista previa del cultivo</h3>
            {cultivo ? (
              (() => {
                const found = cultivos.find(c => normalizeKey(c.nombre) === normalizeKey(cultivo));
                if (found) return <CultivoCard cultivo={found} onClick={() => {}} selected={true} />;
                return <div className="text-sm text-gray-600">No se encontró información del cultivo seleccionado.</div>;
              })()
            ) : (
              <div className="text-sm text-gray-600">Selecciona un cultivo para ver la tarjeta aquí.</div>
            )}
          </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md transition-colors">
          <div className="flex justify-end mb-3">
            <div className="flex gap-2">
              <button onClick={() => { setModo(null); setResultado(null); }} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg">⬅ Volver</button>
              <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-1 bg-gray-800 text-white rounded">{darkMode ? '☀️' : '🌙'}</button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">pH</label>
            <input
              type="number"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
              className="w-full border rounded-lg p-2 text-black"
              placeholder="Ej: 6.5"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">Humedad (%)</label>
            <input
              type="number"
              value={humedad}
              onChange={(e) => setHumedad(e.target.value)}
              className="w-full border rounded-lg p-2 text-black"
              placeholder="Ej: 70"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">Temperatura (°C)</label>
            <input
              type="number"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
              className="w-full border rounded-lg p-2 text-black"
              placeholder="Ej: 22"
            />
          </div>

          <motion.button
            onClick={handleSugerir}
            className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sugerir Cultivos
          </motion.button>
        </div>
      )}

      {/* Este es el botón para análisis por cámara con IA */}
      <div className="mt-4">
        <button onClick={startCamera} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">🔍 Analizar con cámara (IA)</button>
        <button onClick={() => setShowTelemetry(true)} className="ml-2 px-4 py-2 bg-gray-700 text-white rounded-lg">📡 Telemetría (POC)</button>
        <button onClick={async () => { setShowAnalisisModal(true); try { const q = await fetch('/api/analisis'); const j = await q.json(); setAnalisisList(j); } catch (e) { console.warn('Error cargando analisis', e); } }} className="ml-2 px-4 py-2 bg-yellow-600 text-white rounded-lg">📸 Ver capturas</button>
      </div>

      {/* Install prompt (Android/iOS guidance) */}
      <InstallPromptIOS />

      {/* Telemetry modal */}
      {showTelemetry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-[95%] max-w-4xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Telemetry POC</h3>
              <div className="flex gap-2">
                  <button onClick={() => setShowTelemetry(false)} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded">Cerrar</button>
                  <button onClick={async () => { const res = await flushQueue(); console.log('Flush results', res); }} className="px-3 py-1 bg-green-600 text-white rounded">Sincronizar ahora</button>
              </div>
            </div>
            <TelemetryDashboard deviceId="sensor-001" />
          </div>
        </div>
      )}
      {/* Modal de cámara */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-[90%] max-w-3xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Análisis por cámara</h3>
              <div className="flex gap-2">
                <button onClick={() => { captureAndAnalyze(); }} className="px-3 py-1 bg-green-600 text-white rounded">Analizar</button>
                <button onClick={stopCamera} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded">Cerrar</button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <video ref={videoRef} className="w-full rounded" playsInline muted />
                  <canvas ref={heatmapCanvasRef} className="pointer-events-none absolute inset-0 w-full h-full" />
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div>
                <h4 className="font-semibold">Resultado</h4>
                <div className="mt-2 space-y-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={heatmapEnabled} onChange={(e) => setHeatmapEnabled(e.target.checked)} />
                    <span>Mostrar mapa de calor (detección de plagas)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={mlEnabled} onChange={(e) => setMlEnabled(e.target.checked)} />
                    <span>Activar detección por ML (mobilenet/custom)</span>
                  </label>
                  {dangerAlert && <div className="mt-2 text-sm text-red-600 font-semibold">⚠️ {dangerAlert}</div>}
                  {mlPredictions && (
                    <div className="mt-2 text-sm">
                      <div className="font-semibold">Predicciones (ML):</div>
                      <ul className="list-disc pl-5 text-sm">
                        {mlPredictions.map((p, i) => (
                          <li key={i}>{p.className} — {(p.probability * 100).toFixed(1)}%</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-3">
                    <label className="text-sm">Modelo custom (opcional):</label>
                    <div className="flex gap-2 mt-1">
                      <input value={customModelUrl} onChange={(e) => setCustomModelUrl(e.target.value)} placeholder="https://.../model.json" className="flex-1 p-2 rounded border text-sm" />
                      <button onClick={() => { localStorage.setItem('agrosens_custom_model', customModelUrl); alert('URL guardada en localStorage'); }} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Guardar</button>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm mt-2">
                      <input type="checkbox" checked={autoSendAnalysis} onChange={(e) => { setAutoSendAnalysis(e.target.checked); localStorage.setItem('agrosens_auto_send', e.target.checked ? '1' : '0'); }} />
                      <span>Enviar análisis automáticamente al backend</span>
                    </label>
                  </div>
                </div>
                {analyzing ? <div className="text-sm">Analizando...</div> : (
                  analysisResult ? (
                    <div className="text-sm space-y-2 mt-2">
                      <div><strong>Veredicto:</strong> {analysisResult.verdict}</div>
                      {analysisResult.estimateDays && <div><strong>Estimación:</strong> ~{analysisResult.estimateDays} días</div>}
                      <div><strong>Color promedio:</strong> R {analysisResult.avg.r} G {analysisResult.avg.g} B {analysisResult.avg.b}</div>
                      <div><strong>Proporción verde:</strong> {analysisResult.greenRatio}</div>
                    </div>
                  ) : <div className="text-sm text-gray-600">Captura una imagen y presiona Analizar.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: lista de capturas guardadas */}
      {showAnalisisModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 w-[95%] max-w-4xl overflow-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Capturas guardadas</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowAnalisisModal(false)} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded">Cerrar</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analisisList.length === 0 && <div className="text-sm text-gray-600">No hay capturas guardadas.</div>}
              {analisisList.map((a) => (
                <div key={a._id} className="border rounded p-2">
                  {a.image ? <img src={`data:image/jpeg;base64,${a.image}`} alt="thumb" className="w-full h-32 object-cover rounded" /> : <div className="w-full h-32 bg-gray-100 flex items-center justify-center">Sin imagen</div>}
                  <div className="text-xs mt-2">{a.cultivo || '—'} • {new Date(a.createdAt || a.timestamp || Date.now()).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Resultado --- */}
      {resultado && (
        <div className="mt-6 w-full flex flex-col items-center">
          {modo === "sugerido" && resultado.viable && resultado.sugerencias ? (
            // Dashboard layout: lista de cards + panel de detalle
            <div className="w-full grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="mb-4 flex items-center gap-3">
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar cultivo..."
                    className="flex-1 p-2 rounded-lg border"
                  />
                  <div className="text-sm text-gray-600 dark:text-gray-300">Resultados: {filteredSugerencias.length}</div>
                </div>

                <SuggestedCarousel
                  suggestions={filteredSugerencias}
                  selected={selectedCultivo}
                  onSelect={(it) => setSelectedCultivo(it)}
                />
              </div>

              <div className="md:col-span-1">
                {selectedCultivo ? (
                  <DetallePanel item={selectedCultivo} onClose={() => setSelectedCultivo(null)} currentPh={ph} currentHum={humedad} currentTemp={temperatura} />
                ) : (
                  <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow text-center">
                    <p className="text-gray-700 dark:text-gray-300">Selecciona una tarjeta para ver detalles del cultivo.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <motion.div
              className="mt-6 p-4 rounded-xl shadow-md bg-white dark:bg-gray-800 w-full max-w-lg text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-lg font-bold mb-2">📜 Carta de Recomendación</h2>
              <p className="mb-2">{resultado.mensaje}</p>
              {!resultado.viable && resultado.pasos && (
                <ul className="list-disc pl-6 text-sm text-gray-700 dark:text-gray-300">
                  {resultado.pasos.map((paso, i) => (
                    <li key={i}>{paso}</li>
                  ))}
                </ul>
              )}

              {modo === "definido" && cultivo && cultivosDB[normalizeKey(cultivo)] && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow ${isViable ? 'ring-2 ring-green-400' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold mb-2">Detalles del cultivo seleccionado</h3>
                      {isViable && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">Apto</span>}
                    </div>
                    {/* buscar datos en la lista 'cultivos' exportada */}
                    {(() => {
                      const found = cultivos.find(c => normalizeKey(c.nombre) === normalizeKey(cultivo));
                      if (found) return <CultivoCard cultivo={found} onClick={() => {}} selected={true} />;
                      return <div className="text-sm text-gray-600">No se encontró información del cultivo seleccionado.</div>;
                    })()}
                  </div>

                  <div className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow ${isViable ? 'border-l-4 border-green-500' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold mb-2">Requerimientos vs valores actuales</h3>
                      {isViable && <div className="text-sm text-green-600">Plantilla: {cultivo}</div>}
                    </div>
                    {(() => {
                      // Cuando el cultivo es apto, usamos su propia plantilla (rango ideal) como referencia
                      const idealKey = (resultado && resultado.viable) ? normalizeKey(cultivo) : normalizeKey(cultivo);
                      const idealDb = cultivosDB[idealKey] || { ph: [0, 0], humedad: [0, 0], temperatura: [0, 0] };

                      const chartData = [
                        {
                          parametro: 'pH',
                          Actual: Number(ph) || 0,
                          Ideal: idealDb && Array.isArray(idealDb.ph) ? (Number(idealDb.ph[0]) + Number(idealDb.ph[1])) / 2 : 0,
                        },
                        {
                          parametro: 'Humedad (%)',
                          Actual: Number(humedad) || 0,
                          Ideal: idealDb && Array.isArray(idealDb.humedad) ? (Number(idealDb.humedad[0]) + Number(idealDb.humedad[1])) / 2 : 0,
                        },
                        {
                          parametro: 'Temperatura (°C)',
                          Actual: Number(temperatura) || 0,
                          Ideal: idealDb && Array.isArray(idealDb.temperatura) ? (Number(idealDb.temperatura[0]) + Number(idealDb.temperatura[1])) / 2 : 0,
                        },
                      ];

                      return (
                        <div>
                          <div className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                            {resultado && resultado.detalles ? (
                              (() => {
                                const det = resultado.detalles;
                                const rows = [];

                                const makeRow = (label, obj) => {
                                  const val = obj && obj.valor !== undefined && obj.valor !== null ? obj.valor : 'n/a';
                                  const rango = obj && obj.rango ? obj.rango.join(' - ') : 'n/a';
                                  const outOfRange = obj && obj.rango ? !(val >= obj.rango[0] && val <= obj.rango[1]) : false;
                                  return (
                                    <div key={label} className={`flex items-start justify-between ${outOfRange ? 'text-red-600' : ''}`}>
                                      <div>
                                        <strong>{label}:</strong> {val} <span className="text-xs text-gray-500">(ideal: {rango})</span>
                                        {outOfRange && <div className="text-xs mt-1">⚠️ {getSuggestionFor(label, val, obj && obj.rango)}</div>}
                                      </div>
                                    </div>
                                  );
                                };

                                rows.push(makeRow('pH', det.ph));
                                rows.push(makeRow('Humedad', det.humedad));
                                rows.push(makeRow('Temperatura', det.temperatura));

                                return <div className="space-y-2">{rows}</div>;
                              })()
                            ) : (
                              <div className="text-sm text-gray-600">Introduce los valores y pulsa Validar para ver detalles.</div>
                            )}
                          </div>

                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData}>
                              <XAxis dataKey="parametro" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="Actual" fill="#f87171" />
                              <Bar dataKey="Ideal" fill="#34d399" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* estos son los botones que estan dentro del form para viaja entre el proyecto */}
    </div>
  );
}

export default App;
