/**
 * AI spend governance — daily/monthly USD caps, token accounting (no raw prompts).
 * Durable when Postgres tables exist; memory fallback in test/dev only.
 */
import { createHash } from "node:crypto";
import { allowInMemoryReliabilityStore, logDurableStoreUnavailable } from "../reliability/env.mjs";
import { structuredLog } from "../observability/structured-log.mjs";
import { incCounter, observeDuration, setGauge, METRIC } from "../observability/metrics.mjs";

/** Default USD per 1M tokens (input/output) — conservative estimates for budgeting. */
export const PROVIDER_COST_PER_1M = Object.freeze({
  anthropic: { input: 3.0, output: 15.0, tier: 2 },
  "anthropic-test": { input: 3.0, output: 15.0, tier: 2 },
  openai: { input: 2.5, output: 10.0, tier: 2 },
  groq: { input: 0.05, output: 0.08, tier: 1 },
  local: { input: 0, output: 0, tier: 0 },
});

const DEFAULT_LIMITS = Object.freeze({
  dailyUsd: Number(process.env.AI_DAILY_SPEND_LIMIT_USD || 25),
  monthlyUsd: Number(process.env.AI_MONTHLY_SPEND_LIMIT_USD || 400),
});

/** @type {Map<string, { day: string, month: string, dayUsd: number, monthUsd: number }>} */
const memSpend = new Map();

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}
function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function estimateCostUsd(provider, inputTokens = 0, outputTokens = 0) {
  const rates = PROVIDER_COST_PER_1M[provider] || PROVIDER_COST_PER_1M.anthropic;
  const cost =
    (Math.max(0, inputTokens) / 1_000_000) * rates.input +
    (Math.max(0, outputTokens) / 1_000_000) * rates.output;
  return Math.round(cost * 1e6) / 1e6;
}

export function providerCostTier(provider) {
  return (PROVIDER_COST_PER_1M[provider] || PROVIDER_COST_PER_1M.anthropic).tier;
}

export function contentHash(parts) {
  const h = createHash("sha256");
  h.update(typeof parts === "string" ? parts : JSON.stringify(parts));
  return h.digest("hex");
}

async function withPg(fn) {
  try {
    const { getPgPool } = await import("../database.mjs");
    const pool = typeof getPgPool === "function" ? await getPgPool() : null;
    if (!pool) return null;
    return await fn(pool);
  } catch (err) {
    logDurableStoreUnavailable("ai_spend.pg", err?.message || err);
    return null;
  }
}

function memBucket(scope = "global") {
  const d = dayKey();
  const m = monthKey();
  let row = memSpend.get(scope);
  if (!row) {
    row = { day: d, month: m, dayUsd: 0, monthUsd: 0 };
    memSpend.set(scope, row);
  }
  if (row.month !== m) {
    row.month = m;
    row.monthUsd = 0;
    row.day = d;
    row.dayUsd = 0;
  } else if (row.day !== d) {
    row.day = d;
    row.dayUsd = 0;
  }
  return row;
}

/**
 * @returns {Promise<{ allowed: boolean, reason?: string, dayUsd: number, monthUsd: number, limits: typeof DEFAULT_LIMITS }>}
 */
export async function checkSpendLimits(opts = {}) {
  const limits = {
    dailyUsd: opts.dailyUsd ?? DEFAULT_LIMITS.dailyUsd,
    monthlyUsd: opts.monthlyUsd ?? DEFAULT_LIMITS.monthlyUsd,
  };
  const fromDb = await withPg(async (pool) => {
    const d = dayKey();
    const m = monthKey();
    const { rows: dayRows } = await pool.query(
      `SELECT COALESCE(SUM(cost_usd),0)::float AS s FROM ai_spend_ledger WHERE day_key = $1`,
      [d],
    );
    const { rows: monthRows } = await pool.query(
      `SELECT COALESCE(SUM(cost_usd),0)::float AS s FROM ai_spend_ledger WHERE month_key = $1`,
      [m],
    );
    return { dayUsd: dayRows[0]?.s || 0, monthUsd: monthRows[0]?.s || 0 };
  });

  let dayUsd;
  let monthUsd;
  if (fromDb) {
    dayUsd = fromDb.dayUsd;
    monthUsd = fromDb.monthUsd;
  } else if (allowInMemoryReliabilityStore()) {
    const b = memBucket();
    dayUsd = b.dayUsd;
    monthUsd = b.monthUsd;
  } else {
    dayUsd = 0;
    monthUsd = 0;
  }

  setGauge("ai.spend.day_usd", dayUsd);
  setGauge("ai.spend.month_usd", monthUsd);

  if (dayUsd >= limits.dailyUsd) {
    return { allowed: false, reason: "daily_spend_limit", dayUsd, monthUsd, limits };
  }
  if (monthUsd >= limits.monthlyUsd) {
    return { allowed: false, reason: "monthly_spend_limit", dayUsd, monthUsd, limits };
  }
  return { allowed: true, dayUsd, monthUsd, limits };
}

/**
 * Record a completed (or estimated) AI spend row — never stores prompt/completion text.
 */
export async function recordSpend({
  provider,
  model = null,
  inputTokens = 0,
  outputTokens = 0,
  costUsd = null,
  requestId = null,
  traceId = null,
  jobRunId = null,
  contentHash: hash = null,
  cacheHit = false,
  status = "ok",
  errorCode = null,
}) {
  const cost =
    costUsd != null ? Number(costUsd) : estimateCostUsd(provider, inputTokens, outputTokens);
  const d = dayKey();
  const m = monthKey();

  incCounter(METRIC.aiRequestCount, 1);
  if (inputTokens || outputTokens) {
    incCounter(METRIC.aiTokenUsage, (inputTokens || 0) + (outputTokens || 0));
  }
  incCounter(METRIC.aiProviderCost, 0);
  setGauge(METRIC.aiProviderCost, cost);

  const saved = await withPg(async (pool) => {
    await pool.query(
      `INSERT INTO ai_spend_ledger
        (provider, model, input_tokens, output_tokens, cost_usd, day_key, month_key,
         request_id, trace_id, job_run_id, content_hash, cache_hit, status, error_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        provider,
        model,
        inputTokens || 0,
        outputTokens || 0,
        cost,
        d,
        m,
        requestId,
        traceId,
        jobRunId,
        hash,
        !!cacheHit,
        status,
        errorCode,
      ],
    );
    return true;
  });

  if (!saved && allowInMemoryReliabilityStore()) {
    const b = memBucket();
    if (!cacheHit && status === "ok") {
      b.dayUsd += cost;
      b.monthUsd += cost;
    }
  }

  structuredLog("info", "ai.spend.recorded", {
    request_id: requestId,
    trace_id: traceId,
    job_run_id: jobRunId,
    provider,
    model,
    input_tokens: inputTokens || 0,
    output_tokens: outputTokens || 0,
    cost_usd: cost,
    cache_hit: !!cacheHit,
    status,
    error_code: errorCode,
    metric: "ai_spend",
  });

  return { costUsd: cost, persisted: !!saved };
}

export function __resetSpendMemory() {
  memSpend.clear();
}

export const AI_SPEND_DEFAULTS = DEFAULT_LIMITS;
