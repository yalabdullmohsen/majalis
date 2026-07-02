/**
 * LRU Cache للاستعلامات المتكررة
 */
import { CACHE_MAX_SIZE, CACHE_TTL_MS } from "./constants.mjs";
import { createHash } from "node:crypto";

/** @type {Map<string, {value: any, expires: number}>} */
const store = new Map();

export function cacheKey(query, types) {
  const raw = `${query}|${(types || []).sort().join(",")}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  // LRU: move to end
  store.delete(key);
  store.set(key, entry);
  return entry.value;
}

export function cacheSet(key, value) {
  if (store.size >= CACHE_MAX_SIZE) {
    const firstKey = store.keys().next().value;
    store.delete(firstKey);
  }
  store.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

export function cacheInvalidate(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
