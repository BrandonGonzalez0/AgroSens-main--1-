import React, { useEffect, useState } from 'react';
import { getAnalyses, getAnalysisBase64 } from './lib/offlineDB';

// Historial.jsx: muestra los análisis guardados y permite seleccionar hasta 2 para comparar
export default function Historial({ onClose, onCompare }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState('avanzado'); // 'simple' | 'avanzado'

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rs = await getAnalyses();
        if (!mounted || !rs) return;
        const withThumbs = await Promise.all((rs || []).map(async (r) => {
          try {
            const data = await getAnalysisBase64(r.id);
            return { ...r, thumb: data };
          } catch (e) { return r; }
        }));
        if (mounted) setItems(withThumbs);
      } catch (err) {
        console.error('Historial: error cargando análisis', err);
        if (mounted) setItems([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleSelect = (it) => {
    setSelected(prev => {
      const found = prev.find(p => p.id === it.id);
      if (found) return prev.filter(p => p.id !== it.id);
      if (prev.length >= 2) return [prev[1], it];
      return [...prev, it];
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-[95%] max-w-4xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Historial de análisis</h3>
          <div className="flex gap-2">
            <button onClick={() => setMode(mode === 'avanzado' ? 'simple' : 'avanzado')} className="px-3 py-1 bg-gray-200 rounded">{mode === 'avanzado' ? 'Vista simple' : 'Vista avanzada'}</button>
            <button onClick={onClose} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded">Cerrar</button>
            <button onClick={() => onCompare(selected)} disabled={selected.length < 2} className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50">Comparar</button>
          </div>
        </div>

        {mode === 'simple' ? (
          <div>
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Cultivo</th>
                  <th className="text-left p-2">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-2">{new Date(it.timestamp).toLocaleString()}</td>
                    <td className="p-2">{it.cultivo || it.deviceId}</td>
                    <td className="p-2">{it.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <ul className="space-y-2 max-h-80 overflow-auto">
                {items.length === 0 && <li className="text-sm text-gray-600">No hay análisis guardados aún.</li>}
                {items.map(it => (
                  <li key={it.id} className="p-2 rounded border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {it.thumb ? <img src={it.thumb} alt="thumb" className="w-16 h-12 object-cover rounded" /> : <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center text-xs">Sin foto</div>}
                      <div>
                        <div className="text-sm font-semibold">{it.cultivo || it.deviceId || 'Análisis'}</div>
                        <div className="text-xs text-gray-500">{new Date(it.timestamp).toLocaleString()}</div>
                        <div className="text-xs">Veredicto: <strong>{it.verdict}</strong></div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => toggleSelect(it)} className={`px-2 py-1 rounded text-xs ${selected.find(s => s.id === it.id) ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>{selected.find(s => s.id === it.id) ? 'Seleccionado' : 'Seleccionar'}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Vista rápida</div>
              {selected.length === 0 && <div className="text-sm text-gray-600">Selecciona hasta dos análisis para comparar.</div>}
              {selected.map(s => (
                <div key={s.id} className="p-2 mb-2 border rounded">
                  <div className="text-sm font-medium">{s.cultivo || s.deviceId}</div>
                  <div className="text-xs text-gray-500">{new Date(s.timestamp).toLocaleString()}</div>
                  <div className="mt-2">Veredicto: <strong>{s.verdict}</strong></div>
                  <div className="text-xs">R: {s.avg?.r} G: {s.avg?.g} B: {s.avg?.b}</div>
                  <div className="text-xs">Verde: {s.greenRatio} · Rojo: {s.redPortion}</div>
                  {s.estimateDays && <div className="text-xs">Estimado días: {s.estimateDays}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { getAnalyses, getAnalysisBase64 } from './lib/offlineDB';

export default function Historial({ onClose, onCompare }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (typeof getAnalyses !== 'function') throw new Error('getAnalyses no está disponible');
        const rs = await getAnalyses();
        if (!mounted || !rs) return;
        const withThumbs = await Promise.all((rs || []).map(async (r) => {
          try {
            if (typeof getAnalysisBase64 === 'function') {
              const data = await getAnalysisBase64(r.id);
              return { ...r, thumb: data };
            }
            return r;
          } catch (e) { console.warn('Error cargando miniatura', e); return r; }
        }));
        if (mounted) setItems(withThumbs);
      } catch (err) {
        console.error('Historial: error cargando análisis', err);
        if (mounted) setItems([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleSelect = (it) => {
    setSelected(prev => {
      const found = prev.find(p => p.id === it.id);
      if (found) return prev.filter(p => p.id !== it.id);
      if (prev.length >= 2) return [prev[1], it];
      return [...prev, it];
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-[95%] max-w-4xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Historial de análisis</h3>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded">Cerrar</button>
            <button onClick={() => onCompare(selected)} disabled={selected.length < 2} className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50">Comparar</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <ul className="space-y-2 max-h-80 overflow-auto">
              {items.length === 0 && <li className="text-sm text-gray-600">No hay análisis guardados aún.</li>}
              {items.map(it => (
                <li key={it.id} className="p-2 rounded border flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {it.thumb ? <img src={it.thumb} alt="thumb" className="w-16 h-12 object-cover rounded" /> : <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center text-xs">Sin foto</div>}
                    <div>
                      <div className="text-sm font-semibold">{it.cultivo || it.deviceId || 'Análisis'}</div>
                      <div className="text-xs text-gray-500">{new Date(it.timestamp).toLocaleString()}</div>
                      <div className="text-xs">Veredicto: <strong>{it.verdict}</strong></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => toggleSelect(it)} className={`px-2 py-1 rounded text-xs ${selected.find(s => s.id === it.id) ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>{selected.find(s => s.id === it.id) ? 'Seleccionado' : 'Seleccionar'}</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Vista rápida</div>
            {selected.length === 0 && <div className="text-sm text-gray-600">Selecciona hasta dos análisis para comparar.</div>}
            {selected.map(s => (
              <div key={s.id} className="p-2 mb-2 border rounded">
                <div className="text-sm font-medium">{s.cultivo || s.deviceId}</div>
                <div className="text-xs text-gray-500">{new Date(s.timestamp).toLocaleString()}</div>
                <div className="text-xs">Veredicto: <strong>{s.verdict}</strong></div>
                <div className="text-xs">Verde: {s.greenRatio} · Rojo: {s.redPortion}</div>
                {s.estimateDays && <div className="text-xs">Estimado días: {s.estimateDays}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
