/**
 * Static JSON / data fetch pooling — merges duplicate in-flight GETs.
 */
import { dedupePromise } from "@/lib/lru-cache";

const POOL = "static-json";

export type PooledFetchInit = RequestInit & {
  /** Override dedupe key (default: method+url) */
  dedupeKey?: string;
  timeoutMs?: number;
};

/**
 * Deduplicated GET (or other) fetch for static assets (/data/*, Quran JSON, Hadith packs).
 * Concurrent identical URLs share one Promise until settled.
 */
export function pooledFetch(input: RequestInfo | URL, init: PooledFetchInit = {}): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const url = typeof input === "string" ? input : input.toString();
  const key = init.dedupeKey || `${method}:${url}`;

  // Only dedupe safe/idempotent GETs by default
  if (method !== "GET" && method !== "HEAD") {
    return fetch(input, init);
  }

  return dedupePromise(POOL, key, async () => {
    const timeoutMs = init.timeoutMs;
    if (timeoutMs != null && timeoutMs > 0 && !init.signal) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(input, { ...init, signal: controller.signal });
      } finally {
        window.clearTimeout(timer);
      }
    }
    return fetch(input, init);
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

/**
 * Part 22: POST JSON via adaptive transport fallback
 * (WebTransport → WebSocket → HTTP Fetch) for live reading/sync payloads.
 */
export async function resilientSyncPost(
  httpUrl: string,
  payload: unknown,
  opts?: { wsUrl?: string; webTransportUrl?: string },
): Promise<boolean> {
  try {
    const { syncWithTransportFallback } = await import("@/lib/adaptive-transport");
    const result = await syncWithTransportFallback(payload, {
      httpUrl,
      wsUrl: opts?.wsUrl,
      webTransportUrl: opts?.webTransportUrl,
      prefer: ["webtransport", "websocket", "fetch"],
    });
    return result.ok;
  } catch {
    return false;
  }
}
