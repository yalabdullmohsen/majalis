/**
 * Bounded LRU caches for volatile in-memory data.
 * Avoid TS parameter properties — Node strip-only mode (SEO generate) rejects them.
 */

/** Generic Map-backed LRU with strict max size (evicts least-recently-used). */
export class LruCache<K, V> {
  private map = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = Math.max(1, maxSize | 0);
  }

  get(key: K): V | undefined {
    const v = this.map.get(key);
    if (v === undefined) return undefined;
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    while (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value as K | undefined;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

/** Tiny LRU cache for string→string (Arabic normalize memoization). */
export class LruStringCache {
  private inner: LruCache<string, string>;

  constructor(maxSize: number) {
    this.inner = new LruCache(maxSize);
  }

  get(key: string): string | undefined {
    return this.inner.get(key);
  }

  set(key: string, value: string): void {
    this.inner.set(key, value);
  }

  clear(): void {
    this.inner.clear();
  }

  get size(): number {
    return this.inner.size;
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
