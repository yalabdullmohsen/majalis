/**
 * Import Center dashboard — aggregates recent jobs and performance metrics.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { resolveContentType } from "./registry.mjs";
import { listRecentImportJobs } from "./import-jobs.mjs";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function avg(nums) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function extractStructuredErrors(job) {
  const fromReport = job.report?.structuredErrors || [];
  const fromValidation = (job.validation_errors || []).map((msg, i) => ({
    line: i + 1,
    message: msg,
    errorType: "validation",
  }));
  return [...fromReport, ...fromValidation].slice(0, 20);
}

/**
 * @param {object} [opts]
 */
export async function buildImportCenterStats(opts = {}) {
  const limit = opts.limit || 30;
  const jobs = await listRecentImportJobs(limit);
  const cutoff = Date.now() - THIRTY_DAYS_MS;

  const recent = jobs.map((job) => {
    const def = resolveContentType(job.type);
    const stats = job.report?.stats || {};
    return {
      id: job.id,
      type: job.type,
      label: def?.label || job.type,
      targetTable: def?.table || null,
      filename: job.filename,
      status: job.status,
      phase: job.phase,
      totalRows: job.total_rows || stats.read || 0,
      imported: job.imported ?? stats.imported ?? 0,
      skipped: job.skipped ?? stats.skipped ?? 0,
      failed: job.failed ?? stats.failed ?? 0,
      duplicates: stats.duplicates_in_file ?? 0,
      rejected: stats.invalid ?? job.validation_errors?.length ?? 0,
      progressPct: job.progress_pct ?? 0,
      executionTimeMs: job.timings?.total_ms ?? job.report?.duration_ms ?? null,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      errors: extractStructuredErrors(job),
    };
  });

  const last30 = jobs.filter((j) => {
    const t = new Date(j.started_at || j.completed_at || 0).getTime();
    return t >= cutoff;
  });

  const completed30 = last30.filter((j) => j.status === "completed");
  const failed30 = last30.filter((j) => j.status === "failed");
  const successRate30d =
    last30.length > 0 ? Math.round((completed30.length / last30.length) * 100) : null;

  const durations = completed30
    .map((j) => j.timings?.total_ms ?? j.report?.duration_ms)
    .filter((n) => typeof n === "number" && n > 0);

  const speeds = completed30
    .map((j) => {
      const ms = j.timings?.total_ms ?? j.report?.duration_ms;
      const rows = j.imported ?? j.total_rows ?? 0;
      if (!ms || !rows) return null;
      return Math.round((rows / ms) * 1000);
    })
    .filter((n) => typeof n === "number" && n > 0);

  const latestErrors = recent
    .filter((j) => j.status === "failed" && j.errors.length)
    .slice(0, 10);

  const latestRejected = recent
    .filter((j) => j.rejected > 0)
    .slice(0, 10);

  const latestDuplicates = recent
    .filter((j) => j.duplicates > 0)
    .slice(0, 10);

  const activeJobs = recent.filter((j) =>
    ["queued", "processing", "validating", "importing", "uploading", "parsing"].includes(j.status),
  );

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    metrics: {
      totalJobsListed: recent.length,
      activeJobs: activeJobs.length,
      successRate30d,
      avgExecutionTimeMs: avg(durations),
      avgImportSpeedRowsPerSec: avg(speeds),
      completedLast30d: completed30.length,
      failedLast30d: failed30.length,
    },
    recentJobs: recent,
    activeJobs,
    latestErrors,
    latestRejected,
    latestDuplicates,
    latestFiles: recent.slice(0, 10).map((j) => ({
      id: j.id,
      filename: j.filename,
      type: j.type,
      status: j.status,
      startedAt: j.startedAt,
    })),
  };
}
