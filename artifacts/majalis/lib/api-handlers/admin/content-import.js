import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  runContentImportRows,
  startImportJob,
  stageImportBatch,
  commitImportJob,
  getImportJobProgress,
  UPLOAD_BATCH_SIZE,
} from "../../../lib/content-import/engine.mjs";
import { runPhase2TrialImport } from "../../../lib/content-import/phase2-trial.mjs";
import { CONTENT_TYPES } from "../../../lib/content-import/registry.mjs";
import { parseContentString } from "../../../lib/content-import/parsers.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "../../..");

const INLINE_ROW_LIMIT = 5000;

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { requireImport: true });
  if (!auth) return;

  const body = req.method === "POST" ? req.body || {} : {};
  const query = req.query || {};
  const action = String(body.action || query.action || "import").trim();
  const dryRun = body.dryRun === true || query.dryRun === "1";

  if (req.method === "GET" && action === "progress") {
    const jobId = String(query.jobId || body.jobId || "").trim();
    if (!jobId) {
      sendJson(res, 400, { ok: false, error: "missing_job_id" });
      return;
    }
    const progress = await getImportJobProgress(jobId);
    sendJson(res, progress.ok ? 200 : 404, progress);
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  if (action === "types") {
    sendJson(res, 200, { ok: true, types: CONTENT_TYPES, uploadBatchSize: UPLOAD_BATCH_SIZE });
    return;
  }

  if (action === "phase2-trial") {
    try {
      const result = await runPhase2TrialImport(APP_ROOT, { dryRun });
      sendJson(res, result.ok ? 200 : 422, { ok: result.ok, ...result });
    } catch (err) {
      console.error("[admin/content-import:phase2-trial]", err);
      sendJson(res, 500, { ok: false, error: String(err.message || err) });
    }
    return;
  }

  if (action === "start") {
    const type = String(body.type || "").trim();
    const filename = String(body.filename || "upload").trim();
    const totalRows = Number(body.totalRows) || 0;
    if (!type) {
      sendJson(res, 400, { ok: false, error: "missing_type", types: CONTENT_TYPES });
      return;
    }
    const started = await startImportJob({
      type,
      filename,
      totalRows,
      createdBy: auth.userId || null,
    });
    sendJson(res, started.ok ? 200 : 400, started);
    return;
  }

  if (action === "stage") {
    const jobId = String(body.jobId || "").trim();
    const rows = body.rows;
    const startIndex = Number(body.startIndex) || 0;
    if (!jobId || !Array.isArray(rows)) {
      sendJson(res, 400, { ok: false, error: "missing_job_or_rows" });
      return;
    }
    const staged = await stageImportBatch(jobId, rows, startIndex);
    sendJson(res, staged.ok ? 200 : 422, staged);
    return;
  }

  if (action === "commit") {
    const jobId = String(body.jobId || "").trim();
    if (!jobId) {
      sendJson(res, 400, { ok: false, error: "missing_job_id" });
      return;
    }
    try {
      const result = await commitImportJob(jobId, { dryRun });
      sendJson(res, result.ok ? 200 : 422, result);
    } catch (err) {
      console.error("[admin/content-import:commit]", err);
      sendJson(res, 500, { ok: false, error: String(err.message || err) });
    }
    return;
  }

  if (action === "progress") {
    const jobId = String(body.jobId || "").trim();
    if (!jobId) {
      sendJson(res, 400, { ok: false, error: "missing_job_id" });
      return;
    }
    const progress = await getImportJobProgress(jobId);
    sendJson(res, progress.ok ? 200 : 404, progress);
    return;
  }

  const type = String(body.type || query.type || "").trim();
  if (!type) {
    sendJson(res, 400, { ok: false, error: "missing_type", types: CONTENT_TYPES });
    return;
  }

  try {
    let rows = Array.isArray(body.rows) ? body.rows : null;

    if (!rows && typeof body.content === "string" && body.content.trim()) {
      rows = parseContentString(body.content, body.filename || "upload.json");
    }

    if (!rows) {
      sendJson(res, 400, { ok: false, error: "missing_rows_or_content" });
      return;
    }

    if (rows.length > INLINE_ROW_LIMIT) {
      sendJson(res, 413, {
        ok: false,
        error: "payload_too_large",
        message: `Use batched import (action=start/stage/commit) for more than ${INLINE_ROW_LIMIT} rows`,
        uploadBatchSize: UPLOAD_BATCH_SIZE,
      });
      return;
    }

    const report = await runContentImportRows({
      type,
      rows,
      dryRun,
      source: body.filename || "admin-upload",
    });

    sendJson(res, report.ok ? 200 : 422, { ok: report.ok, report });
  } catch (err) {
    console.error("[admin/content-import]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
