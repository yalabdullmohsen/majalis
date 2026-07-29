/**
 * P0 reliability unit tests — AI circuit, HTTP double-send, queue, UUID/slug.
 * Run with NODE_ENV=test and DB URLs unset (see package.json test:p0-reliability).
 */
import assert from "node:assert/strict";
import { classifyAiError, isPermanentAiFailure, AI_ERROR_CODES } from "../ai/error-classifier.mjs";
import { runAiCall, __resetAiCircuitMemory } from "../ai/provider-client.mjs";
import { sendJson, isResponseClosed } from "../api/_http.mjs";
import {
  enqueueJob,
  claimNextJob,
  completeJob,
  __resetJobMemory,
  isAllowedJobType,
} from "../jobs/queue.mjs";

function mockRes() {
  const state = { headersSent: false, writableEnded: false, statusCode: 0, body: null, headers: {} };
  return {
    state,
    get headersSent() {
      return state.headersSent;
    },
    get writableEnded() {
      return state.writableEnded;
    },
    setHeader(k, v) {
      state.headers[k] = v;
    },
    end(payload) {
      if (state.headersSent) throw new Error("ERR_HTTP_HEADERS_SENT");
      state.headersSent = true;
      state.writableEnded = true;
      state.body = payload;
    },
  };
}

{
  const c = classifyAiError({ status: 400, message: "credit balance too low" });
  assert.equal(c.code, AI_ERROR_CODES.credit_exhausted);
  assert.equal(c.retryable, false);
  assert.equal(isPermanentAiFailure(c.code), true);
  const r = classifyAiError({ status: 429, message: "rate limit" });
  assert.equal(r.code, AI_ERROR_CODES.rate_limited);
  assert.equal(r.retryable, true);
}

{
  __resetAiCircuitMemory();
  let calls = 0;
  const first = await runAiCall("anthropic-test", async () => {
    calls += 1;
    const err = new Error("credit balance too low");
    err.status = 400;
    throw err;
  });
  assert.equal(first.ok, false);
  assert.equal(first.errorCode, AI_ERROR_CODES.credit_exhausted);
  assert.equal(calls, 1);

  const second = await runAiCall("anthropic-test", async () => {
    calls += 1;
    return "should-not-run";
  });
  assert.equal(second.ok, false);
  assert.equal(second.skippedProvider, true);
  assert.equal(calls, 1);
  assert.equal(second.body?.status, "provider_paused");
}

{
  const res = mockRes();
  assert.equal(sendJson(res, 200, { ok: true }), true);
  assert.equal(isResponseClosed(res), true);
  assert.equal(sendJson(res, 500, { ok: false }), false);
}

{
  __resetJobMemory();
  assert.equal(isAllowedJobType("source-monitor"), true);
  assert.equal(isAllowedJobType("rm -rf"), false);
  const a = await enqueueJob({ jobType: "source-monitor", idempotencyKey: "t1" });
  const b = await enqueueJob({ jobType: "source-monitor", idempotencyKey: "t1" });
  assert.equal(a.ok && b.ok, true);
  assert.equal(a.job.job_id, b.job.job_id);
  const claimed = await claimNextJob({ workerId: "w1" });
  assert.ok(claimed);
  const claimed2 = await claimNextJob({ workerId: "w2" });
  assert.equal(claimed2, null);
  await completeJob(claimed.job_id);
}

console.log("p0-reliability: ok");
