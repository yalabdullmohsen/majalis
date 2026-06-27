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
    if (result.ok) validRows.push(rows[index]);
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

  onProgress({ phase: "validating", processed: 0, total: rows.length, pct: 0 });

  const { validRows, validationErrors, allValid } = validateAllRows(def.type, rows);

  if (!allValid) {
    return {
      ok: false,
      type: def.type,
      label: def.label,
      dryRun: Boolean(opts.dryRun),
      file: opts.source || "inline",
      duration_ms: Date.now() - started,
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

  onProgress({ phase: "importing", processed: 0, total: payloads.length, pct: 5 });

  const importReport = await bulkImportToSupabase(def.type, payloads, {
    dryRun: opts.dryRun,
    onProgress: (p) => {
      const pct = payloads.length ? Math.min(99, 5 + Math.round((p.processed / payloads.length) * 94)) : 100;
      onProgress({ phase: "importing", ...p, pct });
    },
  });

  onProgress({ phase: "done", processed: payloads.length, total: payloads.length, pct: 100 });

  const ok =
    (importReport.failed ?? 0) === 0 &&
    (importReport.errors?.length ?? 0) === 0 &&
    importReport.ok !== false;

  return {
    ok,
    type: def.type,
    label: def.label,
    dryRun: Boolean(opts.dryRun),
    file: opts.source || "inline",
    duration_ms: Date.now() - started,
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
    return { ok: false, error: `unsupported_type: ${type}` };
  }
  const job = await createImportJob({
    type: def.type,
    filename,
    totalRows: totalRows || 0,
    createdBy,
  });
  return { ok: true, jobId: job.id, type: def.type, label: def.label };
}

export async function stageImportBatch(jobId, rows, startIndex) {
  const job = await getImportJob(jobId);
  if (!job) return { ok: false, error: "job_not_found" };
  if (job.status === "completed" || job.status === "failed") {
    return { ok: false, error: "job_closed" };
  }

  const staged = await stageImportRows(jobId, rows, startIndex);
  if (!staged.ok) return { ok: false, error: staged.error || "stage_failed" };

  const processed = (job.processed_rows || 0) + rows.length;
  const total = Math.max(job.total_rows || 0, processed);
  const pct = total ? Math.round((processed / total) * 40) : 0;

  await updateImportJob(jobId, {
    status: "staging",
    processed_rows: processed,
    total_rows: total,
    progress_pct: pct,
  });

  return { ok: true, staged: rows.length, processed, total };
}

/**
 * Validate staged rows and bulk-import inside a Postgres transaction.
 */
export async function commitImportJob(jobId, opts = {}) {
  const job = await getImportJob(jobId);
  if (!job) return { ok: false, error: "job_not_found" };

  const def = resolveContentType(job.type);
  if (!def) return { ok: false, error: "unsupported_type" };

  await updateImportJob(jobId, { status: "validating", progress_pct: 42 });

  const rows = await loadStagedPayloads(jobId);
  if (!rows.length) {
    await updateImportJob(jobId, {
      status: "failed",
      import_errors: ["لا توجد صفوف للاستيراد"],
      completed_at: new Date().toISOString(),
    });
    return { ok: false, error: "empty_job" };
  }

  const report = await runContentImportRows({
    type: def.type,
    rows,
    dryRun: opts.dryRun,
    source: job.filename || jobId,
    onProgress: async (p) => {
      await updateImportJob(jobId, {
        status: p.phase === "validating" ? "validating" : "importing",
        processed_rows: p.processed ?? job.processed_rows,
        total_rows: p.total ?? rows.length,
        progress_pct: Math.max(42, p.pct ?? 0),
      });
    },
  });

  await updateImportJob(jobId, {
    status: report.ok ? "completed" : "failed",
    processed_rows: rows.length,
    total_rows: rows.length,
    imported: report.stats?.imported ?? 0,
    skipped: report.stats?.skipped ?? 0,
    failed: report.stats?.failed ?? 0,
    progress_pct: 100,
    validation_errors: report.validationErrors || [],
    import_errors: report.importErrors || [],
    report,
    completed_at: new Date().toISOString(),
  });

  if (report.ok && !opts.dryRun) {
    await clearStaging(jobId);
  }

  return { ok: report.ok, jobId, report };
}

export async function getImportJobProgress(jobId) {
  const job = await getImportJob(jobId);
  if (!job) return { ok: false, error: "job_not_found" };
  return {
    ok: true,
    job: {
      id: job.id,
      type: job.type,
      status: job.status,
      filename: job.filename,
      total_rows: job.total_rows,
      processed_rows: job.processed_rows,
      imported: job.imported,
      skipped: job.skipped,
      failed: job.failed,
      progress_pct: job.progress_pct,
      validation_errors: job.validation_errors || [],
      import_errors: job.import_errors || [],
      completed_at: job.completed_at,
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
