import Dexie from 'dexie';

const db = new Dexie('AgroSensDB');

// outbox: pending items to send { id, type: 'reading'|'photo', payload, timestamp, status }
// readings: local cache of readings
db.version(1).stores({
  outbox: '++id, type, timestamp, status',
  readings: '++id, deviceId, timestamp'
});

export async function enqueueItem(item) {
  // item: { type, payload }
  const entry = { ...item, timestamp: new Date().toISOString(), status: 'pending' };
  const id = await db.outbox.add(entry);
  return { id, ...entry };
}

export async function getPendingItems() {
  return db.outbox.where('status').equals('pending').toArray();
}

export async function markItemStatus(id, status) {
  return db.outbox.update(id, { status });
}

export async function clearOutbox() {
  return db.outbox.clear();
}

export async function addReadingLocally(reading) {
  const entry = { ...reading, timestamp: reading.timestamp || new Date().toISOString() };
  const id = await db.readings.add(entry);
  return { id, ...entry };
}

export default db;
