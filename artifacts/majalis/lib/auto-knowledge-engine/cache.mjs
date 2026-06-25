/**
 * Cache layer — DB-backed with in-memory L1
 */

const memoryCache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000;

export function cacheGet(key) {
  const mem = memoryCache.get(key);
  if (mem && mem.expires > Date.now()) return mem.value;
  if (mem) memoryCache.delete(key);
  return null;
}

export function cacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  memoryCache.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export async function dbCacheGet(admin, key) {
  const mem = cacheGet(key);
  if (mem) return mem;

  if (!admin) return null;
  try {
    const { data } = await admin
      .from("ake_cache")
      .select("cache_value")
      .eq("cache_key", key)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (data?.cache_value) {
      cacheSet(key, data.cache_value);
      return data.cache_value;
    }
  } catch {
    /* table may not exist yet */
  }
  return null;
}

export async function dbCacheSet(admin, key, value, ttlMs = DEFAULT_TTL_MS) {
  cacheSet(key, value, ttlMs);
  if (!admin) return;
  try {
    await admin.from("ake_cache").upsert({
      cache_key: key,
      cache_value: value,
      expires_at: new Date(Date.now() + ttlMs).toISOString(),
    });
  } catch {
    /* ignore */
  }
}

export function cacheClear(prefix = "") {
  for (const key of memoryCache.keys()) {
    if (!prefix || key.startsWith(prefix)) memoryCache.delete(key);
  }
}
