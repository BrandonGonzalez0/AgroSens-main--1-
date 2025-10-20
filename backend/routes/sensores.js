import connectToDatabase from '../lib/connect.js';
import express from 'express';
import LecturaSensor from '../models/LecturaSensor.js';

const router = express.Router();

router.post('/', async (req, res) => {
  res.json({ message: "Ruta de sensores funciona" });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) return res.status(500).json({ error: 'MONGO_URI not configured' });
    await connectToDatabase(uri);
    const payload = req.body || {};
    const doc = new LecturaSensor(payload);
    await doc.save();
    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('/api/lecturas error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

export default router;