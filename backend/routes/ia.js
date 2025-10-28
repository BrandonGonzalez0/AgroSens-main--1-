import connectToDatabase from '../lib/connect.js';
import AnalisisIA from '../models/AnalisisIA.js';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { validatePath } from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for AI analysis endpoints
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'Too many AI analysis requests' }
});

router.use(aiLimiter);

// Archivo local de respaldo cuando no hay MongoDB
const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
const STORE_FILE = path.join(DATA_DIR, 'analisis_store.json');

async function ensureDataStore() {
  try {
    // Validate paths to prevent directory traversal
    const normalizedDataDir = path.resolve(DATA_DIR);
    const normalizedStoreFile = path.resolve(STORE_FILE);
    
    // Ensure store file is within data directory
    if (!normalizedStoreFile.startsWith(normalizedDataDir)) {
      throw new Error('Invalid store file path');
    }
    
    await fs.mkdir(normalizedDataDir, { recursive: true, mode: 0o755 });
    
    try {
      await fs.access(normalizedStoreFile);
    } catch (_) {
      await fs.writeFile(normalizedStoreFile, JSON.stringify([]), { 
        encoding: 'utf8',
        mode: 0o644
      });
    }
  } catch (e) {
    console.error('No se pudo asegurar el data store local:', e);
    throw e;
  }
}

router.all('/', async (req, res) => {
  // Secure CORS headers
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
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

  // POST - Enhanced validation
  try {
    const payload = req.body || {};
    
    // Validate payload structure
    if (typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid payload format' });
    }
    
    // Validate required fields
    const requiredFields = ['deviceId', 'cultivo'];
    for (const field of requiredFields) {
      if (!payload[field] || typeof payload[field] !== 'string') {
        return res.status(400).json({ error: `Missing or invalid field: ${field}` });
      }
    }
    
    // Validate and sanitize base64 fields
    if (payload.heatmap && typeof payload.heatmap === 'string') {
      if (!isValidBase64(payload.heatmap)) {
        return res.status(400).json({ error: 'Invalid heatmap format' });
      }
      // Limit base64 size (2MB when decoded)
      if (payload.heatmap.length > 2.7 * 1024 * 1024) {
        return res.status(400).json({ error: 'Heatmap too large' });
      }
    }
    
    if (payload.image && typeof payload.image === 'string') {
      if (!isValidBase64(payload.image)) {
        return res.status(400).json({ error: 'Invalid image format' });
      }
      // Limit base64 size (2MB when decoded)
      if (payload.image.length > 2.7 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image too large' });
      }
    }

    if (usingDb) {
      // Convert validated base64 strings to Buffer for DB storage
      if (payload.heatmap && typeof payload.heatmap === 'string') {
        try { 
          payload.heatmap = Buffer.from(payload.heatmap, 'base64'); 
        } catch (e) { 
          console.error('Failed to process heatmap data:', e);
          return res.status(400).json({ error: 'Invalid heatmap data' });
        }
      }
      if (payload.image && typeof payload.image === 'string') {
        try { 
          payload.image = Buffer.from(payload.image, 'base64'); 
        } catch (e) { 
          console.error('Failed to process image data:', e);
          return res.status(400).json({ error: 'Invalid image data' });
        }
      }
      const doc = new AnalisisIA(payload);
      await doc.save();
      return res.status(201).json({ ok: true, id: doc._id });
    }

    // Almacenamiento local seguro
    await ensureDataStore();
    
    let arr;
    try {
      const raw = await fs.readFile(STORE_FILE, 'utf8');
      arr = JSON.parse(raw || '[]');
      
      // Validate parsed data
      if (!Array.isArray(arr)) {
        throw new Error('Invalid store format');
      }
    } catch (e) {
      console.error('Error reading store file:', e);
      arr = [];
    }
    
    // Limit store size (keep only last 1000 records)
    if (arr.length >= 1000) {
      arr = arr.slice(-999);
    }
    
    const id = `${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const record = { 
      id, 
      createdAt: new Date().toISOString(), 
      deviceId: payload.deviceId,
      cultivo: payload.cultivo,
      ...(payload.heatmap && { heatmap: payload.heatmap }),
      ...(payload.image && { image: payload.image })
    };
    
    arr.push(record);
    
    try {
      await fs.writeFile(STORE_FILE, JSON.stringify(arr, null, 2), {
        encoding: 'utf8',
        mode: 0o644
      });
    } catch (e) {
      console.error('Error writing store file:', e);
      return res.status(500).json({ error: 'Failed to save analysis' });
    }
    
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error('/api/ia POST error:', err);
    return res.status(500).json({ 
      error: 'Analysis processing failed',
      code: 'ANALYSIS_ERROR'
    });
  }
});

// Utility function to validate base64
function isValidBase64(str) {
  if (typeof str !== 'string') return false;
  
  // Check basic base64 pattern
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) return false;
  
  // Check length (must be multiple of 4)
  if (str.length % 4 !== 0) return false;
  
  try {
    // Try to decode to validate
    Buffer.from(str, 'base64');
    return true;
  } catch {
    return false;
  }
}

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
    
    // Validate ID format
    if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9-]+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
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
    return res.status(500).json({ 
      error: 'Delete operation failed',
      code: 'DELETE_ERROR'
    });
  }
});

export default router;