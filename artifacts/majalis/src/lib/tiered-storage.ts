/**
 * Tiered storage: IndexedDB → LocalStorage → in-memory (Private Browsing / WebView).
 * Never throws into React lifecycle.
 */

import { readLocalJson, writeLocalJson, safeJsonParse } from "@/lib/safe-json";
import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type StorageTier = "indexedDB" | "localStorage" | "memory";

const memoryStore = new Map<string, string>();
let idbAvailable: boolean | null = null;
let lsAvailable: boolean | null = null;

export function probeLocalStorage(): boolean {
  if (lsAvailable != null) return lsAvailable;
  try {
    if (typeof localStorage === "undefined") {
      lsAvailable = false;
      return false;
    }
    const k = "__majalis_ls_probe__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    lsAvailable = true;
    return true;
  } catch {
    lsAvailable = false;
    return false;
  }
}

export async function probeIndexedDB(): Promise<boolean> {
  if (idbAvailable != null) return idbAvailable;
  try {
    if (typeof indexedDB === "undefined") {
      idbAvailable = false;
      return false;
    }
    await idbPut(OFFLINE_STORES.meta, "storage-probe-v1", { t: Date.now() });
    const v = await idbGetValue<{ t: number }>(OFFLINE_STORES.meta, "storage-probe-v1");
    idbAvailable = v != null;
    return idbAvailable;
  } catch {
    idbAvailable = false;
    return false;
  }
}

export function getActiveStorageTier(): { idb: boolean | null; ls: boolean; memory: true } {
  return { idb: idbAvailable, ls: probeLocalStorage(), memory: true };
}

/** Sync read: LS → memory (IDB is async — use readTieredAsync). */
export function readTieredSync<T>(key: string, fallback: T): { value: T; tier: StorageTier } {
  if (probeLocalStorage()) {
    const v = readLocalJson<T>(key, fallback);
    // Distinguishing empty vs missing is soft — return LS value
    if (localStorage.getItem(key) != null) {
      return { value: v, tier: "localStorage" };
    }
  }
  const raw = memoryStore.get(key);
  if (raw != null) {
    const parsed = safeJsonParse(raw, fallback);
    return { value: parsed.value, tier: "memory" };
  }
  return { value: fallback, tier: "memory" };
}

/** Sync write: prefer LS, else memory. Never throws. */
export function writeTieredSync(key: string, value: unknown): StorageTier {
  const json = typeof value === "string" ? value : JSON.stringify(value);
  memoryStore.set(key, json);
  if (probeLocalStorage() && writeLocalJson(key, value)) {
    return "localStorage";
  }
  return "memory";
}

/** Async read: IDB → LS → memory. */
export async function readTieredAsync<T>(
  key: string,
  fallback: T,
  opts?: { idbStore?: typeof OFFLINE_STORES.meta },
): Promise<{ value: T; tier: StorageTier }> {
  const store = opts?.idbStore ?? OFFLINE_STORES.meta;
  if (await probeIndexedDB()) {
    try {
      const fromIdb = await idbGetValue<T>(store, key);
      if (fromIdb != null) return { value: fromIdb, tier: "indexedDB" };
    } catch {
      idbAvailable = false;
    }
  }
  return readTieredSync(key, fallback);
}

/** Async write: memory always; LS if available; IDB best-effort mirror. */
export async function writeTieredAsync(
  key: string,
  value: unknown,
  opts?: { idbStore?: typeof OFFLINE_STORES.meta },
): Promise<StorageTier> {
  const tier = writeTieredSync(key, value);
  const store = opts?.idbStore ?? OFFLINE_STORES.meta;
  if (await probeIndexedDB()) {
    try {
      await idbPut(store, key, value);
      return "indexedDB";
    } catch {
      idbAvailable = false;
    }
  }
  return tier;
}

/** Clear memory tier entry (and LS if present). */
export function clearTieredKey(key: string): void {
  memoryStore.delete(key);
  try {
    if (probeLocalStorage()) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Test helper */
export function _resetStorageProbes(): void {
  idbAvailable = null;
  lsAvailable = null;
  memoryStore.clear();
}

export function _memoryStoreSize(): number {
  return memoryStore.size;
}
