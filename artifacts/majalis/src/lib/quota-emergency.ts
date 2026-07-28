/**
 * Storage quota emergency protocol.
 * On QuotaExceededError / critical usage ratio: purge ephemeral caches,
 * switch non-essential assets to in-memory Map, protect notes/bookmarks/streaks.
 * Coordinates with Service Worker via postMessage.
 * Logic-only — no UI.
 */

import { withMutex } from "@/lib/async-mutex";
import {
  evictLruCache,
  isProtectedLocalStorageKey,
  maybeAutoEvictStorage,
  PROTECTED_LS_KEYS,
} from "@/lib/smart-cache-eviction";
import { LruCache } from "@/lib/lru-cache";

const EPHEMERAL_MAX = 64;
const ephemeralStore = new LruCache<string, unknown>(EPHEMERAL_MAX);

let ephemeralMode = false;
let listenersBound = false;
let lastEmergencyAt = 0;

export type QuotaEmergencyState = {
  ephemeralMode: boolean;
  lastEmergencyAt: number;
};

export function getQuotaEmergencyState(): QuotaEmergencyState {
  return { ephemeralMode, lastEmergencyAt };
}

export function isEphemeralCacheMode(): boolean {
  return ephemeralMode;
}

export function isQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== "object") {
    return typeof err === "string" && /quota/i.test(err);
  }
  const e = err as { name?: string; message?: string; code?: number };
  if (e.name === "QuotaExceededError") return true;
  if (e.code === 22) return true; // legacy DOMException
  if (typeof e.message === "string" && /quota/i.test(e.message)) return true;
  return false;
}

/** In-memory fallback for non-essential payloads while ephemeral mode is on. */
export function setEphemeralCache(key: string, value: unknown): void {
  if (isProtectedLocalStorageKey(key) || PROTECTED_LS_KEYS.has(key)) return;
  ephemeralStore.set(key, value);
}

export function getEphemeralCache<T>(key: string): T | undefined {
  return ephemeralStore.get(key) as T | undefined;
}

export function clearEphemeralCache(): void {
  ephemeralStore.clear();
}

function notifyServiceWorker(enabled: boolean): void {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) return;
  try {
    navigator.serviceWorker.controller.postMessage({
      type: "MAJALIS_SET_EPHEMERAL_CACHE",
      enabled,
    });
    if (enabled) {
      navigator.serviceWorker.controller.postMessage({ type: "MAJALIS_QUOTA_EVICT" });
    }
  } catch {
    /* ignore */
  }
}

/**
 * Enter emergency mode: evict ephemeral layers, flip SW to skip cache writes,
 * keep protected user data untouched.
 */
export async function enterQuotaEmergencyMode(reason = "quota"): Promise<void> {
  return withMutex("quota-evict", async () => {
    ephemeralMode = true;
    lastEmergencyAt = Date.now();
    notifyServiceWorker(true);
    try {
      await evictLruCache({ targetUsageRatio: 0.55, maxRemovals: 60, force: true });
    } catch {
      /* best-effort */
    }
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(`[quota-emergency] entered ephemeral mode (${reason})`);
    }
  });
}

/** Exit ephemeral mode after successful eviction / charging restore. */
export function exitQuotaEmergencyMode(): void {
  ephemeralMode = false;
  notifyServiceWorker(false);
}

/**
 * Wrap a storage write: on QuotaExceeded, enter emergency and retry once
 * (after eviction). Protected keys still attempt LS write first.
 */
export async function writeWithQuotaGuard(
  write: () => void | boolean | Promise<void | boolean>,
): Promise<boolean> {
  try {
    const r = await write();
    return r !== false;
  } catch (err) {
    if (!isQuotaExceededError(err)) return false;
    await enterQuotaEmergencyMode("write");
    try {
      const r = await write();
      return r !== false;
    } catch {
      return false;
    }
  }
}

/** Soft probe — auto-evict at 85%, enter emergency at 95%. */
export async function probeStoragePressure(): Promise<"ok" | "evicted" | "emergency"> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return "ok";
    const est = await navigator.storage.estimate();
    const usage = est.usage ?? 0;
    const quota = est.quota ?? 0;
    if (quota <= 0) return "ok";
    const ratio = usage / quota;
    if (ratio >= 0.95) {
      await enterQuotaEmergencyMode("estimate-95");
      return "emergency";
    }
    if (ratio >= 0.85) {
      const r = await maybeAutoEvictStorage();
      return r && r.removed.length > 0 ? "evicted" : "ok";
    }
    return "ok";
  } catch (err) {
    if (isQuotaExceededError(err)) {
      await enterQuotaEmergencyMode("probe");
      return "emergency";
    }
    return "ok";
  }
}

/** Boot: listen for SW quota messages + soft probe on idle. */
export function initQuotaEmergencyProtocol(): void {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;

  navigator.serviceWorker?.addEventListener?.("message", (event: MessageEvent) => {
    const msg = event.data;
    if (!msg || typeof msg !== "object") return;
    if ((msg as { type?: string }).type === "MAJALIS_QUOTA_EMERGENCY") {
      void enterQuotaEmergencyMode("sw-message");
    }
  });

  const kick = () => {
    void probeStoragePressure();
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(kick, { timeout: 5_000 });
  } else {
    setTimeout(kick, 3_000);
  }
}

/** Test reset. */
export function resetQuotaEmergencyForTests(): void {
  ephemeralMode = false;
  lastEmergencyAt = 0;
  ephemeralStore.clear();
}
