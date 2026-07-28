/**
 * Offline storage facade — delegates to the Dexie engine (offline-engine.ts).
 * Keeps the stable `idbPut` / `idbGet` API used across the app.
 */
export {
  OFFLINE_STORES,
  isOnline,
  engineTransact,
  enginePutMany,
  ensureOfflineSchema,
  type OfflineStoreName,
  type OfflineRecord,
  type EngineTxApi,
} from "@/lib/offline-engine";

import {
  engineDelete,
  engineGet,
  engineGetAll,
  engineGetValue,
  engineKeys,
  enginePut,
  enginePutMany,
  engineTransact,
  type OfflineRecord,
  type OfflineStoreName,
} from "@/lib/offline-engine";

/** @deprecated shape without `id` — mapped for callers that read `.key/.value`. */
export type LegacyOfflineRecord<T = unknown> = Omit<OfflineRecord<T>, "id" | "store"> & {
  key: string;
  value: T;
  updatedAt: string;
  revision?: string;
};

export async function idbPut<T>(
  storeName: OfflineStoreName,
  key: string,
  value: T,
  revision?: string,
): Promise<void> {
  await enginePut(storeName, key, value, revision);
}

export async function idbPutMany(
  entries: Array<{ store: OfflineStoreName; key: string; value: unknown; revision?: string }>,
): Promise<number> {
  return enginePutMany(entries);
}

/** Run multiple IDB ops in one atomic transaction. */
export async function idbTransact<T>(
  mode: "r" | "rw",
  fn: Parameters<typeof engineTransact<T>>[1],
): Promise<T | undefined> {
  return engineTransact(mode, fn);
}

export async function idbGet<T>(
  storeName: OfflineStoreName,
  key: string,
): Promise<LegacyOfflineRecord<T> | null> {
  const row = await engineGet<T>(storeName, key);
  if (!row) return null;
  return {
    key: row.key,
    value: row.value,
    updatedAt: row.updatedAt,
    revision: row.revision,
  };
}

export async function idbGetValue<T>(
  storeName: OfflineStoreName,
  key: string,
): Promise<T | null> {
  return engineGetValue<T>(storeName, key);
}

export async function idbDelete(storeName: OfflineStoreName, key: string): Promise<void> {
  await engineDelete(storeName, key);
}

export async function idbKeys(storeName: OfflineStoreName): Promise<string[]> {
  return engineKeys(storeName);
}

export async function idbGetAll<T>(storeName: OfflineStoreName): Promise<LegacyOfflineRecord<T>[]> {
  const rows = await engineGetAll<T>(storeName);
  return rows.map((row) => ({
    key: row.key,
    value: row.value,
    updatedAt: row.updatedAt,
    revision: row.revision,
  }));
}
