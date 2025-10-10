import { getPendingItems, markItemStatus } from './offlineDB';

export async function flushQueue() {
  const items = await getPendingItems();
  const results = [];
  for (const it of items) {
    try {
      // For now only support reading type
      if (it.type === 'reading') {
        const res = await fetch('/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(it.payload) });
        const j = await res.json();
        if (j && j.ok) {
          await markItemStatus(it.id, 'sent');
          results.push({ id: it.id, ok: true });
        } else {
          await markItemStatus(it.id, 'error');
          results.push({ id: it.id, ok: false, err: j });
        }
      } else {
        // other types (photos) - not yet implemented
        await markItemStatus(it.id, 'error');
        results.push({ id: it.id, ok: false, err: 'unsupported type' });
      }
    } catch (e) {
      await markItemStatus(it.id, 'error');
      results.push({ id: it.id, ok: false, err: e.message || e });
    }
  }
  return results;
}
