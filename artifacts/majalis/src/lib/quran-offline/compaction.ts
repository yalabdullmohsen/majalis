/**
 * Idle-time IndexedDB compaction, integrity repair, and orphan cleanup.
 * Chunked via requestIdleCallback — never blocks the reading session.
 */
import { getQuranOfflineDb, openQuranOfflineDb } from "@/lib/quran-offline/db";
import { yieldToMain } from "@/lib/yield-to-main";

export type CompactionReport = {
  orphansRemoved: number;
  outboxPruned: number;
  reflectionsRepaired: number;
  assetsRepaired: number;
  knowledgeRepaired: number;
  compactAttempted: boolean;
  compactSupported: boolean;
  actions: string[];
};

async function tryStoragePersistHint(): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
      await navigator.storage.estimate();
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Best-effort "compact": browsers rarely expose IDB compact().
 * We reclaim space by deleting orphans + rewriting thin meta rows
 * (drop detached Blob refs that are empty / failed).
 */
export async function compactQuranOfflineStores(
  signal?: AbortSignal,
): Promise<CompactionReport> {
  const report: CompactionReport = {
    orphansRemoved: 0,
    outboxPruned: 0,
    reflectionsRepaired: 0,
    assetsRepaired: 0,
    knowledgeRepaired: 0,
    compactAttempted: false,
    compactSupported: false,
    actions: [],
  };

  const db = (await openQuranOfflineDb()) ?? getQuranOfflineDb();
  if (!db) {
    report.actions.push("unavailable");
    return report;
  }
  if (signal?.aborted) {
    report.actions.push("aborted");
    return report;
  }

  report.compactAttempted = true;
  if (await tryStoragePersistHint()) {
    report.actions.push("storage-estimate");
  }

  // 1) Prune synced outbox older than 3 days + failed exhausted
  try {
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const synced = await db.outbox_sync_store.where("status").equals("synced").toArray();
    const failed = await db.outbox_sync_store.where("status").equals("failed").toArray();
    const drop = [...synced, ...failed].filter(
      (r) => r.id != null && (r.created_at < cutoff || r.status === "failed"),
    );
    if (drop.length) {
      await db.outbox_sync_store.bulkDelete(drop.map((r) => r.id!));
      report.outboxPruned = drop.length;
      report.actions.push("outbox-prune");
    }
  } catch {
    /* ignore */
  }
  await yieldToMain();
  if (signal?.aborted) return report;

  // 2) Repair orphan / incomplete asset rows
  try {
    const assets = await db.offline_assets_store.toArray();
    for (const row of assets) {
      let dirty = false;
      const next = { ...row };
      if (next.last_accessed_at == null) {
        next.last_accessed_at = next.updated_at || Date.now();
        dirty = true;
      }
      if (next.access_count == null) {
        next.access_count = 0;
        dirty = true;
      }
      if (next.pinned == null) {
        next.pinned = false;
        dirty = true;
      }
      // Failed + zero size + no blob → orphan meta
      if (
        next.download_status === "failed" &&
        !(next.file_reference instanceof Blob) &&
        (next.size_bytes || 0) === 0
      ) {
        await db.offline_assets_store.delete(next.asset_id);
        report.orphansRemoved += 1;
        continue;
      }
      // Stuck "downloading" older than 24h → mark failed
      if (
        next.download_status === "downloading" &&
        (next.updated_at || 0) < Date.now() - 24 * 60 * 60 * 1000
      ) {
        next.download_status = "failed";
        dirty = true;
      }
      if (dirty) {
        await db.offline_assets_store.put(next);
        report.assetsRepaired += 1;
      }
    }
    if (report.assetsRepaired || report.orphansRemoved) {
      report.actions.push("assets-integrity");
    }
  } catch {
    /* ignore */
  }
  await yieldToMain();
  if (signal?.aborted) return report;

  // 3) Knowledge integrity — drop empty keys
  try {
    const rows = await db.quran_knowledge_store.toArray();
    for (const row of rows) {
      if (!row.ayah_key || !/^\d+:\d+$/.test(row.ayah_key)) {
        await db.quran_knowledge_store.delete(row.ayah_key);
        report.orphansRemoved += 1;
        continue;
      }
      let dirty = false;
      const next = { ...row };
      if (next.last_accessed_at == null) {
        next.last_accessed_at = next.updated_at || Date.now();
        dirty = true;
      }
      if (next.access_count == null) {
        next.access_count = 0;
        dirty = true;
      }
      if (!Array.isArray(next.similar_ayah_keys)) {
        next.similar_ayah_keys = [];
        dirty = true;
      }
      if (!Array.isArray(next.theme_ids)) {
        next.theme_ids = [];
        dirty = true;
      }
      if (dirty) {
        await db.quran_knowledge_store.put(next);
        report.knowledgeRepaired += 1;
      }
    }
    if (report.knowledgeRepaired) report.actions.push("knowledge-integrity");
  } catch {
    /* ignore */
  }
  await yieldToMain();
  if (signal?.aborted) return report;

  // 4) Reflections — backfill v2 fields; drop empty note with no bookmark/tags
  try {
    const rows = await db.user_reflections_store.toArray();
    for (const row of rows) {
      if (
        !row.note_text?.trim() &&
        !row.bookmark_color &&
        !row.audio_memo_blob &&
        (!row.tags || row.tags.length === 0)
      ) {
        await db.user_reflections_store.delete(row.id);
        report.orphansRemoved += 1;
        continue;
      }
      let dirty = false;
      const next = { ...row };
      if (next.last_opened_at == null) {
        next.last_opened_at = next.updated_at || next.created_at || Date.now();
        dirty = true;
      }
      if (next.schema_version == null || next.schema_version < 2) {
        next.schema_version = 2;
        dirty = true;
      }
      if (!Array.isArray(next.tags)) {
        next.tags = [];
        dirty = true;
      }
      if (dirty) {
        await db.user_reflections_store.put(next);
        report.reflectionsRepaired += 1;
      }
    }
    if (report.reflectionsRepaired) report.actions.push("reflections-integrity");
  } catch {
    /* ignore */
  }

  // IndexedDB has no portable compact(); document as unsupported
  report.compactSupported = false;
  report.actions.push("logical-compact");
  return report;
}

/** Schedule compaction on idle — returns cancel handle. */
export function scheduleIdleCompaction(opts?: {
  timeoutMs?: number;
  signal?: AbortSignal;
}): { cancel: () => void; done: Promise<CompactionReport | null> } {
  let idleId: number | null = null;
  let cancelled = false;
  const timeoutMs = opts?.timeoutMs ?? 20_000;

  const done = new Promise<CompactionReport | null>((resolve) => {
    const run = () => {
      if (cancelled || opts?.signal?.aborted) {
        resolve(null);
        return;
      }
      void compactQuranOfflineStores(opts?.signal).then(resolve).catch(() => resolve(null));
    };
    if (typeof requestIdleCallback === "function") {
      idleId = requestIdleCallback(run, { timeout: timeoutMs }) as unknown as number;
    } else {
      idleId = globalThis.setTimeout(run, 5_000) as unknown as number;
    }
  });

  return {
    done,
    cancel: () => {
      cancelled = true;
      if (idleId == null) return;
      if (typeof cancelIdleCallback === "function") {
        try {
          cancelIdleCallback(idleId);
          return;
        } catch {
          /* fall through */
        }
      }
      globalThis.clearTimeout(idleId);
    },
  };
}
