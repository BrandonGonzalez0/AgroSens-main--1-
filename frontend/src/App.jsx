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
import CropValidationResult from './CropValidationResult';
import CropTracker from './CropTracker';
import GeoTerrainSimulator from './GeoTerrainSimulator';
import Navigation from './Navigation';
import NotificationSystem, { showNotification } from './NotificationSystem';
import cultivosDB from "./data/cultivos.json";
import { enqueueItem, getPendingItems, addReadingLocally } from './lib/offlineDB';
import { flushQueue } from './lib/sync';
import WeatherRotator from './WeatherRotator';
import { useSensorData } from './hooks/useSensorData';
import apiClient, { sanitizeInput, validateSensorData } from './utils/api';

// Mobile compatibility
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
};

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

function App() {
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState(null);
  const [cultivo, setCultivo] = useState("");
  const [ph, setPh] = useState("");
  const [humedad, setHumedad] = useState("");
  const [temperatura, setTemperatura] = useState("");
  
  const { sensorData: rawSensorData, autoMode, toggleAutoMode, fetchSensorData } = useSensorData();
  const [mockSensorData, setMockSensorData] = useState(null);
  
  // Use mock data on mobile or when Arduino not connected
  const sensorData = (isMobile() || !rawSensorData.isConnected) ? 
    { ...rawSensorData, ...mockSensorData, isConnected: isMobile() } : rawSensorData;
  
  // Generate mock data periodically on mobile
  useEffect(() => {
    if (isMobile() || !rawSensorData.isConnected) {
      const interval = setInterval(() => {
        setMockSensorData({
          ph: (6.0 + Math.random() * 2).toFixed(1),
          humidity: (60 + Math.random() * 30).toFixed(0),
          temperature: (18 + Math.random() * 12).toFixed(1),
          timestamp: new Date().toISOString()
        });
      }, 3000);
      
      setMockSensorData({
        ph: (6.0 + Math.random() * 2).toFixed(1),
        humidity: (60 + Math.random() * 30).toFixed(0),
        temperature: (18 + Math.random() * 12).toFixed(1),
        timestamp: new Date().toISOString()
      });
      
      return () => clearInterval(interval);
    }
  }, [rawSensorData.isConnected]);
  const [resultado, setResultado] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const [showTelemetry, setShowTelemetry] = useState(false);
  const [showCameraAnalysis, setShowCameraAnalysis] = useState(false);
  const [showCaptureGallery, setShowCaptureGallery] = useState(false);
  const [showCropDashboard, setShowCropDashboard] = useState(false);
  const [showValidationResult, setShowValidationResult] = useState(false);
  const [showCropTracker, setShowCropTracker] = useState(false);
  const [showGeoTerrainSimulator, setShowGeoTerrainSimulator] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [now, setNow] = useState(new Date());
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallManual, setShowInstallManual] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Auto-fill sensor data when available
  useEffect(() => {
    if (autoMode && sensorData.ph && sensorData.humidity && sensorData.temperature) {
      setPh(sensorData.ph);
      setHumedad(sensorData.humidity);
      setTemperatura(sensorData.temperature);
    }
  }, [sensorData, autoMode]);

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
      localStorage.setItem('agrosens_install_dismissed', '1');
    } else {
      setShowInstallManual(true);
    }
  };

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

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleValidar = async () => {
    // Sanitize inputs
    const sanitizedCultivo = sanitizeInput(cultivo);
    const sanitizedPh = sanitizeInput(ph);
    const sanitizedHumedad = sanitizeInput(humedad);
    const sanitizedTemperatura = sanitizeInput(temperatura);
    
    // Validate sensor data
    const validationErrors = validateSensorData({
      ph: sanitizedPh,
      humidity: sanitizedHumedad,
      temperature: sanitizedTemperatura
    });
    
    if (validationErrors.length > 0) {
      showNotification('error', 'Datos inválidos', validationErrors.join(', '));
      return;
    }
    
    showNotification('info', 'Validando cultivo', 'Analizando las condiciones proporcionadas...', 2000);
    
    const res = validarCultivo(sanitizedCultivo, sanitizedPh, sanitizedHumedad, sanitizedTemperatura);

    if (!navigator.onLine) {
      const payload = {
        deviceId: sanitizedCultivo || 'manual-entry',
        timestamp: new Date().toISOString(),
        ph: parseFloat(sanitizedPh) || null,
        soilMoisture: parseFloat(sanitizedHumedad) || null,
        temperature: parseFloat(sanitizedTemperatura) || null
      };
      addReadingLocally(payload).then(() => {
        enqueueItem({ type: 'reading', payload }).then((e) => {
          showNotification('warning', 'Modo offline', 'Datos guardados localmente para sincronizar después');
          setResultado({ viable: res.viable, mensaje: `📥 Lectura guardada localmente y en cola para sincronizar. ${res.mensaje || ''}`, detalles: res.detalles || null });
          setShowValidationResult(true);
        }).catch(() => {
          showNotification('error', 'Error de almacenamiento', 'No se pudo encolar para sincronización');
          setResultado({ viable: res.viable, mensaje: `📥 Lectura guardada localmente (no se pudo encolar). ${res.mensaje || ''}`, detalles: res.detalles || null });
          setShowValidationResult(true);
        });
      }).catch(() => {
        showNotification('error', 'Error crítico', 'No se pudo guardar los datos localmente');
        setResultado({ viable: res.viable, mensaje: `📥 Error guardando localmente. ${res.mensaje || ''}`, detalles: res.detalles || null });
        setShowValidationResult(true);
      });
      return;
    }

    if (res.viable) {
      showNotification('success', '✅ Validación exitosa', `El cultivo ${cultivo} es viable con estas condiciones`);
    } else {
      showNotification('warning', '⚠️ Condiciones no óptimas', 'El cultivo puede tener dificultades con estas condiciones');
    }

    setResultado({
      viable: res.viable,
      mensaje: res.mensaje,
      detalles: res.detalles || null,
    });
    setShowValidationResult(true);
  };

  const handleSugerir = () => {
    // Sanitize and validate inputs
    const sanitizedPh = sanitizeInput(ph);
    const sanitizedHumedad = sanitizeInput(humedad);
    const sanitizedTemperatura = sanitizeInput(temperatura);
    
    const validationErrors = validateSensorData({
      ph: sanitizedPh,
      humidity: sanitizedHumedad,
      temperature: sanitizedTemperatura
    });
    
    if (validationErrors.length > 0) {
      showNotification('error', 'Datos inválidos', validationErrors.join(', '));
      return;
    }
    
    showNotification('info', 'Buscando cultivos', 'Analizando compatibilidad con las condiciones...', 2000);
    
    const res = sugerirCultivos(sanitizedPh, sanitizedHumedad, sanitizedTemperatura);
    if (res.length > 0) {
      showNotification('success', '🌱 Cultivos encontrados', `Se encontraron ${res.length} cultivos compatibles`);
      setResultado({ viable: true, sugerencias: res });
      setShowCropDashboard(true);
    } else {
      showNotification('warning', 'Sin resultados', 'No se encontraron cultivos compatibles con estas condiciones');
      setResultado({ viable: false, mensaje: "No hay cultivos compatibles con estas condiciones." });
    }
  };

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

  if (!modo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 dark:from-green-400/5 dark:to-blue-400/5"></div>
          <div className="relative px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <motion.img
                    src={logo}
                    alt="AgroSens"
                    className="w-12 h-12 rounded-xl shadow-lg"
                    initial={{ rotate: -10, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AgroSens</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sistema Inteligente de Cultivos</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isOnline 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {isOnline ? '🟢 Conectado' : '🟡 Sin conexión'}
                  </div>
                  <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                  >
                    {darkMode ? '☀️' : '🌙'}
                  </button>
                  <button 
                    onClick={onManualInstallClick}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium transition-colors"
                  >
                    📱 Instalar App
                  </button>
                </div>
              </div>

              <div className="text-center mb-12">
                <motion.h2
                  className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  Bienvenido a tu
                  <span className="block bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Centro de Control Agrícola
                  </span>
                </motion.h2>
                <motion.p
                  className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Gestiona tus cultivos con inteligencia artificial, análisis en tiempo real y recomendaciones personalizadas
                </motion.p>
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  📅 {new Intl.DateTimeFormat('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(now)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
            <motion.button
              onClick={() => setShowCameraAnalysis(true)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Análisis IA</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Detecta madurez y plagas con tu cámara</p>
                <div className="mt-4 text-xs text-purple-600 dark:text-purple-400 font-medium">Usar ahora →</div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => setShowTelemetry(true)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Dashboard</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Estadísticas y métricas de tus cultivos</p>
                <div className="mt-4 text-xs text-blue-600 dark:text-blue-400 font-medium">Ver datos →</div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => setShowCaptureGallery(true)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📸</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Galería</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Historial de capturas y análisis</p>
                <div className="mt-4 text-xs text-green-600 dark:text-green-400 font-medium">Explorar →</div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => setShowCropTracker(true)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Seguimiento</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Seguimiento paso a paso de cultivos</p>
                <div className="mt-4 text-xs text-orange-600 dark:text-orange-400 font-medium">Gestionar →</div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => setShowGeoTerrainSimulator(true)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Terreno GPS</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Mapeo satelital con coordenadas reales</p>
                <div className="mt-4 text-xs text-teal-600 dark:text-teal-400 font-medium">Mapear →</div>
              </div>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">🌱</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Cultivo Definido</h3>
                    <p className="text-gray-600 dark:text-gray-300">Valida condiciones para un cultivo específico</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Selecciona tu cultivo objetivo
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Ingresa datos de pH, humedad y temperatura
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Recibe validación y recomendaciones
                  </div>
                </div>
                
                <button
                  onClick={() => setModo('definido')}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Comenzar Validación
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">🤝</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Cultivo Sugerido</h3>
                    <p className="text-gray-600 dark:text-gray-300">Descubre qué cultivos son ideales para ti</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Proporciona las condiciones disponibles
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    IA analiza compatibilidad con cultivos
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Recibe sugerencias personalizadas
                  </div>
                </div>
                
                <button
                  onClick={() => setModo('sugerido')}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Obtener Sugerencias
                </button>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WeatherRotator />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Actividad Reciente</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-sm">🌱</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Sistema iniciado</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Hace unos momentos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-sm">📊</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Dashboard listo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Datos actualizados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-sm">🔍</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">IA disponible</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Análisis en tiempo real</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <NotificationSystem />
        <InstallPromptIOS />
        <CameraAnalysis isOpen={showCameraAnalysis} onClose={() => setShowCameraAnalysis(false)} />
        <TelemetryDashboard isOpen={showTelemetry} onClose={() => setShowTelemetry(false)} />
        <CaptureGallery isOpen={showCaptureGallery} onClose={() => setShowCaptureGallery(false)} />
        <CropTracker isOpen={showCropTracker} onClose={() => setShowCropTracker(false)} />
        <GeoTerrainSimulator isOpen={showGeoTerrainSimulator} onClose={() => setShowGeoTerrainSimulator(false)} />
      </div>
    );
  }

  // Formulario común
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500">
      <Navigation
        currentMode={modo}
        onModeChange={(newMode) => {
          setModo(newMode);
          setResultado(null);
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        isOnline={isOnline}
        onInstallClick={onManualInstallClick}
        onShowCamera={() => setShowCameraAnalysis(true)}
        onShowDashboard={() => setShowTelemetry(true)}
        onShowGallery={() => setShowCaptureGallery(true)}
      />
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => { setModo(null); setResultado(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
          >
            ⬅️ <span className="text-sm font-medium">Volver al inicio</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {modo === "definido" ? "🌱 Validación de Cultivos" : "🤝 Sugerencias Inteligentes"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {modo === "definido" 
                ? "Valida las condiciones para tu cultivo específico" 
                : "Descubre qué cultivos son perfectos para tus condiciones"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {modo === "definido" ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Datos del Cultivo</h2>
                      <p className="text-gray-600 dark:text-gray-300">Completa la información para validar las condiciones</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                        sensorData.isConnected 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          sensorData.isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        {sensorData.isConnected ? 'Arduino conectado' : 'Arduino desconectado'}
                      </div>
                      <button
                        onClick={toggleAutoMode}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          autoMode 
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {autoMode ? '🤖 Auto' : '✋ Manual'}
                      </button>
                      {!autoMode && (
                        <button
                          onClick={fetchSensorData}
                          disabled={sensorData.isLoading}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          {sensorData.isLoading ? '⏳' : '🔄'} Obtener
                        </button>
                      )}
                    </div>
                  </div>
                  {sensorData.lastUpdate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Última actualización: {sensorData.lastUpdate.toLocaleString('es-ES')}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      🌱 Selecciona el cultivo
                    </label>
                    <select 
                      value={cultivo} 
                      onChange={(e) => setCultivo(e.target.value)} 
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-4 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="">-- Elige un cultivo --</option>
                      {cultivos.map(c => (
                        <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      🧪 pH del suelo
                      {autoMode && sensorData.ph && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          🤖 Auto
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={ph}
                      onChange={(e) => setPh(e.target.value)}
                      className={`w-full border rounded-2xl p-4 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent transition-all ${
                        autoMode && sensorData.ph
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 focus:ring-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-green-500'
                      }`}
                      placeholder="Ej: 6.5"
                      readOnly={autoMode}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Rango típico: 5.5 - 8.0</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      💧 Humedad del suelo (%)
                      {autoMode && sensorData.humidity && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          🤖 Auto
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={humedad}
                      onChange={(e) => setHumedad(e.target.value)}
                      className={`w-full border rounded-2xl p-4 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent transition-all ${
                        autoMode && sensorData.humidity
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 focus:ring-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      placeholder="Ej: 70"
                      readOnly={autoMode}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Rango típico: 40 - 90%</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      🌡️ Temperatura ambiente (°C)
                      {autoMode && sensorData.temperature && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          🤖 Auto
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={temperatura}
                      onChange={(e) => setTemperatura(e.target.value)}
                      className={`w-full border rounded-2xl p-4 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent transition-all ${
                        autoMode && sensorData.temperature
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 focus:ring-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-orange-500'
                      }`}
                      placeholder="Ej: 22"
                      readOnly={autoMode}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Rango típico: 10 - 35°C</p>
                  </div>
                </div>

                <motion.button
                  onClick={handleValidar}
                  disabled={!cultivo || !ph || !humedad || !temperatura}
                  className="w-full mt-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {!cultivo || !ph || !humedad || !temperatura 
                    ? 'Completa todos los campos' 
                    : '✨ Validar Cultivo'}
                </motion.button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Vista Previa</h3>
                {cultivo ? (
                  (() => {
                    const found = cultivos.find(c => normalizeKey(c.nombre) === normalizeKey(cultivo));
                    if (found) return <CultivoCard cultivo={found} onClick={() => {}} selected={true} />;
                    return (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-sm">No se encontró información del cultivo</p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-4">🌱</div>
                    <p className="text-sm">Selecciona un cultivo para ver la información detallada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤝</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Condiciones Disponibles</h2>
                <p className="text-gray-600 dark:text-gray-300">Ingresa las condiciones de tu terreno y te sugeriremos los mejores cultivos</p>
                
                <div className="flex justify-center items-center gap-3 mt-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                    sensorData.isConnected 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      sensorData.isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {sensorData.isConnected ? 'Arduino conectado' : 'Arduino desconectado'}
                  </div>
                  <button
                    onClick={toggleAutoMode}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      autoMode 
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {autoMode ? '🤖 Auto' : '✋ Manual'}
                  </button>
                  {!autoMode && (
                    <button
                      onClick={fetchSensorData}
                      disabled={sensorData.isLoading}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50"
                    >
                      {sensorData.isLoading ? '⏳' : '🔄'} Obtener
                    </button>
                  )}
                </div>
                
                {sensorData.lastUpdate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Última actualización: {sensorData.lastUpdate.toLocaleString('es-ES')}
                  </p>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    🧪 pH del suelo
                    {autoMode && sensorData.ph && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        🤖 Auto
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                    className={`w-full border rounded-2xl p-4 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent transition-all ${
                      autoMode && sensorData.ph
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 focus:ring-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-blue-500'
                    }`}
                    placeholder="Ej: 6.5"
                    readOnly={autoMode}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Nivel de acidez/alcalinidad del suelo</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    💧 Humedad del suelo (%)
                    {autoMode && sensorData.humidity && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        🤖 Auto
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={humedad}
                    onChange={(e) => setHumedad(e.target.value)}
                    className={`w-full border rounded-2xl p-4 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent transition-all ${
                      autoMode && sensorData.humidity
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 focus:ring-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-blue-500'
                    }`}
                    placeholder="Ej: 70"
                    readOnly={autoMode}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Porcentaje de humedad disponible</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    🌡️ Temperatura promedio (°C)
                    {autoMode && sensorData.temperature && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        🤖 Auto
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={temperatura}
                    onChange={(e) => setTemperatura(e.target.value)}
                    className={`w-full border rounded-2xl p-4 text-gray-800 dark:text-white focus:ring-2 focus:border-transparent transition-all ${
                      autoMode && sensorData.temperature
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 focus:ring-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-blue-500'
                    }`}
                    placeholder="Ej: 22"
                    readOnly={autoMode}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Temperatura ambiente promedio</p>
                </div>
              </div>

              <motion.button
                onClick={handleSugerir}
                disabled={!ph || !humedad || !temperatura}
                className="w-full mt-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {!ph || !humedad || !temperatura 
                  ? 'Completa todos los campos' 
                  : '🌱 Obtener Sugerencias'}
              </motion.button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">Acciones Rápidas</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => setShowCameraAnalysis(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                🔍 Análisis IA
              </button>
              <button 
                onClick={() => setShowTelemetry(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                📊 Dashboard
              </button>
              <button 
                onClick={() => setShowCaptureGallery(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                📸 Galería
              </button>
              <button 
                onClick={() => setShowCropTracker(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                📋 Seguimiento
              </button>
              <button 
                onClick={() => setShowGeoTerrainSimulator(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                🌍 Terreno GPS
              </button>
            </div>
          </div>
        </div>
      </div>

      <NotificationSystem />
      <InstallPromptIOS />
      <CameraAnalysis isOpen={showCameraAnalysis} onClose={() => setShowCameraAnalysis(false)} />
      <TelemetryDashboard isOpen={showTelemetry} onClose={() => setShowTelemetry(false)} />
      <CaptureGallery isOpen={showCaptureGallery} onClose={() => setShowCaptureGallery(false)} />
      <CropTracker isOpen={showCropTracker} onClose={() => setShowCropTracker(false)} />
      
      {showCropDashboard && resultado?.sugerencias && (
        <CropSelectionDashboard 
          suggestions={resultado.sugerencias} 
          onClose={() => setShowCropDashboard(false)} 
        />
      )}

      {showValidationResult && resultado && modo === "definido" && (
        <CropValidationResult
          resultado={resultado}
          cultivo={cultivo}
          ph={ph}
          humedad={humedad}
          temperatura={temperatura}
          onClose={() => setShowValidationResult(false)}
        />
      )}

      {resultado && modo === "sugerido" && (
        <div className="mt-6 w-full flex flex-col items-center">
          {resultado.viable && resultado.sugerencias ? (
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
              className="p-6 rounded-xl shadow-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 w-full max-w-lg text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-4xl mb-3">❌</div>
              <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                No hay cultivos compatibles
              </h2>
              <p className="text-red-700 dark:text-red-300">
                Las condiciones actuales no son adecuadas para ningún cultivo disponible.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;