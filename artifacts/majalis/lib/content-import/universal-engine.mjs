/**
 * Universal Import Engine — single entry point for all content types.
 * Configuration-driven: content type selects schema, aliases, and target table.
 */

import { buildImportPreview } from "./preview.mjs";
import { parseUniversalFile } from "./universal-csv-parser.mjs";
import { validateAllRowsWithSchema } from "./schema-validator.mjs";
import { formatImportSummary } from "./error-reporter.mjs";
import { resolveImportBatchSize, resolveUploadBatchSize } from "./batch-size.mjs";
import { resolveContentType, CONTENT_TYPES } from "./registry.mjs";
import { listContentSchemas } from "./schema-loader.mjs";
import {
  runContentImportRows,
  startImportJob,
  stageImportBatch,
  queueImportJob,
  processImportJob,
  getImportJobProgress,
  retryImportJob,
  UPLOAD_BATCH_SIZE,
} from "./engine.mjs";
import { cancelImportJob } from "./import-jobs.mjs";
import { scheduleImportProcessing, triggerImportWorkerFetch } from "./import-worker.mjs";
import { buildImportCenterStats } from "./import-center.mjs";

export const UniversalImportEngine = {
  CONTENT_TYPES,
  listSchemas: listContentSchemas,
  resolveType: resolveContentType,
  parseFile: parseUniversalFile,
  preview: buildImportPreview,
  validate: validateAllRowsWithSchema,
  resolveBatchSize: resolveImportBatchSize,
  resolveUploadBatchSize,
  runRows: runContentImportRows,
  startJob: startImportJob,
  stageBatch: stageImportBatch,
  queueJob: queueImportJob,
  processJob: processImportJob,
  getProgress: getImportJobProgress,
  getResult: getImportJobResult,
  cancelJob: cancelImportJob,
  retryJob: retryImportJob,
  getDashboard: buildImportCenterStats,
  formatSummary: formatImportSummary,
};

export async function getImportJobResult(jobId) {
  const progress = await getImportJobProgress(jobId);
  if (!progress.ok) return progress;

  const job = progress.job;
  const def = resolveContentType(job.type);
  const summary = formatImportSummary({
    ok: job.status === "completed",
    jobId: job.id,
    contentType: job.type,
    targetTable: def?.table,
    stats: job.report?.stats || {
      read: job.total_rows,
      imported: job.imported,
      skipped: job.skipped,
      failed: job.failed,
      invalid: job.validation_errors?.length || 0,
    },
    durationMs: job.timings?.total_ms,
    timings: job.timings,
    warnings: job.report?.importErrors?.slice(0, 5) || [],
    validationErrors: job.validation_errors || [],
    importErrors: job.import_errors || [],
    structuredErrors: job.report?.structuredErrors || [],
  });

  return { ok: true, terminal: progress.terminal, job, summary };
}

/**
 * Start import from in-memory content — preview gate + job creation.
 * @param {object} opts
 */
export async function startUniversalImport(opts) {
  const preview = buildImportPreview({
    type: opts.type,
    content: opts.content,
    filename: opts.filename,
  });

  if (!preview.ok) {
    return { ok: false, code: "preview_failed", error: preview.error, preview };
  }

  if (!preview.canImport && !opts.force) {
    return {
      ok: false,
      code: "preview_blocked",
      error: "فشل فحص الملف — أصلح الأخطاء قبل الاستيراد",
      preview,
      structuredErrors: preview.structuredErrors,
    };
  }

  const parsed = parseUniversalFile(opts.content, opts.filename || "upload.csv");
  const allRows = parsed.rows || [];

  const started = await startImportJob({
    type: opts.type,
    filename: opts.filename || "upload.csv",
    totalRows: allRows.length,
    createdBy: opts.createdBy || null,
  });

  if (!started.ok) {
    return { ok: false, code: started.code || "job_create_failed", error: started.error, preview };
  }

  return {
    ok: true,
    jobId: started.jobId,
    preview,
    totalRows: allRows.length,
    uploadBatchSize: resolveUploadBatchSize(allRows.length),
    importBatchSize: preview.batchSize,
    targetTable: preview.targetTable,
    normalizedType: started.type,
  };
}

/**
 * Commit job to background worker — returns immediately.
 * @param {string} jobId
 * @param {object} [opts]
 */
export async function commitUniversalImport(jobId, opts = {}) {
  const queued = await queueImportJob(jobId, { executionMode: "background" });
  if (!queued.ok) return queued;
  if (queued.alreadyDone) return { ok: true, jobId, status: "completed", alreadyDone: true };

  if (opts.res) {
    scheduleImportProcessing(opts.res, jobId, { dryRun: opts.dryRun });
  }
  if (opts.authHeader) {
    void triggerImportWorkerFetch(jobId, opts.authHeader);
  }

  return { ok: true, jobId, status: "queued", async: true };
}

export {
  buildImportPreview,
  parseUniversalFile,
  validateAllRowsWithSchema,
  formatImportSummary,
  UPLOAD_BATCH_SIZE,
};
