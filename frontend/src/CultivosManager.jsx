import React, { useEffect, useState } from 'react';

function CultivosManager({ open, onClose }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', ph: '', humedad: '', temperatura: '', imagen: '', icono: '', siembra: '' });

  useEffect(() => {
    if (open) fetchList();
  }, [open]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cultivos');
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetch cultivos', e);
      setList([]);
    } finally { setLoading(false); }
  };

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const startEdit = (c) => {
    setEditing(c._id || c.nombre);
    setForm({
      nombre: c.nombre || '', ph: Array.isArray(c.ph) ? `${c.ph[0]} - ${c.ph[1]}` : (c.ph||''),
      humedad: Array.isArray(c.humedad) ? `${c.humedad[0]} - ${c.humedad[1]}` : (c.humedad||''),
      temperatura: Array.isArray(c.temperatura) ? `${c.temperatura[0]} - ${c.temperatura[1]}` : (c.temperatura||''),
      imagen: c.imagen || '', icono: c.icono || '', siembra: Array.isArray(c.siembra) ? c.siembra.join(',') : (c.siembra||'')
    });
  };

  const resetForm = () => { setEditing(null); setForm({ nombre: '', ph: '', humedad: '', temperatura: '', imagen: '', icono: '', siembra: '' }); };

  const save = async () => {
    try {
      const payload = { ...form, siembra: form.siembra.split(',').map(s=>s.trim()).filter(Boolean) };
      if (editing) {
        const id = editing;
        const res = await fetch(`/api/cultivos/${id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('fallo al actualizar');
      } else {
        const res = await fetch('/api/cultivos', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('fallo al crear');
      }
      await fetchList(); resetForm();
    } catch (e) { console.error('save error', e); alert('Error guardando cultivo'); }
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar cultivo?')) return;
    try {
      const res = await fetch(`/api/cultivos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('error delete');
      await fetchList();
    } catch (e) { console.error('delete', e); alert('Error borrando'); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-6">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Gestión de Cultivos</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => { fetchList(); }}>Refresh</button>
            <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={onClose}>Cerrar</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Lista</h4>
            {loading ? <div>Cargando...</div> : (
              <div className="space-y-2 max-h-96 overflow-auto">
                {list.map(c => (
                  <div key={c._id || c.nombre} className="p-3 border rounded flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{c.nombre}</div>
                      <div className="text-sm text-gray-600">pH: {Array.isArray(c.ph)?`${c.ph[0]}-${c.ph[1]}`:c.ph}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={()=>startEdit(c)}>Editar</button>
                      <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=>remove(c._id || c.nombre)}>Borrar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-2">Formulario</h4>
            <div className="space-y-2">
              <input placeholder="Nombre" value={form.nombre} onChange={e=>handleChange('nombre', e.target.value)} className="w-full p-2 border rounded" />
              <input placeholder="pH (ej: 6.0 - 7.0)" value={form.ph} onChange={e=>handleChange('ph', e.target.value)} className="w-full p-2 border rounded" />
              <input placeholder="Humedad (ej: 60% - 80%)" value={form.humedad} onChange={e=>handleChange('humedad', e.target.value)} className="w-full p-2 border rounded" />
              <input placeholder="Temperatura (ej: 15°C - 22°C)" value={form.temperatura} onChange={e=>handleChange('temperatura', e.target.value)} className="w-full p-2 border rounded" />
              <input placeholder="Imagen URL" value={form.imagen} onChange={e=>handleChange('imagen', e.target.value)} className="w-full p-2 border rounded" />
              <input placeholder="Icono URL" value={form.icono} onChange={e=>handleChange('icono', e.target.value)} className="w-full p-2 border rounded" />
              <input placeholder="Siembra (comas)" value={form.siembra} onChange={e=>handleChange('siembra', e.target.value)} className="w-full p-2 border rounded" />
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={save}>{editing ? 'Guardar' : 'Crear'}</button>
                <button className="px-4 py-2 bg-gray-300 rounded" onClick={resetForm}>Limpiar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CultivosManager;
