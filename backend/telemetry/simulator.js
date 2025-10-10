// Use global fetch (Node 18+). If running an older Node without global fetch,
// install `undici` and uncomment the import below: // import { fetch } from 'undici';

const URL = process.env.INGEST_URL || 'http://localhost:4001/api/ingest';
const DEVICE_ID = process.env.DEVICE_ID || 'sensor-001';

function randomBetween(a, b) { return a + Math.random() * (b - a); }

async function sendOne() {
  const payload = {
    deviceId: DEVICE_ID,
    timestamp: new Date().toISOString(),
    ph: Number(randomBetween(5.5, 7.2).toFixed(2)),
    soilMoisture: Number(randomBetween(30, 90).toFixed(1)),
    temperature: Number(randomBetween(10, 30).toFixed(1)),
    lat: -34.6,
    lon: -58.4
  };

  try {
    const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json();
    console.log('Sent', json.entry);
  } catch (e) {
    console.error('Error sending', e.message || e);
  }
}

async function loop() {
  while (true) {
    await sendOne();
    await new Promise(r => setTimeout(r, 5000));
  }
}

loop();
