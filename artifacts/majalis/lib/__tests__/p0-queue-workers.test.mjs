/**
 * P0 queue/workers unit tests — enqueue, claim, complete, retry, DLQ,
 * idempotency, worker registry, metadata.mode, abort, concurrent type lock.
 */
import assert from "node:assert/strict";
import {
  enqueueJob,
  claimNextJob,
  completeJob,
  failJob,
  __resetJobMemory,
  __getMemAttempts,
  __getMemDeadLetter,
  listAllowedJobTypes,
} from "../jobs/queue.mjs";
import {
  hasJobWorker,
  listRegisteredJobWorkers,
  getJobWorker,
} from "../jobs/job-workers.mjs";
import { resolveEnqueueMetadata, createEnqueueCronHandler } from "../jobs/cron-enqueue.mjs";

function mockRes() {
  const state = { headersSent: false, writableEnded: false, body: null, headers: {}, json: null };
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
      try {
        state.json = JSON.parse(payload);
      } catch {
        state.json = null;
      }
    },
  };
}

function mockReq(overrides = {}) {
  return {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET || "test-secret"}` },
    method: "GET",
    url: "/api/cron/source-monitor",
    query: {},
    body: {},
    ...overrides,
  };
}

{
  const allowed = listAllowedJobTypes();
  const registered = new Set(listRegisteredJobWorkers());
  for (const t of allowed) {
    assert.equal(hasJobWorker(t), true, `missing worker for ${t}`);
    assert.ok(registered.has(t), `not in registry: ${t}`);
  }
}

{
  __resetJobMemory();
  const a = await enqueueJob({
    jobType: "source-monitor",
    idempotencyKey: "dup-1",
    metadata: { mode: "full" },
  });
  const b = await enqueueJob({
    jobType: "source-monitor",
    idempotencyKey: "dup-1",
    metadata: { mode: "other" },
  });
  assert.equal(a.ok && b.ok, true);
  assert.equal(a.job.job_id, b.job.job_id);
  assert.equal(b.duplicate, true);
}

{
  __resetJobMemory();
  await enqueueJob({ jobType: "sync-data", idempotencyKey: "c1" });
  const claimed = await claimNextJob({ workerId: "w1", leaseMs: 30_000 });
  assert.ok(claimed);
  assert.equal(claimed.status, "running");
  assert.equal(claimed.locked_by, "w1");
  assert.ok(claimed.locked_at);
  assert.equal(claimed.attempt_count, 1);
  assert.ok(claimed._attempt_id);

  await enqueueJob({ jobType: "sync-data", idempotencyKey: "c2" });
  const blocked = await claimNextJob({ workerId: "w2", leaseMs: 30_000 });
  assert.equal(blocked, null, "same job_type must not run concurrently");

  await completeJob(claimed.job_id, { ok: true }, claimed._attempt_id);
  const attempts = __getMemAttempts(claimed.job_id);
  assert.ok(attempts.length >= 1);
  assert.ok(attempts[0].finished_at);

  const next = await claimNextJob({ workerId: "w3", leaseMs: 30_000 });
  assert.ok(next);
  assert.equal(next.idempotency_key, "c2");
  await completeJob(next.job_id, {}, next._attempt_id);
}

{
  __resetJobMemory();
  const enq = await enqueueJob({ jobType: "ai-agents", idempotencyKey: "retry-1", maxAttempts: 3 });
  assert.equal(enq.ok, true);
  let job = await claimNextJob({ workerId: "rt1" });
  await failJob(job.job_id, {
    errorCode: "rate_limited",
    errorMessage: "429",
    attemptId: job._attempt_id,
  });
  const again = await enqueueJob({ jobType: "ai-agents", idempotencyKey: "retry-1" });
  assert.equal(again.job.status, "queued");
  assert.ok(again.job.next_retry_at || again.job.next_run_at);
  again.job.next_run_at = new Date(Date.now() - 1000).toISOString();
  again.job.next_retry_at = again.job.next_run_at;
  job = await claimNextJob({ workerId: "rt2" });
  assert.ok(job);
  assert.equal(job.attempt_count, 2);
  await failJob(job.job_id, {
    errorCode: "credit_exhausted",
    errorMessage: "no credits",
    attemptId: job._attempt_id,
  });
  const dl = __getMemDeadLetter(job.job_id);
  assert.ok(dl);
  assert.equal(dl.last_error_code, "credit_exhausted");
}

{
  __resetJobMemory();
  await enqueueJob({ jobType: "governance-backup", idempotencyKey: "dlq-1", maxAttempts: 1 });
  const j = await claimNextJob({ workerId: "d1" });
  await failJob(j.job_id, {
    errorCode: "no_worker_registered",
    errorMessage: "forced",
    forceDeadLetter: true,
    attemptId: j._attempt_id,
  });
  assert.equal(__getMemDeadLetter(j.job_id)?.last_error_code, "no_worker_registered");
}

{
  const meta = resolveEnqueueMetadata(
    { url: "/api/cron/autonomous-platform-fetch", query: {}, body: {} },
    "autonomous-platform",
  );
  assert.equal(meta.mode, "fetch");

  const metaQ = resolveEnqueueMetadata(
    { url: "/api/cron/majlis-knowledge-engine", query: { mode: "incremental" }, body: {} },
    "majlis-knowledge-engine",
  );
  assert.equal(metaQ.mode, "incremental");

  const sched = resolveEnqueueMetadata(
    { url: "/api/cron/content-scheduler", query: {}, body: {} },
    "content-scheduler",
  );
  assert.equal(sched.job, "source-check");
}

{
  process.env.CRON_SECRET = process.env.CRON_SECRET || "test-secret";
  process.env.NODE_ENV = "test";
  __resetJobMemory();
  const handler = createEnqueueCronHandler("source-monitor");
  const res = mockRes();
  await handler(mockReq({ url: "/api/cron/source-monitor" }), res);
  assert.equal(res.state.json?.status, "accepted");
  assert.equal(res.state.json?.ok, true);
  assert.ok(res.state.json?.jobId);
}

{
  const worker = getJobWorker("platform-bootstrap");
  const ac = new AbortController();
  ac.abort(new Error("worker_deadline"));
  let threw = false;
  try {
    await worker({ signal: ac.signal, cursor: {}, metadata: {} });
  } catch (err) {
    threw = true;
    assert.equal(err.code, "aborted");
  }
  assert.equal(threw, true);
}

console.log("p0-queue-workers: ok");
