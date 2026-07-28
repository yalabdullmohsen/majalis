/**
 * Static JSON / data fetch pooling — merges duplicate in-flight GETs
 * and caps concurrency from device capabilities (Part 15).
 */
import { dedupePromise } from "@/lib/lru-cache";
import { getDeviceCapabilities } from "@/lib/device-capabilities";
import { abortTimeout } from "@/lib/feature-detect";

const POOL = "static-json";

export type PooledFetchInit = RequestInit & {
  /** Override dedupe key (default: method+url) */
  dedupeKey?: string;
  timeoutMs?: number;
};

let inFlight = 0;
const waiters: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  const max = getDeviceCapabilities().maxConcurrentFetches;
  if (inFlight < max) {
    inFlight += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waiters.push(() => {
      inFlight += 1;
      resolve();
    });
  });
}

function releaseSlot(): void {
  inFlight = Math.max(0, inFlight - 1);
  const next = waiters.shift();
  if (next) next();
}

/**
 * Deduplicated GET (or other) fetch for static assets (/data/*, Quran JSON, Hadith packs).
 * Concurrent identical URLs share one Promise until settled.
 */
export function pooledFetch(input: RequestInfo | URL, init: PooledFetchInit = {}): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const url = typeof input === "string" ? input : input.toString();
  const key = init.dedupeKey || `${method}:${url}`;

  if (method !== "GET" && method !== "HEAD") {
    return fetch(input, init);
  }

  return dedupePromise(POOL, key, async () => {
    await acquireSlot();
    try {
      const timeoutMs = init.timeoutMs;
      if (timeoutMs != null && timeoutMs > 0 && !init.signal) {
        try {
          return await fetch(input, { ...init, signal: abortTimeout(timeoutMs) });
        } catch (err) {
          throw err;
        }
      }
      return await fetch(input, init);
    } finally {
      releaseSlot();
    }
  });
}

/** Convenience: fetch JSON with pool + safe parse fallback. */
export async function pooledJson<T>(
  url: string,
  fallback: T,
  init?: PooledFetchInit,
): Promise<T> {
  try {
    const res = await pooledFetch(url, init);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
