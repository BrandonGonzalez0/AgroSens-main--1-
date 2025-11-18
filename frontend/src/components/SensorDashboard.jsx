import React, { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function SensorCard({ device, onSelect, onRefresh }) {
  const moistureState = device.metrics?.soilMoisture || {};
  const isActive = moistureState.status === 'ok';
  const lastSeen = moistureState.lastSeen ? new Date(moistureState.lastSeen) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Sensor de Humedad</div>
          <div className="font-bold text-lg">{device.deviceId}</div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {isActive ? '🟢 Activo' : '🔴 Inactivo'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">💧 Humedad del suelo:</span>
          <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
            {moistureState.lastValue ? `${moistureState.lastValue}%` : '—'}
          </span>
        </div>

        {lastSeen && (
          <div className="text-xs text-gray-500 dark:text-gray-400">Última lectura: {lastSeen.toLocaleString('es-ES')}</div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onSelect(device.deviceId)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ver Historial
        </button>
        <button
          onClick={() => onRefresh && onRefresh(device.deviceId)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Actualizar datos
        </button>
      </div>
    </div>
  );
}

export default function SensorDashboard() {
  const [devices, setDevices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [latest, setLatest] = useState(null);

  const [loading, setLoading] = useState(false);
  const [humedadGlobal, setHumedadGlobal] = useState({ value: null, timestamp: null });
  const [temperaturaGlobal, setTemperaturaGlobal] = useState({ value: null, timestamp: null });
  const [updating, setUpdating] = useState(false);

  async function loadDevices() {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/sensors/v1/devices`);
      const json = await res.json();
      console.log('📱 Dispositivos recibidos:', json);
      setDevices(json.devices || []);
    } catch (err) {
      console.error('❌ Error cargando dispositivos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadLatest(deviceId) {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/sensors/v1/devices/${encodeURIComponent(deviceId)}/latest`);
      if (res.status === 200) {
        const j = await res.json();
        setLatest(j);
      } else {
        setLatest(null);
      }
    } catch (err) {
      console.error(err);
      setLatest(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMQTTValues(deviceId = null) {
    try {
      const url = deviceId ? `${BASE}/sensores/todo?device=${encodeURIComponent(deviceId)}` : `${BASE}/sensores/todo`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('No response');
      const j = await res.json();
      setHumedadGlobal(j.humedad || { value: null, timestamp: null });
      setTemperaturaGlobal(j.temperatura || { value: null, timestamp: null });
    } catch (err) {
      console.error('Error fetching MQTT values', err);
    }
  }

  async function handleRefreshDevice(deviceId) {
    try {
      setUpdating(true);
      await loadMQTTValues(deviceId);
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    loadDevices();
    loadMQTTValues();
    const id = setInterval(loadDevices, 10000);
    const id2 = setInterval(() => loadMQTTValues(), 7000);
    return () => {
      clearInterval(id);
      clearInterval(id2);
    };
  }, []);

  useEffect(() => {
    if (selected) {
      loadLatest(selected);
      loadMQTTValues(selected);
    }
  }, [selected]);

  async function refreshData() {
    console.log('🔄 Actualizando datos...');
    await loadDevices();
    if (selected) {
      await loadLatest(selected);
    }
    await loadMQTTValues();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Sensores</h2>

      {/* Estado del sistema */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white">📡 Estado del Sistema</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300">Dispositivos: <span className="font-bold">{devices.length}</span></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl mb-1">💧</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Sensores de Humedad (reg.)</div>
            <div className="font-bold text-blue-600 dark:text-blue-400">{devices.filter(d => d.metrics?.soilMoisture?.status === 'ok').length}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🌡️</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Temperatura (MQTT)</div>
            <div className="font-bold text-green-600 dark:text-green-400">{temperaturaGlobal.value !== null ? `${temperaturaGlobal.value}°C` : '—'}</div>
            <div className="text-xs text-gray-500">Última: {temperaturaGlobal.timestamp ? new Date(temperaturaGlobal.timestamp).toLocaleTimeString('es-ES') : '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">💧</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Humedad (MQTT)</div>
            <div className="font-bold text-blue-600 dark:text-blue-400">{humedadGlobal.value !== null ? `${humedadGlobal.value}%` : '—'}</div>
            <div className="text-xs text-gray-500">Última: {humedadGlobal.timestamp ? new Date(humedadGlobal.timestamp).toLocaleTimeString('es-ES') : '—'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button onClick={refreshData} disabled={updating} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">🔄 Actualizar datos</button>
          <button onClick={async () => { setUpdating(true); await loadMQTTValues(); setUpdating(false); }} className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">⤴️ Actualizar desde Broker (MQTT)</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {devices.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-gray-500">No hay dispositivos registrados. Usa el botón de prueba para crear uno.</div>
        ) : (
          devices.map(d => <SensorCard key={d.deviceId} device={d} onSelect={setSelected} onRefresh={handleRefreshDevice} />)
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold">Detalles</h3>
        {selected ? (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mt-3">
            <div className="mb-2"><strong>Device:</strong> {selected}</div>
            <div className="mb-2"><strong>Última lectura:</strong></div>
            {latest ? (
              <pre className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded">{JSON.stringify(latest, null, 2)}</pre>
            ) : <div className="text-sm text-gray-500">Sin lecturas recientes</div>}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-semibold mb-3 text-gray-800 dark:text-white">📋 Historial de Lecturas</h4>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {latest ? (
                  <div className="space-y-2">
                    <div>Dispositivo: <span className="font-medium">{latest.deviceId}</span></div>
                    <div>Humedad: <span className="font-bold text-blue-600">{latest.humedad_suelo}%</span></div>
                    <div>Fecha: <span className="font-medium">{new Date(latest.timestamp).toLocaleString('es-ES')}</span></div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">No hay lecturas disponibles para este dispositivo</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 mt-2">Selecciona un dispositivo para ver detalles</div>
        )}
      </div>
    </div>
  );
}
