#!/usr/bin/env node
/**
 * Auto content async job tests — validates start/status/process/cancel/watchdog flow.
 * Usage: node scripts/test-auto-content-jobs.mjs
 */
import {
  createAutoContentJob,
  getAutoContentJob,
  updateAutoContentJob,
  cancelAutoContentJob,
  runAutoContentJobWatchdog,
  AUTO_CONTENT_WATCHDOG_MS,
} from "../lib/auto-content/auto-content-jobs.mjs";
import { PHASE_PROGRESS } from "../lib/auto-content/auto-content-job-worker.mjs";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`✓ ${msg}`);
  } else {
    failed++;
    console.error(`✗ ${msg}`);
  }
}

async function testStartReturnsQuickly() {
  const t0 = Date.now();
  const started = await createAutoContentJob({ type: "sync", metadata: { triggerType: "test" } });
  const elapsed = Date.now() - t0;
  assert(started.ok && started.jobId, "start job returns jobId");
  assert(elapsed < 1000, `start job returns in < 1s (${elapsed}ms)`);
  assert(started.status === "queued", "start job status is queued");
  return started.jobId;
}

async function testStatus(jobId) {
  const snap = await getAutoContentJob(jobId);
  assert(snap.ok && snap.job?.id === jobId, "status job lookup works");
  assert(snap.job.status === "queued", "status shows queued initially");
}

async function testProcessUpdatesProgress(jobId) {
  await updateAutoContentJob(jobId, {
    status: "running",
    phase: "fetch_sources",
    progress: 10,
    started_at: new Date().toISOString(),
  });

  await updateAutoContentJob(jobId, {
    phase: "normalize",
    progress: 30,
    metadata: { logs: [{ at: new Date().toISOString(), phase: "normalize", message: "test" }] },
  });

  const mid = await getAutoContentJob(jobId);
  assert(mid.job.progress === 30, "process updates progress");
  assert(mid.job.phase === "normalize", "process updates phase");
}

async function testCompletedJob(jobId) {
  await updateAutoContentJob(jobId, {
    status: "completed",
    phase: "done",
    progress: 100,
    finished_at: new Date().toISOString(),
    result: { fetched: 3, deduped: 1, published: 2, review: 0, failed: 0 },
  });

  const snap = await getAutoContentJob(jobId);
  assert(snap.job.status === "completed", "completed job status");
  assert(snap.job.result?.published === 2, "completed job shows result counts");
}

async function testFailedJob() {
  const started = await createAutoContentJob({ type: "sync" });
  await updateAutoContentJob(started.jobId, {
    status: "failed",
    phase: "failed",
    progress: 100,
    error_message: "RSS fetch timeout — test error",
    finished_at: new Date().toISOString(),
  });

  const snap = await getAutoContentJob(started.jobId);
  assert(snap.job.status === "failed", "failed job status");
  assert(snap.job.error_message?.includes("timeout"), "failed job shows real error");
}

async function testCancel() {
  const started = await createAutoContentJob({ type: "sync" });
  const cancelled = await cancelAutoContentJob(started.jobId);
  assert(cancelled.ok && cancelled.status === "cancelled", "cancel works");
  const snap = await getAutoContentJob(started.jobId);
  assert(snap.job.status === "cancelled", "cancelled job status persisted");
}

async function testStuckJobWatchdog() {
  const started = await createAutoContentJob({ type: "sync" });
  const stale = new Date(Date.now() - AUTO_CONTENT_WATCHDOG_MS - 5000).toISOString();
  await updateAutoContentJob(started.jobId, {
    status: "running",
    phase: "ai_enrich",
    progress: 50,
    started_at: stale,
    updated_at: stale,
  });

  const watchdog = await runAutoContentJobWatchdog();
  assert(watchdog.count >= 1, "stuck job converted to failed by watchdog");

  const snap = await getAutoContentJob(started.jobId);
  assert(snap.job.status === "failed", "stuck job status is failed after watchdog");
}

async function testProcessQueue() {
  const j1 = await createAutoContentJob({ type: "sync", metadata: { triggerType: "test-queue" } });
  assert(j1.ok, "queue job created");
  const snap = await getAutoContentJob(j1.jobId);
  assert(snap.job.status === "queued", "job remains queued until processor claims it");
}

async function testPhaseProgressMap() {
  assert(PHASE_PROGRESS.done === 100, "done phase is 100%");
  assert(PHASE_PROGRESS.fetch_sources === 10, "fetch_sources phase mapped");
}

async function testPollingDoesNotTimeout() {
  const jobId = await testStartReturnsQuickly();
  const t0 = Date.now();
  for (let i = 0; i < 3; i++) {
    await getAutoContentJob(jobId);
  }
  const elapsed = Date.now() - t0;
  assert(elapsed < 1000, `status polling (3x) completes quickly (${elapsed}ms)`);
}

async function main() {
  console.log("=== Auto Content Jobs — Async Pipeline Tests ===\n");

  const jobId = await testStartReturnsQuickly();
  await testStatus(jobId);
  await testProcessUpdatesProgress(jobId);
  await testCompletedJob(jobId);
  await testFailedJob();
  await testCancel();
  await testStuckJobWatchdog();
  await testProcessQueue();
  await testPhaseProgressMap();
  await testPollingDoesNotTimeout();

  console.log(`\nAuto content job tests: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
