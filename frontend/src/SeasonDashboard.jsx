import React, { useMemo, useState } from 'react';
import cultivosDB from './data/cultivos.json';

const SEASONS_SOUTH = {
  winter: [6,7,8],
  spring: [9,10,11],
  summer: [12,1,2],
  autumn: [3,4,5]
};

const SEASONS_NORTH = {
  winter: [12,1,2],
  spring: [3,4,5],
  summer: [6,7,8],
  autumn: [9,10,11]
};

// approximate representative temperature per season (°C)
const SEASON_TEMPS = {
  winter: 8,
  spring: 18,
  summer: 24,
  autumn: 16
};

function monthToSeason(month, hemisphere = 'south') {
  const m = month; // 1..12
  const map = hemisphere === 'north' ? SEASONS_NORTH : SEASONS_SOUTH;
  for (const [s, arr] of Object.entries(map)) {
    if (arr.includes(m)) return s;
  }
  return 'summer';
}

function scoreForCropBySeason(crop, season) {
  // crop.temperatura expected [min, max]
  const tempRange = Array.isArray(crop.temperatura) ? crop.temperatura.map(Number) : null;
  const mid = tempRange ? (tempRange[0] + tempRange[1]) / 2 : 0;
  const seasonTemp = SEASON_TEMPS[season] || 18;
  const diff = Math.abs(mid - seasonTemp);
  // base score 0..100 inversely proportional to diff
  let score = Math.max(0, 100 - diff * 6);
  // bonus if seasonTemp inside crop range
  if (tempRange && seasonTemp >= tempRange[0] && seasonTemp <= tempRange[1]) score += 10;
  return Math.min(100, Math.round(score));
}

export default function SeasonDashboard() {
  const [hemisphere, setHemisphere] = useState('south');
  const [selectedKey, setSelectedKey] = useState(null);
  const now = new Date();
  const month = now.getMonth() + 1;
  const season = monthToSeason(month, hemisphere);

  const ranked = useMemo(() => {
    const entries = Object.keys(cultivosDB).map(k => {
      const c = cultivosDB[k];
      const score = scoreForCropBySeason(c, season);
      return { key: k, nombre: c.nombre || k, score, cultivo: c };
    });
    entries.sort((a,b) => b.score - a.score);
    return entries;
  }, [season]);

  const selected = selectedKey ? ranked.find(r => r.key === selectedKey) : null;

  return (
    <div className="mt-6 w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">Ranking de cultivo por temporada</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300">Temporada actual: <strong className="ml-1">{season}</strong> · Hemisferio: <strong>{hemisphere}</strong></div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Hemisferio</label>
          <select value={hemisphere} onChange={(e) => setHemisphere(e.target.value)} className="p-2 rounded bg-gray-100 dark:bg-gray-700 text-sm">
            <option value="south">Sur</option>
            <option value="north">Norte</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ranked.slice(0,6).map((r, idx) => (
          <div key={r.key} className={`p-3 rounded-xl bg-white dark:bg-gray-900 shadow flex gap-3 items-start cursor-pointer hover:translate-y-1 transition-transform ${selectedKey === r.key ? 'ring-2 ring-green-300' : ''}`} onClick={() => setSelectedKey(r.key)}>
            <div className="w-20 h-20 overflow-hidden rounded-lg flex-shrink-0">
              <img src={r.cultivo.imagen} alt={r.nombre} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{r.nombre}</div>
                <div className="text-sm small-tag bg-green-100 text-green-800">{r.score}%</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Temperatura ideal: {Array.isArray(r.cultivo.temperatura) ? `${r.cultivo.temperatura[0]} - ${r.cultivo.temperatura[1]}°C` : r.cultivo.temperatura}</div>
              <div className="text-xs text-gray-500">Humedad: {Array.isArray(r.cultivo.humedad) ? `${r.cultivo.humedad[0]} - ${r.cultivo.humedad[1]}%` : r.cultivo.humedad}</div>
            </div>
          </div>
        ))}
      </div>
        {/* Info panel for selected crop */}
        {selected && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 shadow">
            <div className="flex gap-4 items-start">
              <div className="w-28 h-28 overflow-hidden rounded-lg">
                <img src={selected.cultivo.imagen} alt={selected.nombre} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{selected.nombre}</h4>
                  <div className="text-sm small-tag bg-green-100 text-green-800">{selected.score}%</div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">Temperatura ideal: {Array.isArray(selected.cultivo.temperatura) ? `${selected.cultivo.temperatura[0]} - ${selected.cultivo.temperatura[1]}°C` : selected.cultivo.temperatura}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Humedad ideal: {Array.isArray(selected.cultivo.humedad) ? `${selected.cultivo.humedad[0]} - ${selected.cultivo.humedad[1]}%` : selected.cultivo.humedad}</div>
                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">{selected.score >= 80 ? 'Gran candidato para plantar esta temporada.' : 'Considerar ajustes: revisar riego y temperatura del invernadero.'}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => setSelectedKey(null)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">Cerrar</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
