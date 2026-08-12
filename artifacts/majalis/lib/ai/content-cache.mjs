/**
 * AI request dedupe + approved-result cache by content hash.
 * Never stores raw prompts in logs; cache payload is opaque JSON from caller.
 */
import { allowInMemoryReliabilityStore, logDurableStoreUnavailable } from "../reliability/env.mjs";
import { contentHash } from "./spend-governance.mjs";
import { incCounter, setGauge } from "../observability/metrics.mjs";

/** @type {Map<string, { result: any, expiresAt: number }>} */
const memCache = new Map();
/** @type {Map<string, number>} */
const memDedup = new Map();

let cacheHits = 0;
let cacheMisses = 0;

async function withPg(fn) {
  try {
    const { getPgPool } = await import("../database.mjs");
    const pool = typeof getPgPool === "function" ? await getPgPool() : null;
    if (!pool) return null;
    return await fn(pool);
  } catch (err) {
    logDurableStoreUnavailable("ai_cache.pg", err?.message || err);
    return null;
  }
}

function touchHitRatio() {
  const total = cacheHits + cacheMisses;
  setGauge("ai.cache.hit_ratio", total ? cacheHits / total : 0);
}

/**
 * @param {string|object} contentParts
 * @param {{ provider?: string, model?: string, ttlSec?: number }} [opts]
 */
export async function lookupAiCache(contentParts, opts = {}) {
  const hash = contentHash(contentParts);
  const provider = opts.provider || "*";
  const model = opts.model || "*";

  const fromDb = await withPg(async (pool) => {
    const { rows } = await pool.query(
      `SELECT result_json, expires_at FROM ai_content_cache
       WHERE content_hash = $1 AND provider = $2 AND model = $3
         AND expires_at > now()
       LIMIT 1`,
      [hash, provider, model],
    );
    return rows[0] || null;
  });

  if (fromDb) {
    cacheHits += 1;
    touchHitRatio();
    incCounter("ai.cache.hit", 1);
    return { hit: true, hash, result: fromDb.result_json };
  }

  if (allowInMemoryReliabilityStore()) {
    const key = `${provider}:${model}:${hash}`;
    const row = memCache.get(key);
    if (row && row.expiresAt > Date.now()) {
      cacheHits += 1;
      touchHitRatio();
      incCounter("ai.cache.hit", 1);
      return { hit: true, hash, result: row.result };
    }
  }

  cacheMisses += 1;
  touchHitRatio();
  incCounter("ai.cache.miss", 1);
  return { hit: false, hash, result: null };
}

export async function storeAiCache(contentParts, result, opts = {}) {
  const hash = contentHash(contentParts);
  const provider = opts.provider || "*";
  const model = opts.model || "*";
  const ttlSec = opts.ttlSec ?? 86_400;
  const expiresAt = new Date(Date.now() + ttlSec * 1000);

  const saved = await withPg(async (pool) => {
    await pool.query(
      `INSERT INTO ai_content_cache (content_hash, provider, model, result_json, expires_at)
       VALUES ($1,$2,$3,$4::jsonb,$5)
       ON CONFLICT (content_hash, provider, model) DO UPDATE SET
         result_json = EXCLUDED.result_json,
         expires_at = EXCLUDED.expires_at,
         hit_count = ai_content_cache.hit_count,
         updated_at = now()`,
      [hash, provider, model, JSON.stringify(result ?? null), expiresAt.toISOString()],
    );
    return true;
  });

  if (!saved && allowInMemoryReliabilityStore()) {
    memCache.set(`${provider}:${model}:${hash}`, { result, expiresAt: expiresAt.getTime() });
  }
  return { hash, persisted: !!saved };
}

/**
 * Dedup in-flight / recent identical requests (returns true if duplicate should skip provider).
 */
export async function claimAiDedup(contentParts, opts = {}) {
  const hash = contentHash(contentParts);
  const provider = opts.provider || "*";
  const ttlSec = opts.ttlSec ?? 300;
  const expiresAt = new Date(Date.now() + ttlSec * 1000);

  const fromDb = await withPg(async (pool) => {
    await pool.query(`DELETE FROM ai_request_dedup WHERE expires_at < now()`);
    const { rows } = await pool.query(
      `INSERT INTO ai_request_dedup (content_hash, provider, expires_at)
       VALUES ($1,$2,$3)
       ON CONFLICT (content_hash, provider) DO NOTHING
       RETURNING content_hash`,
      [hash, provider, expiresAt.toISOString()],
    );
    if (rows[0]) return { claimed: true, hash, duplicate: false };
    return { claimed: false, hash, duplicate: true };
  });

  if (fromDb) {
    if (fromDb.duplicate) {
      incCounter("ai.dedup.hit", 1);
      return { duplicate: true, hash };
    }
    return { duplicate: false, hash };
  }

  if (allowInMemoryReliabilityStore()) {
    const key = `${provider}:${hash}`;
    const until = memDedup.get(key) || 0;
    if (until > Date.now()) {
      incCounter("ai.dedup.hit", 1);
      return { duplicate: true, hash };
    }
    memDedup.set(key, expiresAt.getTime());
    return { duplicate: false, hash };
  }

  return { duplicate: false, hash };
}

export function __resetAiCacheMemory() {
  memCache.clear();
  memDedup.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
