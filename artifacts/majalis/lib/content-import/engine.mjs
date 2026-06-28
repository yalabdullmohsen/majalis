import { resolveContentType, TYPE_REGISTRY } from "./registry.mjs";
import { validateRow, MAX_VALIDATION_ERRORS } from "./validators.mjs";
import { parseContentFile, parseContentString } from "./parsers.mjs";
import { dedupeRows } from "./dedupe.mjs";
import { mapRowToPayload } from "./mappers.mjs";
import { bulkImportToSupabase } from "./bulk-importer.mjs";
import {
  createImportJob,
  updateImportJob,
  getImportJob,
  stageImportRows,
  loadStagedPayloads,
  clearStaging,
  tryAcquireProcessingLock,
  releaseProcessingLock,
  listQueuedImportJobs,
  runImportJobWatchdog,
  jobLog,
  TERMINAL_JOB_STATUSES,
} from "./import-jobs.mjs";

const UPLOAD_BATCH_SIZE = 2000;

/**
 * Validate rows in memory. Fails entire import if any row is invalid.
 * @param {string} type
 * @param {Record<string, unknown>[]} rows
 */
export function validateAllRows(type, rows) {
  const validationErrors = [];
  const validRows = [];

  for (let index = 0; index < rows.length; index++) {
    const result = validateRow(type, rows[index], index);
    if (result.ok) validRows.push(result.row ?? rows[index]);
    else {
      for (const err of result.errors) {
        if (validationErrors.length < MAX_VALIDATION_ERRORS) validationErrors.push(err);
      }
    }
  }

  return { validRows, validationErrors, allValid: validationErrors.length === 0 };
}

/**
 * @param {{ type: string, rows: Record<string, unknown>[], dryRun?: boolean, source?: string, onProgress?: (p: object) => void }} opts
 */
export async function runContentImportRows(opts) {
  const def = resolveContentType(opts.type);
  if (!def) {
    return {
      ok: false,
      type: opts.type,
      errors: [`نوع محتوى غير مدعوم: ${opts.type}`, `الأنواع المتاحة: ${Object.keys(TYPE_REGISTRY).join(", ")}`],
    };
  }

  const started = Date.now();
  const rows = opts.rows || [];
  const onProgress = opts.onProgress || (() => {});

  onProgress({ phase: "validating", processed: 0, total: rows.length, pct: 45 });

  const validationStarted = Date.now();
  const { validRows, validationErrors, allValid } = validateAllRows(def.type, rows);
  const validation_ms = Date.now() - validationStarted;

  if (!allValid) {
    return {
      ok: false,
      type: def.type,
      label: def.label,
      dryRun: Boolean(opts.dryRun),
      file: opts.source || "inline",
      duration_ms: Date.now() - started,
      timings: { validation_ms, total_ms: Date.now() - started },
      stats: {
        read: rows.length,
        valid: validRows.length,
        invalid: rows.length - validRows.length,
        duplicates_in_file: 0,
        imported: 0,
        skipped: 0,
        failed: 0,
      },
      validationErrors,
      importErrors: ["تم إلغاء الاستيراد — أصلح أخطاء التحقق ثم أعد المحاولة"],
      rolledBack: true,
    };
  }

  const { unique, duplicates } = dedupeRows(validRows, def.type);
  const payloads = unique.map((row) => mapRowToPayload(def.type, row));

  onProgress({ phase: "importing", processed: 0, total: payloads.length, pct: 50 });

  const databaseStarted = Date.now();
  const importReport = await bulkImportToSupabase(def.type, payloads, {
    dryRun: opts.dryRun,
    onProgress: (p) => {
      const pct = payloads.length ? Math.min(99, 50 + Math.round((p.processed / payloads.length) * 49)) : 100;
      onProgress({ phase: "importing", ...p, pct });
    },
  });
  const database_ms = Date.now() - databaseStarted;

  onProgress({ phase: "completed", processed: payloads.length, total: payloads.length, pct: 100 });

  const ok =
    (importReport.failed ?? 0) === 0 &&
    (importReport.errors?.length ?? 0) === 0 &&
    importReport.ok !== false;

  const total_ms = Date.now() - started;

  return {
    ok,
    type: def.type,
    label: def.label,
    dryRun: Boolean(opts.dryRun),
    file: opts.source || "inline",
    duration_ms: total_ms,
    timings: { validation_ms, database_ms, total_ms },
    stats: {
      read: rows.length,
      valid: validRows.length,
      invalid: 0,
      duplicates_in_file: duplicates.length,
      imported: importReport.imported ?? 0,
      skipped: importReport.skipped ?? 0,
      failed: importReport.failed ?? 0,
    },
    validationErrors: [],
    importErrors: importReport.errors || [],
    rolledBack: Boolean(importReport.rolledBack),
  };
}

/**
 * CLI-only: reads file from local disk then imports in memory.
 * @param {{ type: string, filePath: string, dryRun?: boolean }} opts
 */
export async function runContentImport(opts) {
  let rows;
  try {
    rows = parseContentFile(opts.filePath);
  } catch (err) {
    return {
      ok: false,
      type: opts.type,
      errors: [`تعذر قراءة الملف: ${err.message}`],
    };
  }
  return runContentImportRows({
    type: opts.type,
    rows,
    dryRun: opts.dryRun,
    source: opts.filePath,
  });
}

/** @deprecated use runContentImportRows — kept for API string uploads */
export async function runContentImportFromString(opts) {
  let rows;
  try {
    rows = parseContentString(opts.content, opts.filename || "upload.json");
  } catch (err) {
    return {
      ok: false,
      type: opts.type,
      errors: [`تعذر تحليل المحتوى: ${err.message}`],
    };
  }
  return runContentImportRows({
    type: opts.type,
    rows,
    dryRun: opts.dryRun,
    source: opts.filename,
  });
}

/**
 * Start a batched import job (for large uploads from admin UI).
 */
export async function startImportJob({ type, filename, totalRows, createdBy }) {
  const def = resolveContentType(type);
  if (!def) {
    return { ok: false, error: `unsupported_type: ${type}`, code: "unsupported_type" };
  }
  const created = await createImportJob({
    type: def.type,
    filename,
    totalRows: totalRows || 0,
    createdBy,
  });
  if (!created.ok) {
    return {
      ok: false,
      error: created.error || "job_create_failed",
      code: created.code || "job_create_failed",
    };
  }
  return {
    ok: true,
    jobId: created.id,
    type: def.type,
    label: def.label,
    persisted: created.persisted,
    via: created.via,
  };
}

export async function stageImportBatch(jobId, rows, startIndex) {
  const job = await getImportJob(jobId);
  if (!job) return { ok: false, error: "job_not_found" };
  if (job.status === "completed" || job.status === "failed") {
    return { ok: false, error: "job_closed" };
  }

  const staged = await stageImportRows(jobId, rows, startIndex);
  if (!staged.ok) {
    return {
      ok: false,
      error: staged.error || "stage_failed",
      code: staged.code || "stage_failed",
    };
  }

  const processed = (job.processed_rows || 0) + rows.length;
  const total = Math.max(job.total_rows || 0, processed);
  const pct = total ? Math.round((processed / total) * 40) : 0;

  await updateImportJob(jobId, {
    status: "uploading",
    phase: "uploading",
    processed_rows: processed,
    total_rows: total,
    progress_pct: pct,
  });

  return { ok: true, staged: rows.length, processed, total };
}

/**
 * Queue a staged job for background processing — returns immediately.
 * @param {string} jobId
 * @param {object} [opts]
 */
export async function queueImportJob(jobId, opts = {}) {
  const job = await getImportJob(jobId);
  if (!job) return { ok: false, error: "job_not_found" };

  if (job.status === "completed") return { ok: true, jobId, status: "completed", alreadyDone: true };
  if (job.status === "failed") return { ok: false, error: "job_failed", jobId };
  if (job.status === "queued" || job.status === "processing" || job.status === "validating" || job.status === "importing") {
    return { ok: true, jobId, status: job.status, alreadyQueued: true };
  }

  const rowCount = job.total_rows || job.processed_rows || 0;
  if (!rowCount && !job.processed_rows) {
    const staged = await loadStagedPayloads(jobId);
    if (!staged.length) {
      await updateImportJob(jobId, {
        status: "failed",
        phase: "failed",
        import_errors: ["لا توجد صفوف للاستيراد"],
        completed_at: new Date().toISOString(),
      });
      return { ok: false, error: "empty_job" };
    }
  }

  await updateImportJob(jobId, {
    status: "queued",
    phase: "queued",
    progress_pct: Math.max(job.progress_pct || 0, 42),
    execution_mode: opts.executionMode || "background",
  });

  return { ok: true, jobId, status: "queued" };
}

/**
 * Process a queued import job in the background (validate + transactional import).
 * @param {string} jobId
 * @param {object} [opts]
 */
export async function processImportJob(jobId, opts = {}) {
  if (!tryAcquireProcessingLock(jobId)) {
    jobLog(jobId, "process_skipped", { reason: "already_processing" });
    return { ok: true, jobId, skipped: true, reason: "already_processing" };
  }

  const totalStarted = Date.now();

  try {
    const job = await getImportJob(jobId);
    if (!job) {
      jobLog(jobId, "process_aborted", { reason: "job_not_found" });
      return { ok: false, error: "job_not_found" };
    }

    if (job.status === "completed") return { ok: true, jobId, status: "completed" };
    if (job.status === "cancelled") return { ok: false, jobId, status: "cancelled" };
    if (job.status === "failed" && !opts.force) return { ok: false, jobId, status: "failed" };

    const def = resolveContentType(job.type);
    if (!def) {
      await updateImportJob(jobId, {
        status: "failed",
        phase: "failed",
        import_errors: [`unsupported_type: ${job.type}`],
        completed_at: new Date().toISOString(),
      });
      jobLog(jobId, "process_failed", { reason: "unsupported_type", type: job.type });
      return { ok: false, error: "unsupported_type" };
    }

    jobLog(jobId, "process_start", {
      type: job.type,
      filename: job.filename,
      total_rows: job.total_rows,
      previous_status: job.status,
      previous_phase: job.phase,
    });

    await updateImportJob(jobId, {
      status: "processing",
      phase: "parsing",
      progress_pct: 43,
    });

    const parseStarted = Date.now();
    const rows = await loadStagedPayloads(jobId);
    const parse_ms = Date.now() - parseStarted;
    jobLog(jobId, "rows_loaded", { rows_parsed: rows.length, parse_ms });

    if (!rows.length) {
      await updateImportJob(jobId, {
        status: "failed",
        phase: "failed",
        import_errors: ["لا توجد صفوف للاستيراد — تأكد من اكتمال رفع الدفعات قبل commit"],
        timings: { parse_ms, total_ms: Date.now() - totalStarted },
        completed_at: new Date().toISOString(),
      });
      jobLog(jobId, "process_failed", { reason: "empty_job", rows_staged: 0 });
      return { ok: false, error: "empty_job" };
    }

    await updateImportJob(jobId, {
      status: "validating",
      phase: "validating",
      total_rows: rows.length,
      processed_rows: rows.length,
      progress_pct: 50,
    });

    const report = await runContentImportRows({
      type: def.type,
      rows,
      dryRun: opts.dryRun,
      source: job.filename || jobId,
      onProgress: async (p) => {
        const pct =
          p.phase === "importing" && p.total
            ? Math.min(99, 50 + Math.round(((p.processed || 0) / p.total) * 49))
            : p.phase === "validating"
              ? 50
              : Math.max(50, p.pct ?? 50);
        await updateImportJob(jobId, {
          status: p.phase === "importing" ? "importing" : "validating",
          phase: p.phase === "completed" ? "importing" : p.phase || "validating",
          processed_rows: p.processed ?? rows.length,
          total_rows: p.total ?? rows.length,
          progress_pct: pct,
        });
        jobLog(jobId, "phase_progress", {
          phase: p.phase,
          processed: p.processed,
          total: p.total,
          progress_pct: pct,
        });
      },
    });

    const timings = {
      parse_ms,
      validation_ms: report.timings?.validation_ms ?? 0,
      database_ms: report.timings?.database_ms ?? 0,
      total_ms: Date.now() - totalStarted,
    };

    const finalStatus = report.ok ? "completed" : "failed";
    jobLog(jobId, "process_finished", {
      ok: report.ok,
      rows_parsed: rows.length,
      rows_committed: report.stats?.imported ?? 0,
      rows_skipped: report.stats?.skipped ?? 0,
      rows_failed: report.stats?.failed ?? 0,
      phase: finalStatus,
      ...timings,
      errors: report.importErrors?.slice(0, 5),
    });

    await updateImportJob(jobId, {
      status: finalStatus,
      phase: finalStatus,
      processed_rows: rows.length,
      total_rows: rows.length,
      imported: report.stats?.imported ?? 0,
      skipped: report.stats?.skipped ?? 0,
      failed: report.stats?.failed ?? 0,
      progress_pct: 100,
      validation_errors: report.validationErrors || [],
      import_errors: report.importErrors || [],
      report,
      timings,
      completed_at: new Date().toISOString(),
    });

    await clearStaging(jobId);

    return { ok: report.ok, jobId, report, timings, status: finalStatus };
  } catch (err) {
    jobLog(jobId, "process_fatal", {
      error: String(err.message || err),
      stack: err?.stack?.split("\n").slice(0, 5).join(" | "),
    });
    console.error(`[content-import:${jobId}] fatal error`, err);
    await updateImportJob(jobId, {
      status: "failed",
      phase: "failed",
      import_errors: [String(err.message || err)],
      timings: { total_ms: Date.now() - totalStarted },
      completed_at: new Date().toISOString(),
    }).catch(() => {});
    return { ok: false, jobId, error: String(err.message || err), status: "failed" };
  } finally {
    releaseProcessingLock(jobId);
  }
}

/**
 * Process all queued import jobs (cron / worker fallback).
 */
export async function processQueuedImportJobs(limit = 3) {
  await runImportJobWatchdog();
  const jobs = await listQueuedImportJobs(limit);
  const results = [];
  for (const job of jobs) {
    results.push(await processImportJob(job.id));
  }
  return { ok: true, processed: results.length, results };
}

export { runImportJobWatchdog, TERMINAL_JOB_STATUSES };

/**
 * @deprecated Use queueImportJob + processImportJob — kept for CLI compatibility.
 */
export async function commitImportJob(jobId, opts = {}) {
  const queued = await queueImportJob(jobId, opts);
  if (!queued.ok) return queued;
  return processImportJob(jobId, opts);
}

export async function getImportJobProgress(jobId) {
  await runImportJobWatchdog();
  const job = await getImportJob(jobId);
  if (!job) return { ok: false, error: "job_not_found" };
  const terminal = TERMINAL_JOB_STATUSES.has(job.status);
  return {
    ok: true,
    terminal,
    job: {
      id: job.id,
      type: job.type,
      status: job.status,
      phase: job.phase || job.status,
      filename: job.filename,
      total_rows: job.total_rows,
      processed_rows: job.processed_rows,
      imported: job.imported,
      skipped: job.skipped,
      failed: job.failed,
      progress_pct: job.progress_pct,
      validation_errors: job.validation_errors || [],
      import_errors: job.import_errors || [],
      timings: job.timings || null,
      report: job.report || null,
      completed_at: job.completed_at,
      updated_at: job.updated_at,
    },
  };
}

export { UPLOAD_BATCH_SIZE };

export function printImportReport(report) {
  console.log("\n══════════════════════════════════════════");
  console.log(`  Content Import — ${report.label || report.type}`);
  console.log("══════════════════════════════════════════");
  console.log(`الملف: ${report.file}`);
  console.log(`${report.dryRun ? "(dry-run)" : ""}`);
  console.log(`مدة التنفيذ: ${report.duration_ms}ms`);
  console.log("──────────────────────────────────────────");
  console.log(`قرئ: ${report.stats.read}`);
  console.log(`صالح: ${report.stats.valid}`);
  console.log(`مرفوض (تحقق): ${report.stats.invalid}`);
  console.log(`مكرر في الملف: ${report.stats.duplicates_in_file}`);
  console.log(`استورد: ${report.stats.imported}`);
  console.log(`تخطى (موجود): ${report.stats.skipped}`);
  console.log(`فشل: ${report.stats.failed}`);
  if (report.validationErrors?.length) {
    console.log("\n⚠ أخطاء التحقق:");
    report.validationErrors.forEach((e) => console.log(`  • ${e}`));
  }
  if (report.importErrors?.length) {
    console.log("\n⚠ أخطاء الاستيراد:");
    report.importErrors.forEach((e) => console.log(`  • ${e}`));
  }
  console.log(`\n${report.ok ? "✓ نجح الاستيراد" : "✗ اكتمل مع أخطاء"}\n`);
}
