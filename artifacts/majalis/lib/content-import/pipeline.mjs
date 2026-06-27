import { createHash } from "node:crypto";
import { MAX_FILE_BYTES, MAX_ROWS, PREVIEW_ROWS, validateColumns } from "./column-schemas.mjs";
import { parseContentString } from "./parsers.mjs";
import { validateRow, validateFileRows } from "./validators.mjs";
import { dedupeRows } from "./dedupe.mjs";
import { mapRowToPayload } from "./mappers.mjs";
import { resolveContentType } from "./registry.mjs";
import { importBatchToSupabase } from "./batch-importer.mjs";
import { createJob, updateJob, listJobs, getJob } from "./job-store.mjs";
import { rollbackJob } from "./rollback.mjs";

export { PREVIEW_ROWS, MAX_ROWS, MAX_FILE_BYTES };

function isValidUtf8(text) {
  if (!text) return false;
  try {
    const encoded = new TextEncoder().encode(text);
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(encoded);
    return decoded.length > 0;
  } catch {
    return false;
  }
}

function fileHash(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/**
 * Full file validation + preview (no DB writes).
 */
export function validateImportPayload({ type, content, filename, fileSizeBytes, rows: preParsedRows }) {
  const def = resolveContentType(type);
  if (!def) {
    return { ok: false, error: "invalid_type", userMessage: "Unsupported content type.", errors: [`Unknown type: ${type}`] };
  }

  if (fileSizeBytes && fileSizeBytes > MAX_FILE_BYTES) {
    return { ok: false, error: "file_too_large", userMessage: "The uploaded file exceeds the maximum allowed size." };
  }

  let rows;
  if (Array.isArray(preParsedRows)) {
    rows = preParsedRows;
  } else {
    if (!isValidUtf8(content)) {
      return { ok: false, error: "invalid_encoding", userMessage: "CSV encoding is invalid." };
    }
    try {
      rows = parseContentString(content, filename);
    } catch (err) {
      return { ok: false, error: "invalid_csv", userMessage: "Invalid CSV structure.", reason: err.message };
    }
  }

  if (rows.length > MAX_ROWS) {
    return { ok: false, error: "too_many_rows", userMessage: "The file exceeds the maximum row limit (100,000)." };
  }

  const headers = rows.length ? Object.keys(rows[0]) : [];
  const colCheck = validateColumns(def.type, headers);
  const fileValidation = validateFileRows(def.type, rows);

  const validationErrors = [...fileValidation.errors];
  if (!colCheck.ok) {
    if (colCheck.missing.length) validationErrors.push(`Missing columns: ${colCheck.missing.join(", ")}`);
    if (colCheck.extra.length) validationErrors.push(`Extra columns: ${colCheck.extra.join(", ")}`);
  }

  const preview = rows.slice(0, PREVIEW_ROWS).map((row, i) => {
    const v = validateRow(def.type, row, i);
    return { row, valid: v.ok, errors: v.errors };
  });

  const { unique, duplicates } = dedupeRows(rows, def.type);

  return {
    ok: validationErrors.length === 0,
    type: def.type,
    label: def.label,
    filename,
    fileHash: fileHash(content),
    stats: {
      total: rows.length,
      valid: fileValidation.validCount,
      invalid: fileValidation.invalidCount,
      duplicatesInFile: duplicates.length,
      unique: unique.length,
    },
    columns: colCheck,
    validationErrors: validationErrors.slice(0, 100),
    preview,
    rowsReady: unique,
  };
}

export async function startImportJob({ userId, role, type, filename, fileSizeBytes, totalRows, columnHeaders }) {
  return createJob({
    userId,
    role,
    contentType: type,
    filename,
    fileSizeBytes,
    totalRows,
    columnHeaders,
  });
}

export async function runImportBatch({
  jobId,
  type,
  rows,
  batchIndex,
  totalBatches,
  userId,
  dryRun = false,
}) {
  const def = resolveContentType(type);
  if (!def) throw new Error(`Unknown type: ${type}`);

  const job = jobId ? await getJob(jobId) : null;
  if (jobId && !job) throw new Error("Job not found");

  const started = Date.now();
  const progressPct = Math.min(99, Math.round(((batchIndex + 1) / totalBatches) * 100));

  if (jobId) {
    await updateJob(jobId, {
      status: "importing",
      progress_stage: "importing",
      progress_pct: progressPct,
    });
  }

  const validationErrors = [];
  const validRows = [];
  rows.forEach((row, index) => {
    const result = validateRow(def.type, row, index);
    if (result.ok) validRows.push(row);
    else validationErrors.push(...result.errors);
  });

  if (validationErrors.length > 0) {
    if (jobId) {
      await updateJob(jobId, {
        status: "failed",
        failed_count: (job?.failed_count || 0) + rows.length,
        progress_stage: "validation_failed",
        error_summary: validationErrors[0],
        errors: validationErrors.slice(0, 50),
        completed_at: new Date().toISOString(),
      });
      await rollbackJob(jobId);
    }
    return { ok: false, validationErrors, rolledBack: Boolean(jobId) };
  }

  const { unique } = dedupeRows(validRows, def.type);
  const payloads = unique.map((row) => mapRowToPayload(def.type, row));

  let importResult;
  try {
    importResult = await importBatchToSupabase(def.type, payloads, {
      dryRun,
      jobId,
      batchIndex,
    });
  } catch (err) {
    if (jobId) {
      await updateJob(jobId, {
        status: "failed",
        progress_stage: "import_failed",
        error_summary: err.message,
        completed_at: new Date().toISOString(),
      });
      await rollbackJob(jobId);
    }
    throw err;
  }

  if (importResult.failed > 0 && jobId) {
    await updateJob(jobId, {
      status: "failed",
      progress_stage: "import_failed",
      error_summary: importResult.errors[0] || "Import batch failed",
      errors: importResult.errors.slice(0, 50),
      completed_at: new Date().toISOString(),
    });
    await rollbackJob(jobId);
    return { ok: false, ...importResult, rolledBack: true };
  }

  if (jobId) {
    const prevImported = job?.imported_count || 0;
    const prevSkipped = job?.skipped_count || 0;
    await updateJob(jobId, {
      imported_count: prevImported + (importResult.imported || 0),
      skipped_count: prevSkipped + (importResult.skipped || 0),
      progress_pct: progressPct,
      progress_stage: batchIndex + 1 >= totalBatches ? "done" : "importing",
      status: batchIndex + 1 >= totalBatches ? "completed" : "importing",
      completed_at: batchIndex + 1 >= totalBatches ? new Date().toISOString() : null,
      duration_ms: batchIndex + 1 >= totalBatches ? Date.now() - new Date(job.started_at).getTime() : null,
    });
  }

  return {
    ok: true,
    batchIndex,
    totalBatches,
    progressPct,
    durationMs: Date.now() - started,
    ...importResult,
  };
}

export async function getImportHistory(limit = 30) {
  return listJobs(limit);
}

export { rollbackJob };
