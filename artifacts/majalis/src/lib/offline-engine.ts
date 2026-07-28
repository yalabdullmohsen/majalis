/**
 * Enterprise Offline-First Engine — Dexie.js IndexedDB layer.
 *
 * Stores core static packs (Quran, Azkar, articles/metadata, flashcard reviews)
 * and exposes a typed async API. Falls back silently when IndexedDB is unavailable.
 */
import Dexie, { type Table } from "dexie";

export const OFFLINE_STORES = {
  meta: "meta",
  quran: "quran",
  adhkar: "adhkar",
  articles: "articles",
  flashcards: "flashcards",
} as const;

export type OfflineStoreName = (typeof OFFLINE_STORES)[keyof typeof OFFLINE_STORES];

export type OfflineRecord<T = unknown> = {
  /** Composite id: `${store}::${key}` */
  id: string;
  store: OfflineStoreName;
  key: string;
  value: T;
  updatedAt: string;
  revision?: string;
};

function rowId(store: OfflineStoreName, key: string): string {
  return `${store}::${key}`;
}

class MajalisOfflineEngine extends Dexie {
  records!: Table<OfflineRecord, string>;

  constructor() {
    super("majalis-offline-engine-v2");
    this.version(1).stores({
      records: "id, store, key, updatedAt",
    });
  }
}

let engine: MajalisOfflineEngine | null = null;

function getEngine(): MajalisOfflineEngine | null {
  if (typeof indexedDB === "undefined") return null;
  if (!engine) engine = new MajalisOfflineEngine();
  return engine;
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

export async function enginePut<T>(
  store: OfflineStoreName,
  key: string,
  value: T,
  revision?: string,
): Promise<void> {
  const { withIdbRecovery } = await import("@/lib/idb-self-heal");
  const { logDiagnostic } = await import("@/lib/diagnostics");
  await withIdbRecovery(async () => {
    const db = getEngine();
    if (!db) return;
    const row: OfflineRecord<T> = {
      id: rowId(store, key),
      store,
      key,
      value,
      updatedAt: new Date().toISOString(),
      revision,
    };
    await db.records.put(row as OfflineRecord);
  }, {
    onHeal: (reason) => logDiagnostic("idb-heal", reason, { store, key }),
  });
}

export async function engineGet<T>(
  store: OfflineStoreName,
  key: string,
): Promise<OfflineRecord<T> | null> {
  const db = getEngine();
  if (!db) return null;
  try {
    const row = await db.records.get(rowId(store, key));
    return (row as OfflineRecord<T> | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function engineGetValue<T>(
  store: OfflineStoreName,
  key: string,
): Promise<T | null> {
  const row = await engineGet<T>(store, key);
  return row ? row.value : null;
}

export async function engineDelete(store: OfflineStoreName, key: string): Promise<void> {
  const db = getEngine();
  if (!db) return;
  try {
    await db.records.delete(rowId(store, key));
  } catch {
    /* ignore */
  }
}

export async function engineKeys(store: OfflineStoreName): Promise<string[]> {
  const db = getEngine();
  if (!db) return [];
  try {
    const rows = await db.records.where("store").equals(store).primaryKeys();
    return rows.map((id) => String(id).replace(new RegExp(`^${store}::`), ""));
  } catch {
    return [];
  }
}

/**
 * Stream all records for a store in batches (default 50), yielding to the
 * main thread between pages — Part 21 zero-block baseline for large scans.
 */
export async function engineStreamStore<T>(
  store: OfflineStoreName,
  onBatch: (batch: OfflineRecord<T>[], offset: number) => void | Promise<void>,
  opts?: { batchSize?: number; signal?: AbortSignal },
): Promise<number> {
  const db = getEngine();
  if (!db) return 0;
  try {
    const { streamPagedQuery, IDB_CURSOR_DEFAULT_BATCH } = await import(
      "@/lib/idb-cursor-stream"
    );
    const batchSize = opts?.batchSize ?? IDB_CURSOR_DEFAULT_BATCH;
    return await streamPagedQuery<OfflineRecord<T>>(
      async (offset, limit) =>
        (await db.records
          .where("store")
          .equals(store)
          .offset(offset)
          .limit(limit)
          .toArray()) as OfflineRecord<T>[],
      onBatch,
      { batchSize, signal: opts?.signal },
    );
  } catch {
    return 0;
  }
}

export async function engineGetAll<T>(store: OfflineStoreName): Promise<OfflineRecord<T>[]> {
  const out: OfflineRecord<T>[] = [];
  await engineStreamStore<T>(store, (batch) => {
    out.push(...batch);
  });
  return out;
}

/** One-shot migration from legacy raw-IDB DB (v1) into Dexie engine. */
export async function migrateLegacyOfflineDb(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  const LEGACY = "majalis-offline-content-v1";
  let moved = 0;

  // Avoid creating an empty legacy DB if it never existed
  try {
    if (typeof indexedDB.databases === "function") {
      const dbs = await indexedDB.databases();
      if (!dbs.some((d) => d.name === LEGACY)) return 0;
    }
  } catch {
    /* databases() unsupported — continue with open */
  }

  const legacy = await new Promise<IDBDatabase | null>((resolve) => {
    const req = indexedDB.open(LEGACY);
    req.onerror = () => resolve(null);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (ev) => {
      // Abort creation of a brand-new empty DB
      if (ev.oldVersion === 0) {
        req.transaction?.abort();
        resolve(null);
      }
    };
  });
  if (!legacy) return 0;

  try {
    for (const storeName of Object.values(OFFLINE_STORES)) {
      if (!legacy.objectStoreNames.contains(storeName)) continue;
      const rows = await new Promise<Array<{ key: string; value: unknown; updatedAt?: string; revision?: string }>>(
        (resolve, reject) => {
          const tx = legacy.transaction(storeName, "readonly");
          const req = tx.objectStore(storeName).getAll();
          req.onsuccess = () => resolve((req.result as typeof rows) || []);
          req.onerror = () => reject(req.error);
        },
      );
      for (const row of rows) {
        if (!row?.key) continue;
        await enginePut(storeName, row.key, row.value, row.revision);
        moved += 1;
      }
    }
  } catch {
    /* best-effort */
  } finally {
    legacy.close();
  }
  return moved;
}
