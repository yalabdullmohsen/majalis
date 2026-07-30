/**
 * job-worker must finish within WORKER_DEADLINE_MS even if the runner hangs.
 */
import assert from "node:assert/strict";
import {
  runJobBatchesWithBudget,
  WORKER_DEADLINE_MS,
  MAX_BATCHES_PER_INVOKE,
} from "../api-handlers/cron/job-worker.js";

assert.ok(WORKER_DEADLINE_MS <= 8_000, "worker budget must stay under dispatch 12s with headroom");
assert.equal(MAX_BATCHES_PER_INVOKE, 1, "one batch per invoke");

{
  const started = Date.now();
  const deadlineAt = started + 200;
  const ac = new AbortController();
  const result = await runJobBatchesWithBudget({
    deadlineAt,
    signal: ac.signal,
    cursor: { n: 0 },
    metadata: {},
    maxBatches: 1,
    run: async () => {
      await new Promise((r) => setTimeout(r, 5_000));
      return { done: true, continue: false };
    },
  });
  const elapsed = Date.now() - started;
  assert.equal(result.timedOut, true);
  assert.equal(result.done, false);
  assert.ok(elapsed < 1_500, `budget race must return quickly, got ${elapsed}ms`);
}

{
  // Explicit maxBatches=1 even if continue:true
  let calls = 0;
  const started = Date.now();
  const result = await runJobBatchesWithBudget({
    deadlineAt: started + 2_000,
    signal: new AbortController().signal,
    cursor: {},
    metadata: {},
    maxBatches: 1,
    run: async () => {
      calls += 1;
      return { done: false, continue: true, cursor: { i: calls } };
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.batches, 1);
  assert.equal(result.done, false);
  assert.equal(result.timedOut, false);
  assert.ok(Date.now() - started < 1_500);
}

console.log("job-worker-budget: ok");
