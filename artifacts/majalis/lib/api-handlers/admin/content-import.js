import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { mapImportError, apiErrorResponse } from "../../../lib/content-import/errors.mjs";
import { listContentTypesForApi } from "../../../lib/content-import/registry.mjs";
import {
  validateImportPayload,
  startImportJob,
  runImportBatch,
  getImportHistory,
  rollbackJob,
  PREVIEW_ROWS,
  MAX_ROWS,
} from "../../../lib/content-import/pipeline.mjs";
import { BATCH_SIZE } from "../../../lib/content-import/column-schemas.mjs";
import { runPhase2TrialImport } from "../../../lib/content-import/phase2-trial.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "../../..");

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { requireImport: true });
  if (!auth) return;

  const action = String(req.query?.action || req.body?.action || "types").trim();

  try {
    if (req.method === "GET" && action === "types") {
      return sendJson(res, 200, { ok: true, types: listContentTypesForApi(), previewRows: PREVIEW_ROWS, maxRows: MAX_ROWS, batchSize: BATCH_SIZE });
    }

    if (req.method === "GET" && action === "history") {
      const history = await getImportHistory(Number(req.query?.limit) || 30);
      return sendJson(res, 200, { ok: true, history });
    }

    if (req.method !== "POST") {
      return sendJson(res, 405, { ok: false, userMessage: "Method not allowed.", error: "method_not_allowed" });
    }

    const body = req.body || {};

    if (action === "phase2-trial") {
      const result = await runPhase2TrialImport(APP_ROOT, { dryRun: body.dryRun === true });
      return sendJson(res, result.ok ? 200 : 422, { ok: result.ok, ...result });
    }

    if (action === "validate") {
      const type = String(body.type || "").trim();
      const content = typeof body.content === "string" ? body.content : "";
      const filename = body.filename || "upload.csv";
      const fileSizeBytes = body.fileSizeBytes || content.length;
      const rows = Array.isArray(body.rows) ? body.rows : undefined;
      const result = validateImportPayload({ type, content, filename, fileSizeBytes, rows });
      if (!result.ok) {
        const mapped = mapImportError(result.error || result.reason, result.userMessage);
        return sendJson(res, 422, { ok: false, ...mapped, validation: result });
      }
      return sendJson(res, 200, { ok: true, validation: result });
    }

    if (action === "start") {
      const type = String(body.type || "").trim();
      const filename = body.filename || "upload.csv";
      const totalRows = Number(body.totalRows) || 0;
      const columnHeaders = body.columnHeaders || [];
      const fileSizeBytes = body.fileSizeBytes || 0;
      const job = await startImportJob({
        userId: auth.userId,
        role: auth.role,
        type,
        filename,
        totalRows,
        columnHeaders,
        fileSizeBytes,
      });
      await import("../../../lib/content-import/job-store.mjs").then(({ updateJob }) =>
        updateJob(job.id, { status: "importing", progress_stage: "ready", progress_pct: 0 }),
      );
      return sendJson(res, 200, { ok: true, jobId: job.id, job });
    }

    if (action === "batch") {
      const type = String(body.type || "").trim();
      const jobId = body.jobId;
      const rows = Array.isArray(body.rows) ? body.rows : [];
      const batchIndex = Number(body.batchIndex) || 0;
      const totalBatches = Number(body.totalBatches) || 1;
      const dryRun = body.dryRun === true;

      const result = await runImportBatch({
        jobId,
        type,
        rows,
        batchIndex,
        totalBatches,
        userId: auth.userId,
        dryRun,
      });

      if (!result.ok) {
        const mapped = mapImportError(result.validationErrors?.[0] || result.errors?.[0] || "import_failed");
        return sendJson(res, 422, {
          ok: false,
          ...mapped,
          rolledBack: result.rolledBack,
          report: result,
        });
      }

      return sendJson(res, 200, { ok: true, report: result });
    }

    if (action === "rollback") {
      const jobId = body.jobId || req.query?.jobId;
      if (!jobId) return sendJson(res, 400, { ok: false, userMessage: "Job ID required.", error: "missing_job_id" });
      const result = await rollbackJob(jobId);
      return sendJson(res, 200, { ok: true, ...result });
    }

    // Legacy single-shot import (small files)
    if (action === "import" || !action || action === "types") {
      const type = String(body.type || "").trim();
      if (Array.isArray(body.rows) && body.rows.length) {
        const totalBatches = Math.ceil(body.rows.length / BATCH_SIZE) || 1;
        const job = await startImportJob({
          userId: auth.userId,
          role: auth.role,
          type,
          filename: body.filename || "upload",
          totalRows: body.rows.length,
          columnHeaders: Object.keys(body.rows[0] || {}),
        });
        let lastReport = null;
        for (let b = 0; b < totalBatches; b++) {
          const slice = body.rows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
          lastReport = await runImportBatch({
            jobId: job.id,
            type,
            rows: slice,
            batchIndex: b,
            totalBatches,
            userId: auth.userId,
            dryRun: body.dryRun === true,
          });
          if (!lastReport.ok) {
            const mapped = mapImportError(lastReport.errors?.[0] || "import_failed");
            return sendJson(res, 422, { ok: false, ...mapped, jobId: job.id, report: lastReport, rolledBack: lastReport.rolledBack });
          }
        }
        return sendJson(res, 200, { ok: true, jobId: job.id, report: lastReport });
      }

      if (typeof body.content === "string" && body.content.trim()) {
        const validation = validateImportPayload({
          type,
          content: body.content,
          filename: body.filename || "upload.csv",
          fileSizeBytes: body.fileSizeBytes || body.content.length,
        });
        if (!validation.ok) {
          const mapped = mapImportError(validation.error || validation.reason);
          return sendJson(res, 422, { ok: false, ...mapped, validation });
        }
        const rows = validation.rowsReady || [];
        const totalBatches = Math.ceil(rows.length / BATCH_SIZE) || 1;
        const job = await startImportJob({
          userId: auth.userId,
          role: auth.role,
          type,
          filename: body.filename || "upload.csv",
          totalRows: rows.length,
          columnHeaders: validation.columns?.headers || [],
          fileSizeBytes: body.fileSizeBytes || body.content.length,
        });
        let lastReport = null;
        for (let b = 0; b < totalBatches; b++) {
          const slice = rows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
          lastReport = await runImportBatch({
            jobId: job.id,
            type,
            rows: slice,
            batchIndex: b,
            totalBatches,
            userId: auth.userId,
            dryRun: body.dryRun === true,
          });
          if (!lastReport.ok) {
            const mapped = mapImportError(lastReport.errors?.[0] || "import_failed");
            return sendJson(res, 422, { ok: false, ...mapped, jobId: job.id, report: lastReport, rolledBack: lastReport.rolledBack });
          }
        }
        return sendJson(res, 200, {
          ok: true,
          jobId: job.id,
          report: {
            ...lastReport,
            type,
            label: validation.label,
            stats: validation.stats,
            validationErrors: [],
            importErrors: lastReport.errors || [],
          },
        });
      }

      return sendJson(res, 400, { ok: false, userMessage: "No file content or rows provided.", error: "missing_content" });
    }

    return sendJson(res, 400, { ok: false, userMessage: "Unknown action.", error: "unknown_action" });
  } catch (err) {
    console.error("[admin/content-import]", err);
    const { status, body: errBody } = apiErrorResponse(err);
    sendJson(res, status, errBody);
  }
}
