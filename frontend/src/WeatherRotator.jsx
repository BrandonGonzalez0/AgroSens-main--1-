import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWeatherFor } from './lib/weather';

const CITIES = [
  { name: 'La Serena', lat: -29.9023, lon: -71.2539 },
  { name: 'Santiago', lat: -33.4489, lon: -70.6693 },
  { name: 'Valparaíso', lat: -33.0472, lon: -71.6127 },
  { name: 'Concepción', lat: -36.8201, lon: -73.0444 },
  { name: 'Antofagasta', lat: -23.6500, lon: -70.4000 }
];

export default function WeatherRotator({ intervalMs = 5000 }) {
  const [index, setIndex] = useState(0);
  const [data, setData] = useState(null);
  const [paused, setPaused] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let timer;

    const load = async () => {
      const city = CITIES[index % CITIES.length];
      setData({ loading: true, city: city.name });
      try {
        const w = await fetchWeatherFor(city.lat, city.lon);
        if (mounted.current) {
          setData({ 
            loading: false, 
            city: city.name, 
            weather: w,
            lastUpdate: new Date().toLocaleTimeString()
          });
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
        if (mounted.current) {
          setData({ 
            loading: false, 
            city: city.name, 
            error: err.message || 'Error de conexión',
            lastUpdate: new Date().toLocaleTimeString()
          });
        }
      }
    };

    load();

    if (!paused) {
      timer = setInterval(() => {
        setIndex(i => (i + 1) % CITIES.length);
      }, intervalMs);
    }

    return () => clearInterval(timer);
  }, [index, intervalMs, paused]);

  const onSelectCity = (e) => {
    const idx = Number(e.target.value);
    if (!Number.isNaN(idx)) {
      setIndex(idx);
      setPaused(true);
    }
  };

  const resume = () => {
    setPaused(false);
    // advance to next immediately so user sees change flow
    setIndex(i => (i + 1) % CITIES.length);
  };

  const refresh = () => {
    // Force refresh current city
    setData({ loading: true, city: CITIES[index % CITIES.length].name });
    const city = CITIES[index % CITIES.length];
    fetchWeatherFor(city.lat, city.lon)
      .then(w => {
        if (mounted.current) {
          setData({ 
            loading: false, 
            city: city.name, 
            weather: w,
            lastUpdate: new Date().toLocaleTimeString()
          });
        }
      })
      .catch(err => {
        if (mounted.current) {
          setData({ 
            loading: false, 
            city: city.name, 
            error: err.message || 'Error de conexión',
            lastUpdate: new Date().toLocaleTimeString()
          });
        }
      });
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 shadow text-center col-span-3">
      <AnimatePresence mode="wait">
        {data ? (
          <motion.div
            key={data.city}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45 }}
            className="w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Ciudad</div>
                <div className="text-3xl font-bold text-green-600">{data.city} <span className="text-2xl ml-2">{data.weather && data.weather.icon}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <select value={index} onChange={onSelectCity} className="p-2 border rounded bg-white dark:bg-gray-700 dark:text-white text-sm">
                  {CITIES.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}
                </select>
                <button onClick={refresh} className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700" title="Actualizar">
                  🔄
                </button>
                {paused ? (
                  <button onClick={resume} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">▶️</button>
                ) : (
                  <button onClick={() => setPaused(true)} className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">⏸️</button>
                )}
              </div>
            </div>
            {data.loading && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                Obteniendo clima...
              </div>
            )}
            {data.error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                ⚠️ {data.error}
                {data.lastUpdate && <div className="text-xs mt-1">Último intento: {data.lastUpdate}</div>}
              </div>
            )}
            {data.weather && (
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-extrabold">{Math.round(data.weather.temperature)}°C</div>
                  {data.weather.humidity && (
                    <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                      <div>💧 {Math.round(data.weather.humidity)}%</div>
                      {data.weather.windspeed && <div>💨 {Math.round(data.weather.windspeed)} m/s</div>}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{data.weather.description || 'Clima actual'}</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {data.weather.source} {data.weather.expired && '(Cache)'}  {data.weather.fallback && '(Simulado)'}
                  </div>
                  {data.lastUpdate && (
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {data.lastUpdate}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-600">Iniciando clima...</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
