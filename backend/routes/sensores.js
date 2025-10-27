import connectToDatabase from '../lib/connect.js';
import express from 'express';
import LecturaSensor from '../models/LecturaSensor.js';
import { sanitizeInput } from '../middleware/validation.js';

const router = express.Router();

// Get latest sensor reading
router.get('/latest', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      // Simulate sensor data when no database
      const mockData = {
        ph: 6.5 + (Math.random() - 0.5) * 2,
        soilMoisture: 65 + (Math.random() - 0.5) * 20,
        temperature: 22 + (Math.random() - 0.5) * 10,
        timestamp: new Date().toISOString()
      };
      return res.json(mockData);
    }
    
    await connectToDatabase(uri);
    const latest = await LecturaSensor.findOne().sort({ timestamp: -1 }).lean();
    
    if (!latest) {
      return res.status(404).json({ error: 'No sensor data available' });
    }
    
    return res.json(latest);
  } catch (err) {
    console.error('/api/sensores/latest error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

router.post('/', sanitizeInput, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) return res.status(500).json({ error: 'MONGO_URI not configured' });
    await connectToDatabase(uri);
    const payload = req.body || {};
    const doc = new LecturaSensor(payload);
    await doc.save();
    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('/api/sensores error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

export default router;