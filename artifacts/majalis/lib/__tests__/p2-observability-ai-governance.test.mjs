/**
 * P2 Observability + AI Cost Governance unit tests.
 * Run: NODE_ENV=test ALLOW_IN_MEMORY_RELIABILITY_STORE=1 node lib/__tests__/p2-observability-ai-governance.test.mjs
 */
import assert from "node:assert/strict";
import { classifyAiError, AI_ERROR_CODES } from "../ai/error-classifier.mjs";
import { runAiCall, __resetAiCircuitMemory } from "../ai/provider-client.mjs";
import { shouldRetryAiError, resolveProviderFallbacks } from "../ai/fallback-policy.mjs";
import {
  checkSpendLimits,
  recordSpend,
  __resetSpendMemory,
  estimateCostUsd,
} from "../ai/spend-governance.mjs";
import { lookupAiCache, storeAiCache, claimAiDedup, __resetAiCacheMemory } from "../ai/content-cache.mjs";
import { isPrivateIp, isBlockedHostname, assertSafeUrl } from "../security/ssrf.mjs";
import { sanitizeObsFields, structuredLog } from "../observability/structured-log.mjs";
import {
  observeDuration,
  getHistogramStats,
  __resetMetrics,
  incCounter,
  snapshotMetrics,
  setGauge,
} from "../observability/metrics.mjs";

process.env.NODE_ENV = "test";
process.env.ALLOW_IN_MEMORY_RELIABILITY_STORE = "1";
for (const k of ["DATABASE_URL", "MIGRATION_TEST_DATABASE_URL", "POSTGRES_URL", "SUPABASE_DB_URL"]) {
  delete process.env[k];
}

__resetAiCircuitMemory();
__resetSpendMemory();
__resetAiCacheMemory();
__resetMetrics();

// ── credit_exhausted: no retry ───────────────────────────────────────────────
{
  __resetAiCircuitMemory();
  let calls = 0;
  const first = await runAiCall("anthropic-test", async () => {
    calls += 1;
    const err = new Error("credit balance too low");
    err.status = 400;
    throw err;
  });
  assert.equal(first.errorCode, AI_ERROR_CODES.credit_exhausted);
  assert.equal(calls, 1);
  assert.equal(shouldRetryAiError(AI_ERROR_CODES.credit_exhausted, { attempt: 0, maxRetries: 3 }), false);
  const second = await runAiCall("anthropic-test", async () => {
    calls += 1;
    return "nope";
  });
  assert.equal(second.skippedProvider, true);
  assert.equal(calls, 1);
  console.log("  ✓ credit_exhausted no-retry + circuit");
}

// ── rate_limited: retry budget ───────────────────────────────────────────────
{
  __resetAiCircuitMemory();
  let calls = 0;
  const res = await runAiCall(
    "anthropic-rate",
    async () => {
      calls += 1;
      if (calls === 1) {
        const err = new Error("rate limit");
        err.status = 429;
        throw err;
      }
      return { ok: true };
    },
    { opts: { maxRetries: 1, softFailureThreshold: 99 } },
  );
  assert.equal(res.ok, true);
  assert.equal(calls, 2);
  assert.equal(shouldRetryAiError(AI_ERROR_CODES.rate_limited, { attempt: 0, maxRetries: 1 }), true);
  console.log("  ✓ rate_limited retry budget");
}

// ── provider_unavailable + timeout classification ────────────────────────────
{
  assert.equal(classifyAiError({ status: 503 }).code, AI_ERROR_CODES.provider_unavailable);
  assert.equal(classifyAiError({ name: "TimeoutError" }).code, AI_ERROR_CODES.timeout);
  assert.equal(shouldRetryAiError(AI_ERROR_CODES.network_error, { attempt: 0, maxRetries: 1 }), true);
  assert.equal(shouldRetryAiError(AI_ERROR_CODES.timeout, { attempt: 1, maxRetries: 1 }), false);
  console.log("  ✓ provider_unavailable / timeout / retry budget");
}

// ── spending limits (daily / monthly) ────────────────────────────────────────
{
  __resetSpendMemory();
  process.env.AI_DAILY_SPEND_LIMIT_USD = "0.000001";
  // force tiny limit via opts
  await recordSpend({
    provider: "anthropic-test",
    inputTokens: 1_000_000,
    outputTokens: 0,
    status: "ok",
  });
  const blocked = await checkSpendLimits({ dailyUsd: 0.000001, monthlyUsd: 1000 });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, "daily_spend_limit");

  __resetSpendMemory();
  await recordSpend({
    provider: "anthropic-test",
    inputTokens: 1_000_000,
    outputTokens: 0,
    status: "ok",
  });
  const monthBlocked = await checkSpendLimits({ dailyUsd: 1000, monthlyUsd: 0.000001 });
  assert.equal(monthBlocked.allowed, false);
  assert.equal(monthBlocked.reason, "monthly_spend_limit");

  const gated = await runAiCall(
    "anthropic-spend",
    async () => "x",
    { opts: { dailyUsd: 0.000001, monthlyUsd: 1000 } },
  );
  // After previous spends in memory bucket — re-seed
  __resetSpendMemory();
  await recordSpend({
    provider: "anthropic-test",
    costUsd: 1,
    status: "ok",
  });
  const gated2 = await runAiCall(
    "anthropic-spend2",
    async () => "x",
    { opts: { dailyUsd: 0.5, monthlyUsd: 1000 } },
  );
  assert.equal(gated2.ok, false);
  assert.equal(gated2.errorCode, AI_ERROR_CODES.daily_spend_limit);
  console.log("  ✓ spending daily/monthly limits");
  delete process.env.AI_DAILY_SPEND_LIMIT_USD;
  void gated;
}

// ── duplicate content + cache hit ────────────────────────────────────────────
{
  __resetAiCacheMemory();
  __resetAiCircuitMemory();
  __resetSpendMemory();
  const key = { prompt_fingerprint: "ayah-test-1", model: "x" };
  let calls = 0;
  const first = await runAiCall(
    "anthropic-cache",
    async () => {
      calls += 1;
      return { text: "ok", usage: { input: 10, output: 5 } };
    },
    {
      contentKey: key,
      extractUsage: (r) => ({ inputTokens: r.usage?.input || 0, outputTokens: r.usage?.output || 0 }),
    },
  );
  assert.equal(first.ok, true);
  assert.equal(calls, 1);

  const cached = await runAiCall(
    "anthropic-cache",
    async () => {
      calls += 1;
      return { text: "should-not" };
    },
    { contentKey: key },
  );
  assert.equal(cached.ok, true);
  assert.equal(cached.cacheHit, true);
  assert.equal(calls, 1);

  const lookup = await lookupAiCache(key, { provider: "anthropic-cache" });
  assert.equal(lookup.hit, true);

  await storeAiCache("other", { a: 1 }, { provider: "p", model: "m" });
  const dedup1 = await claimAiDedup("dup-body", { provider: "p" });
  const dedup2 = await claimAiDedup("dup-body", { provider: "p" });
  assert.equal(dedup1.duplicate, false);
  assert.equal(dedup2.duplicate, true);
  console.log("  ✓ duplicate content + cache hit");
}

// ── fallback never upgrades cost without policy ──────────────────────────────
{
  const fb = resolveProviderFallbacks("groq", ["anthropic", "local", "openai"], {
    allowExpensiveFallback: false,
  });
  assert.ok(!fb.includes("anthropic"));
  assert.ok(!fb.includes("openai"));
  assert.ok(fb.includes("local"));
  const fb2 = resolveProviderFallbacks("groq", ["anthropic"], { allowExpensiveFallback: true });
  assert.ok(fb2.includes("anthropic"));
  console.log("  ✓ provider fallback policy");
}

// ── SSRF blocked + safe redirect host checks ─────────────────────────────────
{
  assert.equal(isPrivateIp("127.0.0.1"), true);
  assert.equal(isPrivateIp("10.0.0.5"), true);
  assert.equal(isPrivateIp("192.168.1.1"), true);
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isBlockedHostname("localhost"), true);
  assert.equal(isBlockedHostname("metadata.google.internal"), true);
  await assert.rejects(() => assertSafeUrl("http://127.0.0.1/secret"), /SSRF_BLOCKED/);
  await assert.rejects(() => assertSafeUrl("http://169.254.169.254/latest/meta-data/"), /SSRF_BLOCKED/);
  await assert.rejects(
    () => assertSafeUrl("https://evil.example.com/", { allowlist: ["majlisilm.com"] }),
    /SSRF_BLOCKED/,
  );
  const ok = await assertSafeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(ok.hostname, "www.youtube.com");
  console.log("  ✓ SSRF blocked + safe allowlist host");
}

// ── metrics p50/p95/p99 + sanitization ───────────────────────────────────────
{
  __resetMetrics();
  for (const v of [10, 20, 30, 40, 50, 100, 200, 300, 400, 1000]) observeDuration("t", v);
  const s = getHistogramStats("t");
  assert.ok(s.p50 != null && s.p95 != null && s.p99 != null);
  assert.ok(s.p50 <= s.p95 && s.p95 <= s.p99);
  incCounter("ai.request.count", 2);
  setGauge("queue.depth", 7);
  setGauge("queue.dlq_count", 1);
  const snap = snapshotMetrics();
  assert.equal(snap.gauges["queue.depth"], 7);
  const sanitized = sanitizeObsFields({
    token: "sk-secret",
    prompt: "user private text",
    request_id: "r1",
  });
  assert.equal(sanitized.token, "[redacted]");
  assert.equal(sanitized.prompt, "[redacted]");
  assert.equal(sanitized.request_id, "r1");
  structuredLog("info", "test.ok", { request_id: "r1", trace_id: "t1", job_run_id: "j1" });
  assert.ok(estimateCostUsd("anthropic", 1_000_000, 0) > 0);
  console.log("  ✓ metrics percentiles + safe logs");
}

console.log("\nP2 observability/AI governance tests passed.");
