/**
 * Debounced access touching for LRU/LFU — batches writes on idle so reads
 * stay cheap and never block the reading session.
 */
import { getQuranOfflineDb } from "@/lib/quran-offline/db";

const pendingAssets = new Map<string, { at: number; delta: number }>();
const pendingKnowledge = new Map<string, { at: number; delta: number }>();
let flushScheduled = false;

function scheduleFlush(): void {
  if (flushScheduled) return;
  flushScheduled = true;
  const run = () => {
    flushScheduled = false;
    void flushAccessTouches();
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run, { timeout: 4_000 });
  } else {
    globalThis.setTimeout(run, 250);
  }
}

/** Queue an asset LRU/LFU touch (non-blocking). */
export function touchAssetAccess(assetId: string): void {
  if (!assetId) return;
  const prev = pendingAssets.get(assetId);
  pendingAssets.set(assetId, {
    at: Date.now(),
    delta: (prev?.delta ?? 0) + 1,
  });
  scheduleFlush();
}

/** Queue a knowledge row LRU/LFU touch (non-blocking). */
export function touchKnowledgeAccess(ayahKey: string): void {
  if (!ayahKey) return;
  const prev = pendingKnowledge.get(ayahKey);
  pendingKnowledge.set(ayahKey, {
    at: Date.now(),
    delta: (prev?.delta ?? 0) + 1,
  });
  scheduleFlush();
}

export async function flushAccessTouches(): Promise<{ assets: number; knowledge: number }> {
  const db = getQuranOfflineDb();
  const assets = [...pendingAssets.entries()];
  const knowledge = [...pendingKnowledge.entries()];
  pendingAssets.clear();
  pendingKnowledge.clear();
  if (!db) return { assets: 0, knowledge: 0 };

  let assetN = 0;
  for (const [id, touch] of assets) {
    try {
      const row = await db.offline_assets_store.get(id);
      if (!row) continue;
      await db.offline_assets_store.put({
        ...row,
        last_accessed_at: touch.at,
        access_count: (row.access_count ?? 0) + touch.delta,
      });
      assetN += 1;
    } catch {
      /* ignore single row */
    }
  }

  let knowN = 0;
  for (const [key, touch] of knowledge) {
    try {
      const row = await db.quran_knowledge_store.get(key);
      if (!row) continue;
      await db.quran_knowledge_store.put({
        ...row,
        last_accessed_at: touch.at,
        access_count: (row.access_count ?? 0) + touch.delta,
      });
      knowN += 1;
    } catch {
      /* ignore */
    }
  }
  return { assets: assetN, knowledge: knowN };
}

export function __resetAccessTouchesForTests(): void {
  pendingAssets.clear();
  pendingKnowledge.clear();
  flushScheduled = false;
}
