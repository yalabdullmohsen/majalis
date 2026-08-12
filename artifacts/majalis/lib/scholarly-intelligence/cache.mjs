/**
 * In-memory TTL cache for search results (sub-second repeat queries).
 */

const store = new Map();
const DEFAULT_TTL_MS = 60_000;
const MAX_ENTRIES = 500;

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheKey(prefix, parts) {
  return `${prefix}:${JSON.stringify(parts)}`;
}

export function cacheStats() {
  return { entries: store.size, maxEntries: MAX_ENTRIES };
}
