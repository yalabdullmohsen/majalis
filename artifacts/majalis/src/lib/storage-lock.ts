/**
 * Atomic storage locks for LocalStorage / IndexedDB sync across tabs.
 * Prefers Web Locks API; falls back to localStorage mutex with expiry.
 */

import { canUseWebLocks } from "@/lib/browser-features";

const FALLBACK_PREFIX = "majalis-lock:";
const DEFAULT_TTL_MS = 8_000;

type LockFn<T> = () => Promise<T> | T;

function fallbackAcquire(name: string, ttlMs: number): boolean {
  if (typeof localStorage === "undefined") return true;
  const key = `${FALLBACK_PREFIX}${name}`;
  const now = Date.now();
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as { until: number; owner: string };
      if (parsed.until > now) return false;
    }
    const owner = `tab-${now}-${Math.random().toString(36).slice(2, 7)}`;
    localStorage.setItem(key, JSON.stringify({ until: now + ttlMs, owner }));
    // Re-read to detect race
    const check = JSON.parse(localStorage.getItem(key) || "{}") as { owner?: string };
    return check.owner === owner;
  } catch {
    return true;
  }
}

function fallbackRelease(name: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(`${FALLBACK_PREFIX}${name}`);
  } catch {
    /* ignore */
  }
}

async function withFallbackLock<T>(name: string, ttlMs: number, fn: LockFn<T>): Promise<T> {
  const start = Date.now();
  while (!fallbackAcquire(name, ttlMs)) {
    if (Date.now() - start > ttlMs) break;
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 60));
  }
  try {
    return await fn();
  } finally {
    fallbackRelease(name);
  }
}

/**
 * Run `fn` under an exclusive named lock (cross-tab when Web Locks available).
 */
export async function withStorageLock<T>(
  name: string,
  fn: LockFn<T>,
  opts?: { ttlMs?: number },
): Promise<T> {
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  if (canUseWebLocks()) {
    try {
      return await navigator.locks.request(
        `majalis:${name}`,
        { mode: "exclusive", ifAvailable: false },
        async () => fn(),
      );
    } catch {
      return withFallbackLock(name, ttlMs, fn);
    }
  }
  return withFallbackLock(name, ttlMs, fn);
}

/** Synchronous critical section for tiny LocalStorage writes (best-effort). */
export function withStorageLockSync<T>(name: string, fn: () => T, ttlMs = 2_000): T {
  const acquired = fallbackAcquire(name, ttlMs);
  try {
    return fn();
  } finally {
    if (acquired) fallbackRelease(name);
  }
}
