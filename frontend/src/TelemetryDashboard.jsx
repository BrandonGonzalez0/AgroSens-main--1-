import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function TelemetryDashboard({ deviceId = 'sensor-001' }) {
  const [readings, setReadings] = useState([]);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    fetch('/api/devices')
      .then(r => r.json())
      .then(j => setDevices(j.devices || []))
      .catch(() => setDevices([]));
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/devices/${deviceId}/metrics?limit=20`);
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
        <h4 className="font-semibold">Última lectura</h4>
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
    </div>
  );
}
