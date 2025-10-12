import { getPendingItems, markItemStatus } from './offlineDB';

export async function flushQueue({ maxRetries = 3, retryDelay = 2000 } = {}) {
  const BASE = import.meta.env.VITE_TELEMETRY_URL || '';
  const API_BASE = BASE || '';
  const items = await getPendingItems();
  const results = [];
  for (const it of items) {
    if (it.type !== 'reading') {
      await markItemStatus(it.id, 'error');
      results.push({ id: it.id, ok: false, err: 'unsupported type' });
      continue;
    }

    let attempt = 0;
    let sent = false;
    let lastErr = null;
    while (attempt < maxRetries && !sent) {
      attempt++;
      try {
        const res = await fetch((API_BASE || '') + '/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(it.payload) });
        const j = await res.json();
        if (j && j.ok) {
          await markItemStatus(it.id, 'sent');
          results.push({ id: it.id, ok: true });
          sent = true;
          break;
        } else {
          lastErr = j;
        }
      } catch (e) {
        lastErr = e;
      }

      if (!sent && attempt < maxRetries) {
        // wait before retry
        await new Promise(r => setTimeout(r, retryDelay));
      }
    }

    if (!sent) {
      await markItemStatus(it.id, 'error');
      results.push({ id: it.id, ok: false, err: lastErr });
    }
  }

  return results;
}
