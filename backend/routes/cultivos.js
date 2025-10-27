import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Cultivo from '../models/Cultivo.js';
import express from 'express';
const { sanitizeInput } = require('../middleware/validation.js');

const router = express.Router();

const DATA_FILE = path.join(process.cwd(), 'backend', 'data', 'cultivos.json');

function readFallback() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8') || '[]';
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo cultivos fallback:', e);
    return [];
  }
}

function writeFallback(arr) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error escribiendo cultivos fallback:', e);
    return false;
  }
}

// Helper: decide si usar DB o fallback
function usingDB() {
  return mongoose && mongoose.connection && mongoose.connection.readyState === 1;
}

// List all cultivos
router.get('/', async (req, res) => {
  try {
    if (usingDB()) {
      const lista = await Cultivo.find().lean();
      return res.json(lista);
    }
    const fallback = readFallback();
    return res.json(fallback);
  } catch (e) {
    console.error('/api/cultivos GET error', e);
    return res.status(500).json({ error: 'Error al leer cultivos' });
  }
});

// Get by id or name
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (usingDB()) {
      const doc = await Cultivo.findById(id).lean();
      if (!doc) return res.status(404).json({ error: 'Cultivo no encontrado' });
      return res.json(doc);
    }
    const list = readFallback();
    const found = list.find(c => c._id === id || c.nombre && c.nombre.toLowerCase() === id.toLowerCase());
    if (!found) return res.status(404).json({ error: 'Cultivo no encontrado (fallback)' });
    return res.json(found);
  } catch (e) {
    console.error('/api/cultivos/:id error', e);
    return res.status(500).json({ error: 'Error buscando cultivo' });
  }
});

// Create
router.post('/', sanitizeInput, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.nombre) return res.status(400).json({ error: 'Nombre requerido' });

    if (usingDB()) {
      const doc = new Cultivo(payload);
      await doc.save();
      return res.status(201).json(doc);
    }

    const list = readFallback();
    // create a simple _id for fallback
    const id = `f-${Date.now()}`;
    const item = { _id: id, ...payload };
    list.push(item);
    writeFallback(list);
    return res.status(201).json(item);
  } catch (e) {
    console.error('/api/cultivos POST error', e);
    return res.status(500).json({ error: 'Error creando cultivo' });
  }
});

// Update
router.put('/:id', sanitizeInput, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    if (usingDB()) {
      const updated = await Cultivo.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Cultivo no encontrado' });
      return res.json(updated);
    }
    const list = readFallback();
    const idx = list.findIndex(c => c._id === id || (c.nombre && c.nombre.toLowerCase() === id.toLowerCase()));
    if (idx === -1) return res.status(404).json({ error: 'Cultivo no encontrado (fallback)' });
    list[idx] = { ...list[idx], ...payload };
    writeFallback(list);
    return res.json(list[idx]);
  } catch (e) {
    console.error('/api/cultivos PUT error', e);
    return res.status(500).json({ error: 'Error actualizando cultivo' });
  }
});

// Delete
router.delete('/:id', sanitizeInput, async (req, res) => {
  try {
    const { id } = req.params;
    if (usingDB()) {
      const removed = await Cultivo.findByIdAndDelete(id).lean();
      if (!removed) return res.status(404).json({ error: 'Cultivo no encontrado' });
      return res.json({ ok: true });
    }
    const list = readFallback();
    const newList = list.filter(c => !(c._id === id || (c.nombre && c.nombre.toLowerCase() === id.toLowerCase())));
    if (newList.length === list.length) return res.status(404).json({ error: 'Cultivo no encontrado (fallback)' });
    writeFallback(newList);
    return res.json({ ok: true });
  } catch (e) {
    console.error('/api/cultivos DELETE error', e);
    return res.status(500).json({ error: 'Error borrando cultivo' });
  }
});

export default router;
