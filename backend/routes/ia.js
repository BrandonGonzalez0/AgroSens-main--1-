import connectToDatabase from '../lib/connect.js';
import AnalisisIA from '../models/AnalisisIA.js';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Archivo local de respaldo cuando no hay MongoDB
const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
const STORE_FILE = path.join(DATA_DIR, 'analisis_store.json');

async function ensureDataStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(STORE_FILE);
    } catch (_) {
      await fs.writeFile(STORE_FILE, JSON.stringify([]), 'utf8');
    }
  } catch (e) {
    console.error('No se pudo asegurar el data store local:', e);
  }
}

router.all('/', async (req, res) => {
  // CORS simple
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Si hay una URI de Mongo, nos conectamos; si no, usaremos el fallback de archivos
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  let usingDb = false;
  try {
    if (uri) {
      await connectToDatabase(uri);
      usingDb = true;
    }
  } catch (e) {
    console.warn('No se pudo conectar a MongoDB en /api/ia, usando almacenamiento local:', e.message || e);
    usingDb = false;
  }

  if (req.method === 'GET') {
    if (usingDb) {
      try {
        const { deviceId, cultivo, limit } = req.query;
        const q = {};
        if (deviceId) q.deviceId = deviceId;
        if (cultivo) q.cultivo = cultivo;
        const docs = await AnalisisIA.find(q).sort({ createdAt: -1 }).limit(Number(limit) || 50).lean();
        const out = docs.map(d => ({ ...d, image: d.image ? d.image.toString('base64') : null, heatmap: d.heatmap ? d.heatmap.toString('base64') : null }));
        return res.status(200).json(out);
      } catch (e) {
        console.error('/api/ia GET error', e);
        return res.status(500).json({ error: String(e) });
      }
    } else {
      // Leer desde archivo local
      try {
        await ensureDataStore();
        const raw = await fs.readFile(STORE_FILE, 'utf8');
        const arr = JSON.parse(raw || '[]');
        return res.status(200).json(arr.slice(-50).reverse());
      } catch (e) {
        console.error('Error leyendo analisis locales:', e);
        return res.status(500).json({ error: String(e) });
      }
    }
  }

  // POST
  try {
    const payload = req.body || {};

    // normalize base64 fields (leave as-is if already Buffer when using DB)
    if (payload.heatmap && typeof payload.heatmap === 'string') {
      // keep base64 string for local storage; DB path will convert to Buffer below
    }
    if (payload.image && typeof payload.image === 'string') {
      // keep base64 string for local store
    }

    if (usingDb) {
      // If heatmap/image are base64 strings, convert to Buffer for DB storage
      if (payload.heatmap && typeof payload.heatmap === 'string') {
        try { 
          // Validate base64 format
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(payload.heatmap)) {
            throw new Error('Invalid base64 format');
          }
          payload.heatmap = Buffer.from(payload.heatmap, 'base64'); 
        } catch (e) { 
          console.error('Invalid heatmap data:', e);
          delete payload.heatmap;
        }
      }
      if (payload.image && typeof payload.image === 'string') {
        try { 
          // Validate base64 format
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(payload.image)) {
            throw new Error('Invalid base64 format');
          }
          payload.image = Buffer.from(payload.image, 'base64'); 
        } catch (e) { 
          console.error('Invalid image data:', e);
          delete payload.image;
        }
      }
      const doc = new AnalisisIA(payload);
      await doc.save();
      return res.status(201).json({ ok: true, id: doc._id });
    }

    // Almacenamiento local: guardar objeto en el JSON
    await ensureDataStore();
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const arr = JSON.parse(raw || '[]');
    const id = `${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const record = { id, createdAt: new Date().toISOString(), ...payload };
    arr.push(record);
    await fs.writeFile(STORE_FILE, JSON.stringify(arr, null, 2), 'utf8');
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error('/api/ia POST error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// DELETE route for removing analysis
router.delete('/:id', async (req, res) => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  let usingDb = false;
  
  try {
    if (uri) {
      await connectToDatabase(uri);
      usingDb = true;
    }
  } catch (e) {
    console.warn('No se pudo conectar a MongoDB en DELETE /api/ia, usando almacenamiento local:', e.message || e);
    usingDb = false;
  }

  try {
    const { id } = req.params;
    
    if (usingDb) {
      const deleted = await AnalisisIA.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      return res.json({ ok: true, message: 'Analysis deleted successfully' });
    } else {
      // Local file storage deletion
      await ensureDataStore();
      const raw = await fs.readFile(STORE_FILE, 'utf8');
      const arr = JSON.parse(raw || '[]');
      const newArr = arr.filter(item => item.id !== id);
      
      if (newArr.length === arr.length) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      
      await fs.writeFile(STORE_FILE, JSON.stringify(newArr, null, 2), 'utf8');
      return res.json({ ok: true, message: 'Analysis deleted successfully' });
    }
  } catch (err) {
    console.error('/api/ia DELETE error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

export default router;