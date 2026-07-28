/**
 * Tiny LRU cache for string→string (Arabic normalize memoization).
 * Avoid TS parameter properties — Node strip-only mode (SEO generate) rejects them.
 */

export class LruStringCache {
  private map = new Map<string, string>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): string | undefined {
    const v = this.map.get(key);
    if (v === undefined) return undefined;
    // refresh recency
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }

  set(key: string, value: string): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    while (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

/** Generic promise-dedupe pool keyed by string. */
const pools = new Map<string, Map<string, Promise<unknown>>>();

export function dedupePromise<T>(
  poolName: string,
  key: string,
  factory: () => Promise<T>,
): Promise<T> {
  let pool = pools.get(poolName);
  if (!pool) {
    pool = new Map();
    pools.set(poolName, pool);
  }
  const existing = pool.get(key);
  if (existing) return existing as Promise<T>;

  const promise = factory().finally(() => {
    if (pool!.get(key) === promise) pool!.delete(key);
  });
  pool.set(key, promise);
  return promise;
}

/** Clear a named pool (tests). */
export function clearDedupePool(poolName?: string): void {
  if (poolName) pools.delete(poolName);
  else pools.clear();
}
