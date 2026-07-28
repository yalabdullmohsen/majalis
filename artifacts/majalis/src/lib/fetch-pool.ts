/**
 * Static JSON / data fetch pooling — merges duplicate in-flight GETs.
 * Part 11: Fetch Priority API (`priority: high|low|auto`) for congested links.
 */
import { dedupePromise } from "@/lib/lru-cache";

const POOL = "static-json";

export type FetchPriority = "high" | "low" | "auto";

export type PooledFetchInit = RequestInit & {
  /** Override dedupe key (default: method+url) */
  dedupeKey?: string;
  timeoutMs?: number;
  /**
   * Hint for the Fetch Priority API (Chromium).
   * high = critical verse/page text; low = audio prefetch / analytics.
   */
  priority?: FetchPriority;
};

type RequestInitWithPriority = RequestInit & { priority?: FetchPriority };

function withPriority(init: PooledFetchInit): RequestInitWithPriority {
  const { dedupeKey: _d, timeoutMs: _t, priority, ...rest } = init;
  const out: RequestInitWithPriority = { ...rest };
  if (priority) out.priority = priority;
  return out;
}

/**
 * Deduplicated GET (or other) fetch for static assets (/data/*, Quran JSON, Hadith packs).
 * Concurrent identical URLs share one Promise until settled.
 */
export function pooledFetch(input: RequestInfo | URL, init: PooledFetchInit = {}): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const url = typeof input === "string" ? input : input.toString();
  const key = init.dedupeKey || `${method}:${url}:${init.priority || "auto"}`;

  // Only dedupe safe/idempotent GETs by default
  if (method !== "GET" && method !== "HEAD") {
    return fetch(input, withPriority(init));
  }

  return dedupePromise(POOL, key, async () => {
    const timeoutMs = init.timeoutMs;
    const base = withPriority(init);
    if (timeoutMs != null && timeoutMs > 0 && !init.signal) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(input, { ...base, signal: controller.signal });
      } finally {
        window.clearTimeout(timer);
      }
    }
    return fetch(input, base);
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
