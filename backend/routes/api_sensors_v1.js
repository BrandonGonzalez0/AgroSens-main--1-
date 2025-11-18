import express from 'express';
import Sensor from '../models/Sensor.js';
import SensorReading from '../models/SensorReading.js';
import { sanitizeInput } from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
import fs from 'fs';
import path from 'path';

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120, message: { error: 'Too many requests' } });
router.use(limiter);

// Servir sketch Arduino para ESP32 (descarga / integración)
router.get('/sketches/esp32', (req, res) => {
  const sketchPath = path.join(__dirname, '..', '..', 'hardware', 'esp32', 'ESP32_sensor.ino');
  fs.readFile(sketchPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).json({ error: 'Sketch not found' });
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(data);
  });
});

function isRealNumber(x) {
  return x !== null && x !== undefined && x !== '' && !Number.isNaN(Number(x));
}

router.post('/readings', sanitizeInput, async (req, res) => {
  try {
    const body = req.body || {};
    const deviceId = String(body.deviceId || 'unknown-device');

    const readingDoc = {
      deviceId,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      humedad_suelo: isRealNumber(body.humedad_suelo) ? Number(body.humedad_suelo) : null,
      temperatura_aire: isRealNumber(body.temperatura_aire) ? Number(body.temperatura_aire) : null,
      humedad_aire: isRealNumber(body.humedad_aire) ? Number(body.humedad_aire) : null,
      ph_suelo: isRealNumber(body.ph_suelo) ? Number(body.ph_suelo) : null,
      raw: body
    };

    const reading = new SensorReading(readingDoc);
    await reading.save();

    const now = new Date();
    const update = { $set: {}, $setOnInsert: { createdAt: now }, $currentDate: { updatedAt: true } };

    if (isRealNumber(readingDoc.humedad_suelo)) {
      update.$set['metrics.soilMoisture.status'] = 'ok';
      update.$set['metrics.soilMoisture.lastValue'] = readingDoc.humedad_suelo;
      update.$set['metrics.soilMoisture.lastSeen'] = now;
    }
    if (isRealNumber(readingDoc.temperatura_aire)) {
      update.$set['metrics.temperature.status'] = 'ok';
      update.$set['metrics.temperature.lastValue'] = readingDoc.temperatura_aire;
      update.$set['metrics.temperature.lastSeen'] = now;
    }
    if (isRealNumber(readingDoc.humedad_aire)) {
      update.$set['metrics.airHumidity.status'] = 'ok';
      update.$set['metrics.airHumidity.lastValue'] = readingDoc.humedad_aire;
      update.$set['metrics.airHumidity.lastSeen'] = now;
    }
    if (isRealNumber(readingDoc.ph_suelo)) {
      update.$set['metrics.ph.status'] = 'ok';
      update.$set['metrics.ph.lastValue'] = readingDoc.ph_suelo;
      update.$set['metrics.ph.lastSeen'] = now;
    }

    await Sensor.findOneAndUpdate({ deviceId }, update, { upsert: true, new: true });

    return res.status(201).json({ ok: true, id: reading._id });
  } catch (err) {
    console.error('POST /api/sensors/v1/readings error:', err);
    return res.status(500).json({ error: 'Sensor save failed' });
  }
});

router.post('/devices/:deviceId/manual-ph', sanitizeInput, async (req, res) => {
  try {
    const deviceId = String(req.params.deviceId || 'unknown-device');
    const ph = req.body.ph_suelo !== undefined ? req.body.ph_suelo : null;
    if (!isRealNumber(ph)) {
      return res.status(400).json({ error: 'ph_suelo required and must be number' });
    }
    const now = new Date();
    const reading = new SensorReading({ deviceId, ph_suelo: Number(ph), timestamp: req.body.timestamp ? new Date(req.body.timestamp) : now, raw: req.body });
    await reading.save();

    await Sensor.findOneAndUpdate(
      { deviceId },
      { $set: { 'metrics.ph.status': 'manual', 'metrics.ph.lastValue': Number(ph), 'metrics.ph.lastSeen': now }, $setOnInsert: { createdAt: now } },
      { upsert: true, new: true }
    );

    return res.status(201).json({ ok: true, id: reading._id });
  } catch (err) {
    console.error('POST manual-ph error:', err);
    return res.status(500).json({ error: 'Manual ph save failed' });
  }
});

router.get('/devices', async (req, res) => {
  try {
    const sensors = await Sensor.find({}, { deviceId: 1, metrics: 1, updatedAt: 1 }).lean();
    return res.json({ devices: sensors });
  } catch (err) {
    console.error('GET devices error:', err);
    return res.status(500).json({ error: 'Could not list devices' });
  }
});

router.get('/devices/:deviceId/latest', async (req, res) => {
  try {
    const deviceId = String(req.params.deviceId || '');
    const latest = await SensorReading.findOne({ deviceId }).sort({ timestamp: -1 }).lean();
    if (!latest) return res.status(404).json({ error: 'No readings for device' });
    return res.json(latest);
  } catch (err) {
    console.error('GET latest reading error:', err);
    return res.status(500).json({ error: 'Could not fetch latest' });
  }
});

export default router;
