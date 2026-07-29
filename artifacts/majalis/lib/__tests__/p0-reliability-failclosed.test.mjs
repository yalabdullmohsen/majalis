/**
 * Fail-closed Production reliability store + classifier regression tests.
 */
import assert from "node:assert/strict";
import { classifyAiError, opensCircuitImmediately, AI_ERROR_CODES } from "../ai/error-classifier.mjs";
import { runAiCall, __resetAiCircuitMemory } from "../ai/provider-client.mjs";
import { enqueueJob, __resetJobMemory } from "../jobs/queue.mjs";
import { allowInMemoryReliabilityStore, isProductionRuntime } from "../reliability/env.mjs";

{
  const credit = classifyAiError({ status: 400, message: "Your credit balance is too low" });
  assert.equal(credit.code, AI_ERROR_CODES.credit_exhausted);
  assert.equal(opensCircuitImmediately(credit.code), true);

  const quotaOnly = classifyAiError({ status: 429, message: "quota exceeded for today" });
  assert.equal(quotaOnly.code, AI_ERROR_CODES.quota_exceeded);

  const rate = classifyAiError({ status: 429, message: "rate limit", headers: { "retry-after": "30" } });
  assert.equal(rate.code, AI_ERROR_CODES.rate_limited);
  assert.ok(rate.retryAfterHeader);

  // Bare "quota" in 400 without billing tokens → invalid_request (not credit)
  const notCredit = classifyAiError({ status: 400, message: "invalid quota parameter" });
  assert.equal(notCredit.code, AI_ERROR_CODES.invalid_request);
  assert.equal(opensCircuitImmediately(notCredit.code), false);
}

{
  const prevNode = process.env.NODE_ENV;
  const prevVercel = process.env.VERCEL_ENV;
  const prevAllow = process.env.ALLOW_IN_MEMORY_RELIABILITY_STORE;
  process.env.NODE_ENV = "production";
  process.env.VERCEL_ENV = "production";
  delete process.env.ALLOW_IN_MEMORY_RELIABILITY_STORE;

  assert.equal(isProductionRuntime(), true);
  assert.equal(allowInMemoryReliabilityStore(), false);

  __resetJobMemory();
  const enq = await enqueueJob({ jobType: "source-monitor", idempotencyKey: "prod-fail-closed" });
  assert.equal(enq.ok, false);
  assert.equal(enq.error, "durable_store_unavailable");

  __resetAiCircuitMemory();
  const ai = await runAiCall("anthropic-prod", async () => "nope");
  assert.equal(ai.ok, false);
  assert.equal(ai.errorCode, AI_ERROR_CODES.durable_store_unavailable);
  assert.equal(ai.skippedProvider, true);

  process.env.NODE_ENV = prevNode;
  if (prevVercel == null) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = prevVercel;
  if (prevAllow == null) delete process.env.ALLOW_IN_MEMORY_RELIABILITY_STORE;
  else process.env.ALLOW_IN_MEMORY_RELIABILITY_STORE = prevAllow;
}

{
  process.env.NODE_ENV = "test";
  delete process.env.VERCEL_ENV;
  assert.equal(allowInMemoryReliabilityStore(), true);
  __resetJobMemory();
  const enq = await enqueueJob({ jobType: "source-monitor", idempotencyKey: "test-mem" });
  assert.equal(enq.ok, true);
  assert.equal(enq.durable, false);
}

console.log("p0-reliability-failclosed: ok");
