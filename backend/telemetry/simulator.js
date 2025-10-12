// Ensure fetch is available (Node 18+ has global fetch). Fallback to undici if needed.
let _fetch = global.fetch;
try {
  if (typeof _fetch !== 'function') {
    // try to require undici dynamically
    // eslint-disable-next-line global-require
    const undici = await import('undici');
    _fetch = undici.fetch;
    console.log('Using undici.fetch as fetch polyfill');
  }
} catch (e) {
  console.warn('Fetch not available and undici not installed. Please run `npm install undici` if using Node <18.');
}

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
    const executor = _fetch || fetch;
    const res = await executor(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
