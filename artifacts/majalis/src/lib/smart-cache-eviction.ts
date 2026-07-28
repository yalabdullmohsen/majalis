/**
 * Smart Cache Eviction & Storage Inspector.
 * Monitors IndexedDB + Service Worker cache usage and applies LRU eviction
 * to ephemeral data while strictly protecting core user data
 * (streaks, khatmah, notes, bookmarks, SM-2 flashcards, vault).
 */

import {
  idbDelete,
  idbGetValue,
  idbPut,
  OFFLINE_STORES,
  type OfflineStoreName,
} from "@/lib/offline-db";
import { utf8ByteLength } from "@/lib/text-codec";

export type StorageLayer = "localStorage" | "indexedDB" | "cacheStorage";

export type StorageEntrySnapshot = {
  layer: StorageLayer;
  key: string;
  /** Approximate byte size */
  bytes: number;
  lastAccessedAt: number;
  protected: boolean;
};

export type StorageInspectorReport = {
  estimatedUsage: number;
  estimatedQuota: number;
  usageRatio: number;
  entries: StorageEntrySnapshot[];
  protectedCount: number;
  evictableCount: number;
  inspectedAt: string;
};

export type EvictionResult = {
  removed: string[];
  freedApproxBytes: number;
  skippedProtected: string[];
};

const LRU_META_KEY = "cache-lru-access-v1";
const LS_LRU_KEY = "majalis-cache-lru-v1";

/** Exact LS keys that must never be evicted. */
export const PROTECTED_LS_KEYS = new Set<string>([
  "majalis-user-streak-v1",
  "majalis-khatmah-tracker-v1",
  "majalis-daily-progress-v1",
  "majalis-flashcard-reviews-v1",
  "majalis-knowledge-vault-index-v1",
  "majalis-knowledge-vault-body-v1",
  "majalis-local-bookmarks-v1",
  "majalis-reading-progress-v1",
  "majalis-chunk-progress-v1",
  "majalis-devotional-balance-v1",
  "majalis-user-settings-v1",
  "majalis-theme",
  "majalis-lang",
  "mj-quran-bookmarks-v1",
  "mj-quran-notes-v1",
  "userNotes",
  "mj-quran-hifz-v1",
  "mj-quran-khatmah-v1",
  "mj-quran-reading-v1",
  "mj-quran-wird-v3",
  "mj-quran-pos-v3",
  "mj-quran-page-pos-v1",
]);

/** Prefixes for protected LS keys (notes/bookmarks/streaks families). */
export const PROTECTED_LS_PREFIXES = [
  "majalis-user-streak",
  "majalis-khatmah",
  "majalis-knowledge-vault",
  "majalis-flashcard",
  "majalis-local-bookmarks",
  "mj-quran-bookmarks",
  "mj-quran-notes",
  "userNotes",
  "mj-quran-hifz",
  "mj-quran-khatmah",
  "mj-quran-reading",
  "mj-quran-wird",
  "mj-quran-pos",
  "mj-quran-page-pos",
] as const;

/** IndexedDB meta keys that are core / must not be deleted. */
export const PROTECTED_IDB_META_KEYS = new Set<string>([
  "chunk-progress-v1",
  "devotional-balance-v1",
  "cache-lru-access-v1",
]);

/** Ephemeral LS key prefixes eligible for LRU eviction. */
export const EVICTABLE_LS_PREFIXES = [
  "mj-quran-v3-",
  "majalis-error-reports",
  "majalis-search-analytics",
  "majalis-chunk-reload",
  "majalis-safe-reload",
  "majalis-unseen-discovery",
  "majlis:ticker:recent",
] as const;

type LruMap = Record<string, number>;

function utf8Bytes(s: string): number {
  try {
    // Part 22: reuse global TextEncoder scratch — no per-call allocation
    return utf8ByteLength(s);
  } catch {
    return s.length * 2;
  }
}

function readLru(): LruMap {
  try {
    const raw = localStorage.getItem(LS_LRU_KEY);
    return raw ? (JSON.parse(raw) as LruMap) : {};
  } catch {
    return {};
  }
}

function writeLru(map: LruMap): void {
  try {
    localStorage.setItem(LS_LRU_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.meta, LRU_META_KEY, map).catch(() => undefined);
}

/** Touch an access timestamp for LRU tracking. */
export function touchCacheAccess(key: string): void {
  const map = readLru();
  map[key] = Date.now();
  // Cap map size
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const trimmed = Object.fromEntries(entries.slice(0, 500));
  writeLru(trimmed);
}

export function isProtectedLocalStorageKey(key: string): boolean {
  if (PROTECTED_LS_KEYS.has(key)) return true;
  if (key === LS_LRU_KEY) return true;
  return PROTECTED_LS_PREFIXES.some((p) => key === p || key.startsWith(`${p}-`) || key.startsWith(p));
}

export function isEvictableLocalStorageKey(key: string): boolean {
  if (isProtectedLocalStorageKey(key)) return false;
  return EVICTABLE_LS_PREFIXES.some((p) => key.startsWith(p));
}

export function isProtectedIdbKey(store: OfflineStoreName, key: string): boolean {
  if (store === OFFLINE_STORES.flashcards) return true;
  if (store === OFFLINE_STORES.articles && key.startsWith("annotation:")) return true;
  if (store === OFFLINE_STORES.meta && PROTECTED_IDB_META_KEYS.has(key)) return true;
  if (store === OFFLINE_STORES.quran && (key === "surah-list" || key.startsWith("surah-"))) return true;
  if (store === OFFLINE_STORES.adhkar && key === "adhkar-pack") return true;
  return false;
}

/** Ephemeral IDB meta keys (temp packs, TTL caches). */
export function isEvictableIdbKey(store: OfflineStoreName, key: string): boolean {
  if (isProtectedIdbKey(store, key)) return false;
  if (store === OFFLINE_STORES.meta) {
    return (
      key.startsWith("tmp:") ||
      key.startsWith("prefetch:") ||
      key.startsWith("ttl:") ||
      key.startsWith("cache:") ||
      key === "delta-sync-state-v1"
    );
  }
  return false;
}

function approxJsonBytes(value: unknown): number {
  try {
    return utf8Bytes(JSON.stringify(value));
  } catch {
    return 0;
  }
}

export async function inspectStorage(): Promise<StorageInspectorReport> {
  const entries: StorageEntrySnapshot[] = [];
  const lru = readLru();
  const now = Date.now();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key) || "";
      entries.push({
        layer: "localStorage",
        key,
        bytes: utf8Bytes(key) + utf8Bytes(val),
        lastAccessedAt: lru[`ls:${key}`] ?? now,
        protected: isProtectedLocalStorageKey(key),
      });
    }
  } catch {
    /* ignore */
  }

  try {
    const { idbStreamAll } = await import("@/lib/offline-db");
    for (const store of Object.values(OFFLINE_STORES)) {
      // Part 21: stream IDB inventory in batches instead of one giant toArray
      await idbStreamAll(store, (batch) => {
        for (const row of batch) {
          entries.push({
            layer: "indexedDB",
            key: `${store}/${row.key}`,
            bytes: approxJsonBytes(row.value) + utf8Bytes(row.key),
            lastAccessedAt: lru[`idb:${store}/${row.key}`] ?? (Date.parse(row.updatedAt) || now),
            protected: isProtectedIdbKey(store, row.key),
          });
        }
      });
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof caches !== "undefined") {
      const names = await caches.keys();
      for (const name of names) {
        const cache = await caches.open(name);
        const reqs = await cache.keys();
        let bytes = 0;
        for (const req of reqs.slice(0, 40)) {
          bytes += utf8Bytes(req.url);
        }
        entries.push({
          layer: "cacheStorage",
          key: name,
          bytes: bytes + reqs.length * 256,
          lastAccessedAt: lru[`sw:${name}`] ?? now,
          protected: name === "majalis-version",
        });
      }
    }
  } catch {
    /* ignore */
  }

  let estimatedUsage = 0;
  let estimatedQuota = 0;
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      estimatedUsage = est.usage ?? 0;
      estimatedQuota = est.quota ?? 0;
    }
  } catch {
    /* ignore */
  }

  if (!estimatedUsage) {
    estimatedUsage = entries.reduce((s, e) => s + e.bytes, 0);
  }

  const protectedCount = entries.filter((e) => e.protected).length;
  const evictableCount = entries.length - protectedCount;

  return {
    estimatedUsage,
    estimatedQuota,
    usageRatio: estimatedQuota > 0 ? estimatedUsage / estimatedQuota : 0,
    entries,
    protectedCount,
    evictableCount,
    inspectedAt: new Date().toISOString(),
  };
}

/**
 * Evict least-recently-used ephemeral entries until under target ratio
 * or maxRemovals is hit. Never touches protected core user data.
 */
export async function evictLruCache(opts?: {
  targetUsageRatio?: number;
  maxRemovals?: number;
  /** Force eviction even when under quota (tests / manual cleanup) */
  force?: boolean;
}): Promise<EvictionResult> {
  const target = opts?.targetUsageRatio ?? 0.75;
  const maxRemovals = opts?.maxRemovals ?? 40;
  const report = await inspectStorage();
  const removed: string[] = [];
  const skippedProtected: string[] = [];
  let freedApproxBytes = 0;

  if (!opts?.force && report.estimatedQuota > 0 && report.usageRatio < target) {
    return { removed, freedApproxBytes, skippedProtected };
  }

  const candidates = report.entries
    .filter((e) => !e.protected)
    .filter((e) => {
      if (e.layer === "localStorage") return isEvictableLocalStorageKey(e.key);
      if (e.layer === "indexedDB") {
        const [store, ...rest] = e.key.split("/");
        const key = rest.join("/");
        return isEvictableIdbKey(store as OfflineStoreName, key);
      }
      if (e.layer === "cacheStorage") {
        // Only drop stale offline/data caches (not current version marker)
        return /majalis-(offline|data)-/.test(e.key) && e.key !== "majalis-version";
      }
      return false;
    })
    .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

  for (const entry of candidates) {
    if (removed.length >= maxRemovals) break;

    if (entry.protected) {
      skippedProtected.push(entry.key);
      continue;
    }

    try {
      if (entry.layer === "localStorage") {
        if (isProtectedLocalStorageKey(entry.key)) {
          skippedProtected.push(entry.key);
          continue;
        }
        localStorage.removeItem(entry.key);
        removed.push(`ls:${entry.key}`);
        freedApproxBytes += entry.bytes;
      } else if (entry.layer === "indexedDB") {
        const [store, ...rest] = entry.key.split("/");
        const key = rest.join("/");
        if (isProtectedIdbKey(store as OfflineStoreName, key)) {
          skippedProtected.push(entry.key);
          continue;
        }
        await idbDelete(store as OfflineStoreName, key);
        removed.push(`idb:${entry.key}`);
        freedApproxBytes += entry.bytes;
      } else if (entry.layer === "cacheStorage" && typeof caches !== "undefined") {
        // Prefer deleting individual stale caches that don't match newest build
        const names = await caches.keys();
        const currentish = names
          .filter((n) => n.startsWith("majalis-offline-") || n.startsWith("majalis-data-"))
          .sort();
        const newest = currentish[currentish.length - 1];
        if (entry.key !== newest && entry.key !== "majalis-version") {
          await caches.delete(entry.key);
          removed.push(`sw:${entry.key}`);
          freedApproxBytes += entry.bytes;
        }
      }
    } catch {
      /* continue */
    }
  }

  return { removed, freedApproxBytes, skippedProtected };
}

/** Soft auto-evict when usage exceeds 85%. Safe to call from bootstrap. */
export async function maybeAutoEvictStorage(): Promise<EvictionResult | null> {
  try {
    const report = await inspectStorage();
    if (report.estimatedQuota > 0 && report.usageRatio >= 0.85) {
      return evictLruCache({ targetUsageRatio: 0.7, maxRemovals: 25 });
    }
    // Warm LRU meta from IDB if present
    const fromIdb = await idbGetValue<LruMap>(OFFLINE_STORES.meta, LRU_META_KEY);
    if (fromIdb && typeof fromIdb === "object") {
      writeLru({ ...readLru(), ...fromIdb });
    }
    return null;
  } catch {
    return null;
  }
}
