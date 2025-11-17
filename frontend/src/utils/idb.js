// Minimal IndexedDB wrapper for simple get/set/del
export function openDB(name = 'agrosens-db', store = 'kv') {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
    };
    req.onsuccess = () => resolve({ db: req.result, store });
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet(key, name, store) {
  const { db, store: st } = await openDB(name, store);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(st, 'readonly');
    const os = tx.objectStore(st);
    const req = os.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet(key, value, name, store) {
  const { db, store: st } = await openDB(name, store);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(st, 'readwrite');
    const os = tx.objectStore(st);
    const req = os.put(value, key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function idbDel(key, name, store) {
  const { db, store: st } = await openDB(name, store);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(st, 'readwrite');
    const os = tx.objectStore(st);
    const req = os.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
