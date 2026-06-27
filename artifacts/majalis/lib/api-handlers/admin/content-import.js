import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  startImportJob,
  stageImportBatch,
  queueImportJob,
  processImportJob,
  processQueuedImportJobs,
  getImportJobProgress,
  runImportJobWatchdog,
  UPLOAD_BATCH_SIZE,
} from "../../../lib/content-import/engine.mjs";
import {
  scheduleImportProcessing,
  triggerImportWorkerFetch,
  WORKER_SECRET,
  IMPORT_SYNC_ROW_THRESHOLD,
} from "../../../lib/content-import/import-worker.mjs";
import {
  recoverImportJobIntegrity,
  cancelImportJob,
  getImportJob,
  jobLog,
} from "../../../lib/content-import/import-jobs.mjs";
import { runPhase2TrialImport } from "../../../lib/content-import/phase2-trial.mjs";
import { CONTENT_TYPES, resolveContentType } from "../../../lib/content-import/registry.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "../../..");

function isImportWorkerRequest(req) {
  const header = req.headers?.["x-import-worker"] || req.headers?.["X-Import-Worker"];
  return WORKER_SECRET && header === WORKER_SECRET;
}

function isKickableStatus(status) {
  return ["queued", "processing", "parsing", "validating", "importing", "uploading"].includes(status);
}

async function respondWithProgress(res, jobId) {
  await runImportJobWatchdog();
  const progress = await getImportJobProgress(jobId);
  sendJson(res, progress.ok ? 200 : 404, progress);
}

export default async function handler(req, res) {
  const body = req.method === "POST" ? req.body || {} : {};
  const query = req.query || {};
  const action = String(body.action || query.action || "import").trim();
  const dryRun = body.dryRun === true || query.dryRun === "1";

  const workerBypass = action === "process" && isImportWorkerRequest(req);

  const auth = workerBypass
    ? { userId: "import-worker", role: "owner" }
    : await requireAdminAccess(req, res, sendJson, { requireImport: true });
  if (!auth) return;

  if (req.method === "GET" && action === "progress") {
    const jobId = String(query.jobId || body.jobId || "").trim();
    if (!jobId) {
      sendJson(res, 400, { ok: false, error: "missing_job_id" });
      return;
    }

    const kick = query.kick === "1" || body.kick === true;
    if (kick) {
      const snap = await getImportJobProgress(jobId);
      if (snap.ok && snap.job && isKickableStatus(snap.job.status)) {
        jobLog(jobId, "progress_kick", { status: snap.job.status, phase: snap.job.phase });
        void processImportJob(jobId, { dryRun }).catch((err) => {
          jobLog(jobId, "progress_kick_failed", { error: String(err.message || err) });
        });
      }
    }

    await respondWithProgress(res, jobId);
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
    const integrity = await recoverImportJobIntegrity();
    if (!integrity.ok) {
      console.error("[admin/content-import:start] integrity recovery failed", integrity);
      sendJson(res, 503, {
        ok: false,
        error: "import_schema_not_ready",
        code: "schema_not_ready",
        detail: integrity.error,
      });
      return;
    }
    const started = await startImportJob({
      type,
      filename,
      totalRows,
      createdBy: auth.userId || null,
    });
    const typeDef = resolveContentType(type);
    sendJson(res, started.ok ? 200 : 400, {
      ...started,
      targetTable: typeDef?.table || null,
    });
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

    const queued = await queueImportJob(jobId, { executionMode: "background" });
    if (!queued.ok) {
      sendJson(res, 422, queued);
      return;
    }

    if (queued.alreadyDone) {
      await respondWithProgress(res, jobId);
      return;
    }

    const job = await getImportJob(jobId);
    const rowCount = Math.max(job?.total_rows || 0, job?.processed_rows || 0);
    const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
    const typeDef = resolveContentType(job?.type);
    const targetTable = typeDef?.table || null;

    jobLog(jobId, "commit", {
      rowCount,
      sync_threshold: IMPORT_SYNC_ROW_THRESHOLD,
      execution: rowCount <= IMPORT_SYNC_ROW_THRESHOLD ? "sync" : "async",
      targetTable,
    });

    if (rowCount <= IMPORT_SYNC_ROW_THRESHOLD) {
      try {
        const result = await processImportJob(jobId, { dryRun });
        const status = result.status || (result.ok ? "completed" : "failed");
        sendJson(res, result.ok ? 200 : 422, {
          ok: result.ok,
          jobId,
          status,
          sync: true,
          targetTable,
          report: result.report || null,
          timings: result.timings || null,
          error: result.error || null,
        });
      } catch (err) {
        console.error("[admin/content-import:commit:sync]", err);
        sendJson(res, 500, { ok: false, jobId, error: String(err.message || err), status: "failed" });
      }
      return;
    }

    const mode = scheduleImportProcessing(res, jobId, { dryRun });
    void triggerImportWorkerFetch(jobId, authHeader);

    sendJson(res, 202, {
      ok: true,
      jobId,
      status: "queued",
      async: true,
      targetTable,
      execution: mode.mode,
    });
    return;
  }

  if (action === "cancel") {
    const jobId = String(body.jobId || "").trim();
    if (!jobId) {
      sendJson(res, 400, { ok: false, error: "missing_job_id" });
      return;
    }
    const cancelled = await cancelImportJob(jobId, body.reason || undefined);
    sendJson(res, 200, cancelled);
    return;
  }

  if (action === "process") {
    const jobId = String(body.jobId || "").trim();
    if (!jobId) {
      sendJson(res, 400, { ok: false, error: "missing_job_id" });
      return;
    }
    try {
      const result = await processImportJob(jobId, { dryRun });
      sendJson(res, result.ok ? 200 : 422, result);
    } catch (err) {
      console.error("[admin/content-import:process]", err);
      sendJson(res, 500, { ok: false, error: String(err.message || err) });
    }
    return;
  }

  if (action === "process-queue") {
    try {
      const limit = Number(body.limit) || 3;
      const result = await processQueuedImportJobs(limit);
      sendJson(res, 200, result);
    } catch (err) {
      console.error("[admin/content-import:process-queue]", err);
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
    await respondWithProgress(res, jobId);
    return;
  }

  sendJson(res, 400, {
    ok: false,
    error: "use_async_job_flow",
    message: "Use action=start → stage (batched) → commit → poll progress. Inline import is disabled.",
    uploadBatchSize: UPLOAD_BATCH_SIZE,
  });
}
