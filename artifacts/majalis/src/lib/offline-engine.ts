/**
 * Enterprise Offline-First Engine — Dexie.js IndexedDB layer.
 *
 * Stores core static packs (Quran, Azkar, articles/metadata, flashcard reviews)
 * and exposes a typed async API with atomic transactions + schema upgrades.
 * Falls back silently when IndexedDB is unavailable.
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
    // v1 — initial records table
    this.version(1).stores({
      records: "id, store, key, updatedAt",
    });
    // v2 — compound indexes for store-scoped scans + revision lookups (additive, no data loss)
    this.version(2).stores({
      records: "id, store, key, updatedAt, revision, [store+key], [store+updatedAt]",
    });
  }
}

let engine: MajalisOfflineEngine | null = null;
let openPromise: Promise<MajalisOfflineEngine | null> | null = null;

function getEngine(): MajalisOfflineEngine | null {
  if (typeof indexedDB === "undefined") return null;
  if (!engine) engine = new MajalisOfflineEngine();
  return engine;
}

/** Open DB and apply Dexie schema upgrades; coalesced. */
export async function ensureOfflineSchema(): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  if (!openPromise) {
    openPromise = (async () => {
      const db = getEngine();
      if (!db) return null;
      try {
        // Touch open — Dexie upgrades run on first open
        await db.open();
        return db;
      } catch {
        engine = null;
        return null;
      }
    })().finally(() => {
      /* keep openPromise resolved for reuse */
    });
  }
  const db = await openPromise;
  return Boolean(db);
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

export type EngineTxApi = {
  records: Table<OfflineRecord, string>;
  put: <T>(store: OfflineStoreName, key: string, value: T, revision?: string) => Promise<void>;
  delete: (store: OfflineStoreName, key: string) => Promise<void>;
  get: <T>(store: OfflineStoreName, key: string) => Promise<OfflineRecord<T> | undefined>;
};

/**
 * Atomic Dexie transaction — all ops succeed or none are committed.
 * Use for multi-key writes (queue flush, pack caches, migrations).
 */
export async function engineTransact<T>(
  mode: "r" | "rw",
  fn: (api: EngineTxApi) => Promise<T>,
): Promise<T | undefined> {
  const db = getEngine();
  if (!db) return undefined;
  try {
    await ensureOfflineSchema();
    return await db.transaction(mode, db.records, async () => {
      const api: EngineTxApi = {
        records: db.records,
        put: async (store, key, value, revision) => {
          const row: OfflineRecord = {
            id: rowId(store, key),
            store,
            key,
            value,
            updatedAt: new Date().toISOString(),
            revision,
          };
          await db.records.put(row);
        },
        delete: async (store, key) => {
          await db.records.delete(rowId(store, key));
        },
        get: async (store, key) => {
          return (await db.records.get(rowId(store, key))) as OfflineRecord | undefined;
        },
      };
      return fn(api);
    });
  } catch {
    return undefined;
  }
}

/** Bulk put inside a single atomic transaction. */
export async function enginePutMany(
  entries: Array<{ store: OfflineStoreName; key: string; value: unknown; revision?: string }>,
): Promise<number> {
  if (!entries.length) return 0;
  const result = await engineTransact("rw", async ({ records }) => {
    const now = new Date().toISOString();
    const rows: OfflineRecord[] = entries.map((e) => ({
      id: rowId(e.store, e.key),
      store: e.store,
      key: e.key,
      value: e.value,
      updatedAt: now,
      revision: e.revision,
    }));
    await records.bulkPut(rows);
    return rows.length;
  });
  return result ?? 0;
}

export async function enginePut<T>(
  store: OfflineStoreName,
  key: string,
  value: T,
  revision?: string,
): Promise<void> {
  const db = getEngine();
  if (!db) return;
  try {
    await ensureOfflineSchema();
    const row: OfflineRecord<T> = {
      id: rowId(store, key),
      store,
      key,
      value,
      updatedAt: new Date().toISOString(),
      revision,
    };
    await db.records.put(row as OfflineRecord);
  } catch {
    /* quota / lock — silent */
  }
}

export async function engineGet<T>(
  store: OfflineStoreName,
  key: string,
): Promise<OfflineRecord<T> | null> {
  const db = getEngine();
  if (!db) return null;
  try {
    await ensureOfflineSchema();
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
    await ensureOfflineSchema();
    await db.records.delete(rowId(store, key));
  } catch {
    /* ignore */
  }
}

export async function engineKeys(store: OfflineStoreName): Promise<string[]> {
  const db = getEngine();
  if (!db) return [];
  try {
    await ensureOfflineSchema();
    const rows = await db.records.where("store").equals(store).primaryKeys();
    return rows.map((id) => String(id).replace(new RegExp(`^${store}::`), ""));
  } catch {
    return [];
  }
}

export async function engineGetAll<T>(store: OfflineStoreName): Promise<OfflineRecord<T>[]> {
  const db = getEngine();
  if (!db) return [];
  try {
    await ensureOfflineSchema();
    return (await db.records.where("store").equals(store).toArray()) as OfflineRecord<T>[];
  } catch {
    return [];
  }
}

/** One-shot migration from legacy raw-IDB DB (v1) into Dexie engine. */
export async function migrateLegacyOfflineDb(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  const LEGACY = "majalis-offline-content-v1";
  let moved = 0;

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
      if (ev.oldVersion === 0) {
        req.transaction?.abort();
        resolve(null);
      }
    };
  });
  if (!legacy) return 0;

  try {
    const batch: Array<{ store: OfflineStoreName; key: string; value: unknown; revision?: string }> = [];
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
        batch.push({ store: storeName, key: row.key, value: row.value, revision: row.revision });
        moved += 1;
      }
    }
    // Atomic bulk import — avoids lock storms from N sequential puts
    const CHUNK = 50;
    for (let i = 0; i < batch.length; i += CHUNK) {
      await enginePutMany(batch.slice(i, i + CHUNK));
    }
  } catch {
    /* best-effort */
  } finally {
    legacy.close();
  }
  return moved;
}
