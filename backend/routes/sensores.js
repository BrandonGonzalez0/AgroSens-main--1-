import connectToDatabase from '../lib/connect.js';
import express from 'express';
import LecturaSensor from '../models/LecturaSensor.js';
import { sanitizeInput } from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for sensor endpoints
const sensorLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: { error: 'Too many sensor requests' }
});

router.use(sensorLimiter);

// Get latest sensor reading
router.get('/latest', async (req, res) => {
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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      // Simulate realistic sensor data when no database
      const mockData = {
        ph: Math.max(0, Math.min(14, 6.5 + (Math.random() - 0.5) * 2)),
        soilMoisture: Math.max(0, Math.min(100, 65 + (Math.random() - 0.5) * 20)),
        temperature: Math.max(-10, Math.min(50, 22 + (Math.random() - 0.5) * 10)),
        timestamp: new Date().toISOString(),
        deviceId: 'mock-sensor-001'
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
    return res.status(500).json({ 
      error: 'Sensor data retrieval failed',
      code: 'SENSOR_ERROR'
    });
  }
});

router.post('/', sanitizeInput, async (req, res) => {
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
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      return res.status(500).json({ 
        error: 'Database not configured',
        code: 'DB_NOT_CONFIGURED'
      });
    }
    
    await connectToDatabase(uri);
    const payload = req.body || {};
    
    // Validate payload structure
    if (typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid payload format' });
    }
    
    // Validate sensor data ranges
    if (payload.ph !== undefined) {
      const ph = Number(payload.ph);
      if (isNaN(ph) || ph < 0 || ph > 14) {
        return res.status(400).json({ error: 'Invalid pH value (0-14)' });
      }
      payload.ph = ph;
    }
    
    if (payload.soilMoisture !== undefined) {
      const moisture = Number(payload.soilMoisture);
      if (isNaN(moisture) || moisture < 0 || moisture > 100) {
        return res.status(400).json({ error: 'Invalid soil moisture value (0-100)' });
      }
      payload.soilMoisture = moisture;
    }
    
    if (payload.temperature !== undefined) {
      const temp = Number(payload.temperature);
      if (isNaN(temp) || temp < -50 || temp > 100) {
        return res.status(400).json({ error: 'Invalid temperature value (-50 to 100)' });
      }
      payload.temperature = temp;
    }
    
    // Ensure deviceId is present
    if (!payload.deviceId || typeof payload.deviceId !== 'string') {
      payload.deviceId = 'unknown-device';
    }
    
    // Add timestamp if not present
    if (!payload.timestamp) {
      payload.timestamp = new Date();
    }
    
    const doc = new LecturaSensor(payload);
    await doc.save();
    
    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('/api/sensores error:', err);
    return res.status(500).json({ 
      error: 'Sensor data save failed',
      code: 'SENSOR_SAVE_ERROR'
    });
  }
});

export default router;