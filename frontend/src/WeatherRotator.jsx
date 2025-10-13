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
        if (mounted.current) setData({ loading: false, city: city.name, weather: w });
      } catch (err) {
        if (mounted.current) setData({ loading: false, city: city.name, error: String(err) });
      }
    };

    load();

    if (!paused) {
      timer = setInterval(() => {
        setIndex(i => (i + 1) % CITIES.length);
      }, intervalMs);
    }

    return () => clearInterval(timer);
  }, [index, intervalMs]);

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
                <select value={index} onChange={onSelectCity} className="p-2 border rounded bg-white text-sm">
                  {CITIES.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}
                </select>
                {paused ? (
                  <button onClick={resume} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Reanudar</button>
                ) : (
                  <button onClick={() => setPaused(true)} className="px-3 py-1 bg-gray-200 rounded text-sm">Pausar</button>
                )}
              </div>
            </div>
            {data.loading && <div className="text-sm text-gray-600">Cargando clima...</div>}
            {data.error && <div className="text-sm text-red-600">Error: {data.error}</div>}
            {data.weather && (
              <div className="mt-2">
                <div className="text-4xl font-extrabold">{Math.round(data.weather.temperature)}°C</div>
                <div className="text-sm text-gray-600">{data.weather.description || 'Clima actual'}</div>
                <div className="text-xs text-gray-500 mt-1">Fuente: Open-Meteo (sin clave)</div>
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
