import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { flushQueue } from './lib/sync';

export default function TelemetryDashboard({ deviceId = 'sensor-001' }) {
  const [readings, setReadings] = useState([]);
  const [devices, setDevices] = useState([]);
  const [health, setHealth] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const BASE = import.meta.env.VITE_TELEMETRY_URL || '';
  const API_BASE = BASE || '';

  useEffect(() => {
    const url = (API_BASE || '') + '/api/devices';
    fetch(url)
      .then(r => r.json())
      .then(j => setDevices(j.devices || []))
      .catch(() => setDevices([]));
    // fetch health
    (async () => {
      try {
        const res = await fetch((API_BASE || '') + '/api/health');
        const j = await res.json();
        setHealth(j);
      } catch (e) {
        setHealth(null);
      }
    })();
  }, [API_BASE]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
  const res = await fetch((API_BASE || '') + `/api/devices/${deviceId}/metrics?limit=20`);
        const json = await res.json();
        if (mounted) setReadings(json.readings || []);
      } catch (e) {
        console.warn(e);
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, [deviceId]);

  const series = readings.map(r => ({ t: new Date(r.timestamp).toLocaleTimeString(), moisture: Number(r.soilMoisture), ph: Number(r.ph), temp: Number(r.temperature) }));

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow w-full">
      <h3 className="text-lg font-semibold mb-3">Telemetry Dashboard</h3>
      <div className="mb-3 text-sm">Devices: {devices.join(', ') || 'none'}</div>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={series}>
            <XAxis dataKey="t" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="moisture" stroke="#3b82f6" name="Soil Moisture" />
            <Line type="monotone" dataKey="ph" stroke="#10b981" name="pH" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Última lectura</h4>
          <div>
            <button onClick={async () => { setSyncing(true); const res = await flushQueue(); setSyncResult(res); setSyncing(false); }} className="px-3 py-1 bg-green-600 text-white rounded mr-2">{syncing ? 'Sincronizando...' : 'Sincronizar ahora'}</button>
            <button onClick={async () => { const res = await fetch((API_BASE || '') + '/api/health'); const j = await res.json(); setHealth(j); }} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">Actualizar health</button>
          </div>
        </div>
        {readings.length ? (
          <div className="text-sm">
            <div>pH: {readings[readings.length-1].ph}</div>
            <div>Humedad: {readings[readings.length-1].soilMoisture}</div>
            <div>Temp: {readings[readings.length-1].temperature}</div>
            <div>Timestamp: {new Date(readings[readings.length-1].timestamp).toLocaleString()}</div>
          </div>
        ) : (
          <div className="text-sm">Sin lecturas</div>
        )}
      </div>
      {syncResult && (
        <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded">
          <div className="font-semibold">Resultados de sincronización</div>
          <pre className="text-xs mt-2 max-h-48 overflow-auto">{JSON.stringify(syncResult, null, 2)}</pre>
        </div>
      )}

      {health && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          <div>Estado: {health.ok ? 'OK' : 'No disponible'}</div>
          <div>Lecturas: {health.readings}</div>
          <div>Última lectura: {health.lastTimestamp ? new Date(health.lastTimestamp).toLocaleString() : 'n/a'}</div>
        </div>
      )}
    </div>
  );
}
