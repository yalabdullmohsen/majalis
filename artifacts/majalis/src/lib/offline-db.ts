/**
 * Lightweight IndexedDB helper (no Dexie/LocalForage dependency).
 * Mirrors the pattern in quran-audio-downloads.ts for core offline packs.
 */

const DB_NAME = "majalis-offline-content-v1";
const DB_VERSION = 1;

/** Object stores for static/core content packs. */
export const OFFLINE_STORES = {
  meta: "meta",
  quran: "quran",
  adhkar: "adhkar",
  articles: "articles",
  flashcards: "flashcards",
} as const;

export type OfflineStoreName = (typeof OFFLINE_STORES)[keyof typeof OFFLINE_STORES];

export type OfflineRecord<T = unknown> = {
  key: string;
  value: T;
  updatedAt: string;
  /** Content revision / etag-style marker for background sync. */
  revision?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB_unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of Object.values(OFFLINE_STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "key" });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB_open_failed"));
  });
}

async function withStore<T>(
  storeName: OfflineStoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const req = fn(store);
      if (!req) {
        tx.oncomplete = () => resolve(undefined);
        tx.onerror = () => reject(tx.error);
        return;
      }
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function idbPut<T>(
  storeName: OfflineStoreName,
  key: string,
  value: T,
  revision?: string,
): Promise<void> {
  const record: OfflineRecord<T> = {
    key,
    value,
    updatedAt: new Date().toISOString(),
    revision,
  };
  await withStore(storeName, "readwrite", (store) => store.put(record));
}

export async function idbGet<T>(
  storeName: OfflineStoreName,
  key: string,
): Promise<OfflineRecord<T> | null> {
  try {
    const row = await withStore<OfflineRecord<T>>(storeName, "readonly", (store) =>
      store.get(key),
    );
    return row ?? null;
  } catch {
    return null;
  }
}

export async function idbGetValue<T>(
  storeName: OfflineStoreName,
  key: string,
): Promise<T | null> {
  const row = await idbGet<T>(storeName, key);
  return row ? row.value : null;
}

export async function idbDelete(storeName: OfflineStoreName, key: string): Promise<void> {
  await withStore(storeName, "readwrite", (store) => store.delete(key));
}

export async function idbKeys(storeName: OfflineStoreName): Promise<string[]> {
  try {
    const keys = await withStore<IDBValidKey[]>(storeName, "readonly", (store) => store.getAllKeys());
    return (keys ?? []).map(String);
  } catch {
    return [];
  }
}

export async function idbGetAll<T>(storeName: OfflineStoreName): Promise<OfflineRecord<T>[]> {
  try {
    const rows = await withStore<OfflineRecord<T>[]>(storeName, "readonly", (store) =>
      store.getAll(),
    );
    return rows ?? [];
  } catch {
    return [];
  }
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}
