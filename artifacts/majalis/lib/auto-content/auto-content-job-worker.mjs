/**
 * Auto content job processor — runs sync pipeline in phases with progress updates.
 */

import { runAutoContentSync } from "./auto-content-sync.mjs";
import {
  getAutoContentJob,
  updateAutoContentJob,
  claimQueuedAutoContentJobs,
  releaseAutoContentJobLock,
  acquireAutoContentJobLock,
  appendJobLog,
  runAutoContentJobWatchdog,
  jobLog,
} from "./auto-content-jobs.mjs";

const PHASE_PROGRESS = {
  queued: 0,
  fetch_sources: 10,
  normalize: 25,
  validate: 35,
  dedup: 45,
  classify: 55,
  ai_enrich: 70,
  publish: 85,
  reindex: 95,
  done: 100,
  failed: 100,
  cancelled: 100,
};

function buildResult(summary) {
  const review =
    (summary.imported || 0) - (summary.published || 0) > 0
      ? Math.max(0, (summary.imported || 0) - (summary.published || 0))
      : 0;

  return {
    fetched: summary.sourcesTotal || 0,
    deduped: summary.duplicates ?? summary.skipped ?? 0,
    published: summary.published ?? 0,
    review,
    failed: summary.failed ?? 0,
    imported: summary.imported ?? 0,
    skipped: summary.skipped ?? 0,
    sourcesOk: summary.sourcesOk ?? 0,
    sourcesFailed: summary.sourcesFailed ?? 0,
    durationMs: summary.durationMs ?? 0,
    runId: summary.runId ?? null,
  };
}

async function reportProgress(jobId, phase, progress, message, extra = {}) {
  const snap = await getAutoContentJob(jobId);
  const job = snap.ok ? snap.job : { metadata: {} };
  const logs = appendJobLog(job, message, phase);

  await updateAutoContentJob(jobId, {
    phase,
    progress: Math.min(100, Math.max(progress, PHASE_PROGRESS[phase] ?? progress)),
    metadata: { ...job.metadata, logs, ...extra },
  });
}

async function isJobCancelled(jobId) {
  const snap = await getAutoContentJob(jobId);
  return snap.ok && snap.job.status === "cancelled";
}

/**
 * Process a single auto content job by id.
 * @param {string} jobId
 */
export async function processAutoContentJob(jobId) {
  if (!acquireAutoContentJobLock(jobId)) {
    jobLog(jobId, "process_skipped_locked");
    return { ok: false, error: "job_already_processing" };
  }

  try {
    const snap = await getAutoContentJob(jobId);
    if (!snap.ok) return { ok: false, error: snap.error };

    const job = snap.job;
    if (job.status === "cancelled") return { ok: true, jobId, status: "cancelled" };
    if (job.status === "completed") return { ok: true, jobId, status: "completed", result: job.result };
    if (job.status === "failed") return { ok: false, jobId, status: "failed", error: job.error_message };

    if (job.status === "queued") {
      await updateAutoContentJob(jobId, {
        status: "running",
        phase: "fetch_sources",
        progress: 1,
        started_at: new Date().toISOString(),
      });
    }

    jobLog(jobId, "process_start", { triggerType: job.metadata?.triggerType || "manual" });

    const triggerType = job.metadata?.triggerType || "manual";

    let lastPhase = "fetch_sources";
    const onProgress = async ({ phase, progress, message }) => {
      lastPhase = phase || lastPhase;
      await reportProgress(jobId, lastPhase, progress ?? PHASE_PROGRESS[lastPhase] ?? 50, message || lastPhase);
    };

    const shouldCancel = async () => isJobCancelled(jobId);

    await reportProgress(jobId, "fetch_sources", 5, "بدء جلب المصادر");

    const summary = await runAutoContentSync({
      triggerType,
      skipSchemaCheck: false,
      onProgress,
      shouldCancel,
    });

    if (await shouldCancel()) {
      jobLog(jobId, "process_cancelled_mid_run");
      return { ok: true, jobId, status: "cancelled" };
    }

    await reportProgress(jobId, "reindex", 92, "تحديث الفهرس");
    // Reindex is lightweight — feed cache refresh happens via published content RPC
    await reportProgress(jobId, "done", 100, "اكتملت المزامنة");

    const result = buildResult(summary);
    const failed = !summary.ok;
    const errorMessage = failed
      ? summary.error || summary.reason || "فشلت المزامنة — راجع سجل المصادر"
      : null;

    await updateAutoContentJob(jobId, {
      status: failed ? "failed" : "completed",
      phase: failed ? "failed" : "done",
      progress: 100,
      finished_at: new Date().toISOString(),
      error_message: errorMessage,
      result,
    });

    jobLog(jobId, "process_complete", { status: failed ? "failed" : "completed", result });

    return {
      ok: !failed,
      jobId,
      status: failed ? "failed" : "completed",
      result,
      error: errorMessage,
    };
  } catch (err) {
    const message = String(err.message || err);
    jobLog(jobId, "process_error", { error: message });
    await updateAutoContentJob(jobId, {
      status: "failed",
      phase: "failed",
      progress: 100,
      finished_at: new Date().toISOString(),
      error_message: message,
    });
    return { ok: false, jobId, status: "failed", error: message };
  } finally {
    releaseAutoContentJobLock(jobId);
  }
}

/**
 * Claim and process queued jobs (cron worker).
 * @param {number} [limit]
 */
export async function processQueuedAutoContentJobs(limit = 3) {
  await runAutoContentJobWatchdog();

  const claimed = await claimQueuedAutoContentJobs(limit);
  if (!claimed.ok || !claimed.jobIds?.length) {
    return { ok: true, processed: [], count: 0, claimed: claimed.jobIds || [] };
  }

  const processed = [];
  for (const jobId of claimed.jobIds) {
    const result = await processAutoContentJob(jobId);
    processed.push({ jobId, ...result });
  }

  return { ok: true, processed, count: processed.length, claimed: claimed.jobIds };
}

export { PHASE_PROGRESS };
