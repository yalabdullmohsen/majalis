/**
 * Adaptive LRU/LFU eviction for `offline_assets_store` + cold knowledge rows.
 * Never deletes pinned assets or user khatmah/reflections.
 */
import { getQuranOfflineDb } from "@/lib/quran-offline/db";
import type { OfflineAssetRecord, QuranKnowledgeRecord } from "@/lib/quran-offline/types";
import {
  BUDGET_HYSTERESIS,
  KNOWLEDGE_COLD_DAYS,
  KNOWLEDGE_SOFT_CAP,
  evictionScore,
  getLifecycleBudgetConfig,
} from "@/lib/quran-offline/lifecycle-config";

export type AssetEvictionReport = {
  freedBytes: number;
  removedAssetIds: string[];
  skippedPinned: number;
  beforeBytes: number;
  afterBytes: number;
  budgetBytes: number;
  reason: "under-budget" | "inactive" | "over-budget" | "unavailable" | "pressure";
};

export type KnowledgeEvictionReport = {
  removedKeys: string[];
  kept: number;
  reason: string;
};

function assetLastAccess(row: OfflineAssetRecord): number {
  return row.last_accessed_at ?? row.updated_at ?? 0;
}

function knowledgeLastAccess(row: QuranKnowledgeRecord): number {
  return row.last_accessed_at ?? row.updated_at ?? 0;
}

export async function estimateOfflineAssetBytes(): Promise<number> {
  const db = getQuranOfflineDb();
  if (!db) return 0;
  const rows = await db.offline_assets_store.toArray();
  return rows.reduce((sum, r) => {
    if (r.file_reference instanceof Blob) {
      return sum + (r.file_reference.size || r.size_bytes || 0);
    }
    return sum + (r.size_bytes || 0);
  }, 0);
}

function sortByEvictionScore(rows: OfflineAssetRecord[], now: number): OfflineAssetRecord[] {
  return [...rows].sort(
    (a, b) =>
      evictionScore({
        lastAccessedAt: assetLastAccess(a),
        accessCount: a.access_count ?? 0,
        sizeBytes: a.size_bytes || 0,
        now,
      }) -
      evictionScore({
        lastAccessedAt: assetLastAccess(b),
        accessCount: b.access_count ?? 0,
        sizeBytes: b.size_bytes || 0,
        now,
      }),
  );
}

/**
 * Evict unpinned assets:
 * - Under budget → only inactive (not accessed in X days)
 * - Over budget / pressure → LRU+LFU until under hysteresis target
 * Pinned assets are never removed.
 */
export async function evictOfflineAssetsLru(opts?: {
  force?: boolean;
  pressure?: boolean;
}): Promise<AssetEvictionReport> {
  const db = getQuranOfflineDb();
  const { budgetBytes, inactiveDays } = getLifecycleBudgetConfig();
  const empty: AssetEvictionReport = {
    freedBytes: 0,
    removedAssetIds: [],
    skippedPinned: 0,
    beforeBytes: 0,
    afterBytes: 0,
    budgetBytes,
    reason: "unavailable",
  };
  if (!db) return empty;

  const rows = await db.offline_assets_store.toArray();
  const beforeBytes = rows.reduce((s, r) => s + (r.size_bytes || 0), 0);
  const now = Date.now();
  const inactiveCutoff = now - inactiveDays * 24 * 60 * 60 * 1000;
  const target = Math.floor(budgetBytes * BUDGET_HYSTERESIS);
  const overBudget = beforeBytes > budgetBytes;
  const aggressive = Boolean(opts?.force || opts?.pressure || overBudget);

  let skippedPinned = 0;
  const candidates: OfflineAssetRecord[] = [];
  for (const row of rows) {
    if (row.pinned) {
      skippedPinned += 1;
      continue;
    }
    if (row.download_status === "downloading") continue;
    const inactive = assetLastAccess(row) < inactiveCutoff;
    if (aggressive || inactive) candidates.push(row);
  }

  const ordered = sortByEvictionScore(candidates, now);
  const removedAssetIds: string[] = [];
  let freedBytes = 0;
  let remaining = beforeBytes;

  for (const row of ordered) {
    if (!aggressive) {
      // Idle cleanup: inactive only
      if (assetLastAccess(row) >= inactiveCutoff) continue;
    } else if (!opts?.force && remaining <= target) {
      break;
    }

    try {
      await db.offline_assets_store.delete(row.asset_id);
      removedAssetIds.push(row.asset_id);
      const sz = row.size_bytes || 0;
      freedBytes += sz;
      remaining -= sz;
    } catch {
      /* skip */
    }
  }

  let reason: AssetEvictionReport["reason"] = "under-budget";
  if (opts?.pressure) reason = "pressure";
  else if (overBudget) reason = "over-budget";
  else if (removedAssetIds.length) reason = "inactive";

  return {
    freedBytes,
    removedAssetIds,
    skippedPinned,
    beforeBytes,
    afterBytes: Math.max(0, remaining),
    budgetBytes,
    reason,
  };
}

/**
 * Prune cold knowledge rows when over soft cap (keeps hot LRU/LFU).
 */
export async function evictColdKnowledge(opts?: {
  pressure?: boolean;
}): Promise<KnowledgeEvictionReport> {
  const db = getQuranOfflineDb();
  if (!db) return { removedKeys: [], kept: 0, reason: "unavailable" };
  const rows = await db.quran_knowledge_store.toArray();
  const softCap = opts?.pressure ? Math.floor(KNOWLEDGE_SOFT_CAP * 0.6) : KNOWLEDGE_SOFT_CAP;
  if (rows.length <= softCap && !opts?.pressure) {
    return { removedKeys: [], kept: rows.length, reason: "under-cap" };
  }

  const now = Date.now();
  const coldCutoff = now - KNOWLEDGE_COLD_DAYS * 24 * 60 * 60 * 1000;
  const sorted = [...rows].sort(
    (a, b) =>
      evictionScore({
        lastAccessedAt: knowledgeLastAccess(a),
        accessCount: a.access_count ?? 0,
        sizeBytes: 256,
        now,
      }) -
      evictionScore({
        lastAccessedAt: knowledgeLastAccess(b),
        accessCount: b.access_count ?? 0,
        sizeBytes: 256,
        now,
      }),
  );

  const removedKeys: string[] = [];
  for (const row of sorted) {
    if (rows.length - removedKeys.length <= softCap) break;
    const last = knowledgeLastAccess(row);
    if (!opts?.pressure && last >= coldCutoff && (row.access_count ?? 0) > 0) continue;
    try {
      await db.quran_knowledge_store.delete(row.ayah_key);
      removedKeys.push(row.ayah_key);
    } catch {
      /* ignore */
    }
  }

  return {
    removedKeys,
    kept: rows.length - removedKeys.length,
    reason: opts?.pressure ? "pressure" : "over-cap",
  };
}

export async function enforceStorageBudget(opts?: {
  pressure?: boolean;
}): Promise<{ assets: AssetEvictionReport; knowledge: KnowledgeEvictionReport }> {
  const assets = await evictOfflineAssetsLru({ pressure: opts?.pressure });
  const knowledge = await evictColdKnowledge({ pressure: opts?.pressure });
  return { assets, knowledge };
}
