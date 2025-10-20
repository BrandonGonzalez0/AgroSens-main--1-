import connectToDatabase from '../lib/connect.js';
import AnalisisIA from '../models/AnalisisIA.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const uri = process.env.MONGO_URI;
  if (!uri) return res.status(500).json({ error: 'MONGO_URI not configured' });
  await connectToDatabase(uri);

  if (req.method === 'GET') {
    try {
      const { deviceId, cultivo, limit } = req.query;
      const q = {};
      if (deviceId) q.deviceId = deviceId;
      if (cultivo) q.cultivo = cultivo;
      const docs = await AnalisisIA.find(q).sort({ createdAt: -1 }).limit(Number(limit) || 50).lean();
      // convert image buffer to base64 for transport
      const out = docs.map(d => ({ ...d, image: d.image ? d.image.toString('base64') : null, heatmap: d.heatmap ? d.heatmap.toString('base64') : null }));
      return res.status(200).json(out);
    } catch (e) {
      console.error('/api/ia GET error', e);
      return res.status(500).json({ error: String(e) });
    }
  }

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) return res.status(500).json({ error: 'MONGO_URI not configured' });
    await connectToDatabase(uri);
  const payload = req.body || {};

    // If heatmap was sent as base64, store as Buffer
    if (payload.heatmap && typeof payload.heatmap === 'string') {
      try { payload.heatmap = Buffer.from(payload.heatmap, 'base64'); } catch (e) { /* leave as-is */ }
    }
    // If image was sent as base64 JPEG/PNG string, store as Buffer
    if (payload.image && typeof payload.image === 'string') {
      try { payload.image = Buffer.from(payload.image, 'base64'); } catch (e) { /* leave as-is */ }
    }

    const doc = new AnalisisIA(payload);
    await doc.save();
    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('/api/analisis error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
