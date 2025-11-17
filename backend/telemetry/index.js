import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

// compute telemetry folder relative path in a cross-platform way
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, 'data.json');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

function ensureDataFile() {
  const resolvedPath = path.resolve(DATA_FILE);
  if (!fs.existsSync(resolvedPath)) {
    fs.writeFileSync(resolvedPath, JSON.stringify([]), 'utf8');
  }
}

function readData() {
  ensureDataFile();
  const resolvedPath = path.resolve(DATA_FILE);
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function writeData(arr) {
  const resolvedPath = path.resolve(DATA_FILE);
  fs.writeFileSync(resolvedPath, JSON.stringify(arr, null, 2), 'utf8');
}

// POST /api/ingest
app.post('/api/ingest', (req, res) => {
  const payload = req.body;
  if (!payload || !payload.deviceId) return res.status(400).json({ error: 'deviceId required' });
  const now = payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString();
  const entry = { ...payload, timestamp: now };
  const arr = readData();
  arr.push(entry);
  writeData(arr);
  return res.json({ ok: true, entry });
});

// GET /api/devices/:id/metrics?limit=20
app.get('/api/devices/:id/metrics', (req, res) => {
  const id = req.params.id;
  const limit = parseInt(req.query.limit || '20', 10);
  const arr = readData().filter(e => e.deviceId === id).slice(-limit);
  return res.json({ deviceId: id, count: arr.length, readings: arr });
});

// Simple list devices
app.get('/api/devices', (req, res) => {
  const arr = readData();
  const byId = {};
  arr.forEach(r => { if (r.deviceId) byId[r.deviceId] = true; });
  return res.json({ devices: Object.keys(byId) });
});

// Health endpoint: basic status and last reading timestamp
app.get('/api/health', (req, res) => {
  const arr = readData();
  const last = arr.length ? arr[arr.length - 1].timestamp : null;
  return res.json({ ok: true, readings: arr.length, lastTimestamp: last, uptime: process.uptime() });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Telemetry POC listening on http://localhost:${PORT}`));
