/**
 * Distributed AI provider circuit breaker + usage limits.
 * Prefers Postgres (durable across Vercel isolates); memory fallback for tests/local.
 */

import { classifyAiError, isPermanentAiFailure, AI_ERROR_CODES, providerPausedBody } from "./error-classifier.mjs";

const DEFAULTS = Object.freeze({
  failureThreshold: 1, // open immediately on credit_exhausted / auth
  softFailureThreshold: 5,
  resetTimeoutMs: 30 * 60 * 1000,
  dailyRequestLimit: 500,
  maxConcurrency: 4,
  maxRetries: 1,
  baseBackoffMs: 400,
  maxBackoffMs: 4_000,
  requestTimeoutMs: 45_000,
});

/** @type {Map<string, any>} */
const memoryStore = new Map();
/** @type {Map<string, number>} */
const openAlertOnce = new Map();
/** @type {Map<string, number>} */
const inflight = new Map();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function backoffMs(attempt, base, max) {
  const exp = Math.min(max, base * 2 ** Math.max(0, attempt));
  return Math.floor(Math.random() * exp);
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
      return;
    }
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
      },
      { once: true },
    );
  });
}

async function withPg(fn) {
  try {
    const { getPgPool } = await import("../database.mjs");
    const pool = typeof getPgPool === "function" ? await getPgPool() : null;
    if (!pool) return null;
    return await fn(pool);
  } catch {
    return null;
  }
}

function memGet(provider) {
  const day = todayKey();
  let row = memoryStore.get(provider);
  if (!row || row.day !== day) {
    row = {
      provider,
      day,
      state: "closed",
      opened_reason: null,
      opened_at: null,
      retry_after: null,
      failures: 0,
      daily_requests: 0,
      last_alert_at: null,
    };
    memoryStore.set(provider, row);
  }
  return row;
}

export async function getProviderState(provider) {
  const fromDb = await withPg(async (pool) => {
    const { rows } = await pool.query(
      `SELECT provider, circuit_state AS state, opened_reason, opened_at, retry_after,
              daily_request_count AS daily_requests, last_alert_at, day_key AS day
       FROM ai_provider_circuit WHERE provider = $1`,
      [provider],
    );
    return rows[0] || null;
  });
  if (fromDb) {
    if (fromDb.day !== todayKey()) {
      fromDb.daily_requests = 0;
      fromDb.day = todayKey();
    }
    return fromDb;
  }
  const m = memGet(provider);
  return { ...m };
}

async function persistState(provider, patch) {
  const day = todayKey();
  const saved = await withPg(async (pool) => {
    await pool.query(
      `INSERT INTO ai_provider_circuit AS c
        (provider, circuit_state, opened_reason, opened_at, retry_after, daily_request_count, day_key, last_alert_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
       ON CONFLICT (provider) DO UPDATE SET
         circuit_state = EXCLUDED.circuit_state,
         opened_reason = EXCLUDED.opened_reason,
         opened_at = EXCLUDED.opened_at,
         retry_after = EXCLUDED.retry_after,
         daily_request_count = CASE
           WHEN c.day_key IS DISTINCT FROM EXCLUDED.day_key THEN EXCLUDED.daily_request_count
           ELSE EXCLUDED.daily_request_count
         END,
         day_key = EXCLUDED.day_key,
         last_alert_at = EXCLUDED.last_alert_at,
         updated_at = now()`,
      [
        provider,
        patch.state,
        patch.opened_reason,
        patch.opened_at,
        patch.retry_after,
        patch.daily_requests ?? 0,
        day,
        patch.last_alert_at,
      ],
    );
    return true;
  });
  if (!saved) {
    const m = memGet(provider);
    Object.assign(m, patch, { day });
  }
}

function logOpenOnce(provider, reason) {
  const key = `${provider}:${reason}:${todayKey()}`;
  if (openAlertOnce.has(key)) return;
  openAlertOnce.set(key, Date.now());
  console.error(
    JSON.stringify({
      level: "error",
      msg: "ai.circuit.opened",
      provider,
      reason,
      ts: new Date().toISOString(),
    }),
  );
}

/**
 * @param {string} provider
 * @param {() => Promise<any>} fn
 * @param {{ signal?: AbortSignal, idempotencyKey?: string, opts?: Partial<typeof DEFAULTS> }} [options]
 */
export async function runAiCall(provider, fn, options = {}) {
  const opts = { ...DEFAULTS, ...(options.opts || {}) };
  const signal = options.signal;

  const state = await getProviderState(provider);
  const now = Date.now();

  if (state.state === "open") {
    const retryAt = state.retry_after ? new Date(state.retry_after).getTime() : 0;
    if (retryAt && now < retryAt) {
      return {
        ok: false,
        errorCode: AI_ERROR_CODES.circuit_open,
        body: providerPausedBody(state.opened_reason || AI_ERROR_CODES.circuit_open, state.retry_after),
        skippedProvider: true,
      };
    }
    // half-open: allow single probe
    await persistState(provider, {
      ...state,
      state: "half-open",
      daily_requests: state.daily_requests,
    });
  }

  if ((state.daily_requests || 0) >= opts.dailyRequestLimit) {
    return {
      ok: false,
      errorCode: AI_ERROR_CODES.daily_limit,
      body: providerPausedBody(AI_ERROR_CODES.daily_limit, new Date(Date.now() + 3_600_000).toISOString()),
      skippedProvider: true,
    };
  }

  const concurrent = inflight.get(provider) || 0;
  if (concurrent >= opts.maxConcurrency) {
    return {
      ok: false,
      errorCode: AI_ERROR_CODES.concurrency_limit,
      body: { status: "busy", reason: AI_ERROR_CODES.concurrency_limit },
      skippedProvider: true,
    };
  }

  inflight.set(provider, concurrent + 1);
  let lastClass = null;

  try {
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      if (signal?.aborted) {
        return { ok: false, errorCode: AI_ERROR_CODES.timeout, skippedProvider: false };
      }
      try {
        const result = await Promise.race([
          fn(),
          new Promise((_, reject) => {
            const t = setTimeout(() => reject(Object.assign(new Error("timeout"), { name: "TimeoutError" })), opts.requestTimeoutMs);
            signal?.addEventListener("abort", () => {
              clearTimeout(t);
              reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
            }, { once: true });
          }),
        ]);

        await persistState(provider, {
          state: "closed",
          opened_reason: null,
          opened_at: null,
          retry_after: null,
          daily_requests: (state.daily_requests || 0) + 1,
          last_alert_at: state.last_alert_at,
        });
        return { ok: true, result };
      } catch (err) {
        lastClass = classifyAiError(err);
        if (isPermanentAiFailure(lastClass.code) || lastClass.code === AI_ERROR_CODES.credit_exhausted) {
          const retryAfter = new Date(Date.now() + opts.resetTimeoutMs).toISOString();
          await persistState(provider, {
            state: "open",
            opened_reason: lastClass.code,
            opened_at: new Date().toISOString(),
            retry_after: retryAfter,
            daily_requests: (state.daily_requests || 0) + 1,
            last_alert_at: new Date().toISOString(),
          });
          logOpenOnce(provider, lastClass.code);
          return {
            ok: false,
            errorCode: lastClass.code,
            body: providerPausedBody(lastClass.code, retryAfter),
            skippedProvider: false,
          };
        }
        if (!lastClass.retryable || attempt >= opts.maxRetries) {
          break;
        }
        await sleep(backoffMs(attempt, opts.baseBackoffMs, opts.maxBackoffMs), signal).catch(() => undefined);
      }
    }

    return {
      ok: false,
      errorCode: lastClass?.code || AI_ERROR_CODES.unknown,
      body: { status: "error", reason: lastClass?.code || AI_ERROR_CODES.unknown },
      skippedProvider: false,
    };
  } finally {
    inflight.set(provider, Math.max(0, (inflight.get(provider) || 1) - 1));
  }
}

/** Test helpers */
export function __resetAiCircuitMemory() {
  memoryStore.clear();
  openAlertOnce.clear();
  inflight.clear();
}
