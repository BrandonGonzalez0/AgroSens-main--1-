import React, { useState, useEffect, useMemo, useRef } from "react";
import { float32ToBase64 } from './lib/heatmapUtils';
import InstallPromptIOS from './InstallPromptIOS';
import logo from "./logo.png";
import { motion } from "framer-motion";
import { validarCultivo, sugerirCultivos, cultivos } from "./ServiciosCultivos";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

import TelemetryDashboard from './TelemetryDashboard';
import CameraAnalysis from './CameraAnalysis';
import CaptureGallery from './CaptureGallery';
import CropSelectionDashboard from './CropSelectionDashboard';
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


  const [showTelemetry, setShowTelemetry] = useState(false);
  const [showCameraAnalysis, setShowCameraAnalysis] = useState(false);
  const [showCaptureGallery, setShowCaptureGallery] = useState(false);
  const [showCropDashboard, setShowCropDashboard] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
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
    if (res.length > 0) {
      setResultado({ viable: true, sugerencias: res });
      setShowCropDashboard(true);
    } else {
      setResultado({ viable: false, mensaje: "No hay cultivos compatibles con estas condiciones." });
    }
  };



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
              onClick={() => setShowCameraAnalysis(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl btn-primary shadow-lg"
            >
              <div className="text-2xl">🔍</div>
              <div className="text-sm font-semibold">Analizar con cámara (IA)</div>
              <div className="text-xs opacity-90">Detecta madurez y plagas en tiempo real</div>
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

      {/* Botones de funcionalidades principales */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setShowCameraAnalysis(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">🔍 Analizar con cámara</button>
        <button onClick={() => setShowTelemetry(true)} className="px-4 py-2 bg-gray-700 text-white rounded-lg">📊 Dashboard</button>
        <button onClick={() => setShowCaptureGallery(true)} className="px-4 py-2 bg-yellow-600 text-white rounded-lg">📸 Ver capturas</button>
      </div>

      {/* Install prompt (Android/iOS guidance) */}
      <InstallPromptIOS />

      {/* New modular components */}
      <CameraAnalysis isOpen={showCameraAnalysis} onClose={() => setShowCameraAnalysis(false)} />
      <TelemetryDashboard isOpen={showTelemetry} onClose={() => setShowTelemetry(false)} />
      <CaptureGallery isOpen={showCaptureGallery} onClose={() => setShowCaptureGallery(false)} />
      
      {/* Crop Selection Dashboard */}
      {showCropDashboard && resultado?.sugerencias && (
        <CropSelectionDashboard 
          suggestions={resultado.sugerencias} 
          onClose={() => setShowCropDashboard(false)} 
        />
      )}


      {/* --- Resultado --- */}
      {resultado && (
        <div className="mt-6 w-full flex flex-col items-center">
          {modo === "sugerido" && resultado.viable && resultado.sugerencias ? (
            // Success message for suggested crops (dashboard opens automatically)
            <motion.div
              className="p-6 rounded-xl shadow-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 w-full max-w-lg text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-4xl mb-3">🌱</div>
              <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                ¡Cultivos Encontrados!
              </h2>
              <p className="text-green-700 dark:text-green-300 mb-4">
                Hemos encontrado {resultado.sugerencias.length} cultivos compatibles con tus condiciones.
              </p>
              <button
                onClick={() => setShowCropDashboard(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Ver Dashboard de Cultivos
              </button>
            </motion.div>
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
