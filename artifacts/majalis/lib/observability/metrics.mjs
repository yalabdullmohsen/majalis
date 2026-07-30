/**
 * In-process aggregatable metrics (p50/p95/p99 + counters/gauges).
 * Safe for serverless: per-instance; durable rollups optional via spend ledger / jobs tables.
 */

/** @type {Map<string, number[]>} */
const histograms = new Map();
/** @type {Map<string, number>} */
const counters = new Map();
/** @type {Map<string, number|string>} */
const gauges = new Map();

const MAX_SAMPLES = 2_000;

function pushSample(name, valueMs) {
  const v = Number(valueMs);
  if (!Number.isFinite(v) || v < 0) return;
  let arr = histograms.get(name);
  if (!arr) {
    arr = [];
    histograms.set(name, arr);
  }
  arr.push(v);
  if (arr.length > MAX_SAMPLES) arr.splice(0, arr.length - MAX_SAMPLES);
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function observeDuration(metric, valueMs) {
  pushSample(metric, valueMs);
}

export function incCounter(metric, by = 1) {
  counters.set(metric, (counters.get(metric) || 0) + by);
}

export function setGauge(metric, value) {
  gauges.set(metric, value);
}

export function getHistogramStats(metric) {
  const arr = [...(histograms.get(metric) || [])].sort((a, b) => a - b);
  return {
    count: arr.length,
    p50: percentile(arr, 50),
    p95: percentile(arr, 95),
    p99: percentile(arr, 99),
    max: arr.length ? arr[arr.length - 1] : null,
  };
}

/**
 * Snapshot of all known metrics for admin/readyz.
 */
export function snapshotMetrics() {
  /** @type {Record<string, unknown>} */
  const hist = {};
  for (const key of histograms.keys()) {
    hist[key] = getHistogramStats(key);
  }
  return {
    histograms: hist,
    counters: Object.fromEntries(counters),
    gauges: Object.fromEntries(gauges),
  };
}

/** Test helper */
export function __resetMetrics() {
  histograms.clear();
  counters.clear();
  gauges.clear();
}

/** Well-known metric names */
export const METRIC = Object.freeze({
  httpDuration: "http.request.duration_ms",
  dbQueryDuration: "db.query.duration_ms",
  cronDuration: "cron.duration_ms",
  queueDepth: "queue.depth",
  dlqCount: "queue.dlq_count",
  aiRequestCount: "ai.request.count",
  aiTokenUsage: "ai.token.usage",
  aiProviderCost: "ai.provider.cost_usd",
  aiCacheHitRatio: "ai.cache.hit_ratio",
  aiRetryCount: "ai.retry.count",
  aiCircuitState: "ai.circuit.state",
});
