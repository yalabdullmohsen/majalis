import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { resolveRequestPath } from "../../api-dispatch.mjs";
import {
  UniversalImportEngine,
  buildImportPreview,
  commitUniversalImport,
  getImportJobResult,
} from "../../../lib/content-import/universal-engine.mjs";
import {
  startImportJob,
  stageImportBatch,
  processImportJob,
  getImportJobProgress,
  retryImportJob,
  runImportJobWatchdog,
} from "../../../lib/content-import/engine.mjs";
import {
  recoverImportJobIntegrity,
  cancelImportJob,
  getImportJob,
  jobLog,
} from "../../../lib/content-import/import-jobs.mjs";
import {
  scheduleImportProcessing,
  triggerImportWorkerFetch,
  WORKER_SECRET,
  IMPORT_SYNC_ROW_THRESHOLD,
} from "../../../lib/content-import/import-worker.mjs";
import { resolveContentType, CONTENT_TYPES } from "../../../lib/content-import/registry.mjs";
import { buildImportApiError } from "../../../lib/content-import/import-api-errors.mjs";
import { resolveUploadBatchSize } from "../../../lib/content-import/batch-size.mjs";

function isImportWorkerRequest(req) {
  const header = req.headers?.["x-import-worker"] || req.headers?.["X-Import-Worker"];
  return WORKER_SECRET && header === WORKER_SECRET;
}

function resolveAction(req, body) {
  const path = resolveRequestPath(req).replace(/\/$/, "");
  const suffix = path.replace(/^\/api\/admin\/import\/?/, "");
  if (suffix && suffix !== path) return suffix.split("/")[0];
  return String(body.action || req.query?.action || "").trim();
}

function getSyncThreshold(contentType) {
  const def = resolveContentType(contentType);
  if (def?.type === "benefits") {
    return Number(process.env.IMPORT_BENEFITS_SYNC_THRESHOLD) || 50;
  }
  return IMPORT_SYNC_ROW_THRESHOLD;
}

function isKickableStatus(status) {
  return ["queued", "processing", "parsing", "validating", "importing", "uploading"].includes(status);
}

async function respondWithStatus(res, jobId, kick = false) {
  await runImportJobWatchdog();
  if (kick) {
    const snap = await getImportJobProgress(jobId);
    if (snap.ok && snap.job && isKickableStatus(snap.job.status)) {
      void processImportJob(jobId).catch((err) => {
        jobLog(jobId, "status_kick_failed", { error: String(err.message || err) });
      });
    }
  }
  const progress = await getImportJobProgress(jobId);
  sendJson(res, progress.ok ? 200 : 404, progress);
}

export default async function handler(req, res) {
  const body = req.method === "POST" ? req.body || {} : {};
  const query = req.query || {};
  const action = resolveAction(req, body);
  const dryRun = body.dryRun === true || query.dryRun === "1";

  const workerBypass = action === "process" && isImportWorkerRequest(req);
  const auth = workerBypass
    ? { userId: "import-worker", role: "owner" }
    : await requireAdminAccess(req, res, sendJson, { requireImport: true });
  if (!auth) return;

  if (req.method === "GET" && (action === "status" || action === "progress")) {
    const jobId = String(query.jobId || body.jobId || "").trim();
    if (!jobId) {
      sendJson(res, 400, { ok: false, error: "missing_job_id", code: "missing_job_id" });
      return;
    }
    const kick = query.kick === "1" || body.kick === true;
    await respondWithStatus(res, jobId, kick);
    return;
  }

  if (req.method === "GET" && action === "result") {
    const jobId = String(query.jobId || body.jobId || "").trim();
    if (!jobId) {
      sendJson(res, 400, { ok: false, error: "missing_job_id" });
      return;
    }
    const result = await getImportJobResult(jobId);
    sendJson(res, result.ok ? 200 : 404, result);
    return;
  }

  if (req.method === "GET" && (action === "dashboard" || action === "center")) {
    const stats = await UniversalImportEngine.getDashboard({ limit: Number(query.limit) || 30 });
    sendJson(res, 200, stats);
    return;
  }

  if (req.method === "GET" && action === "types") {
    sendJson(res, 200, {
      ok: true,
      engine: "UniversalImportEngine",
      types: CONTENT_TYPES,
      schemas: UniversalImportEngine.listSchemas(),
      uploadBatchSize: resolveUploadBatchSize(0),
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  if (action === "preview") {
    const type = String(body.type || "").trim();
    const filename = String(body.filename || "upload.csv").trim();
    const content = body.content;
    if (!type || content == null) {
      sendJson(res, 400, { ok: false, error: "missing_type_or_content" });
      return;
    }
    const preview = buildImportPreview({ type, content, filename });
    sendJson(res, preview.ok ? 200 : 422, { ok: preview.ok !== false, ...preview });
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
      sendJson(res, 503, {
        ok: false,
        error: "import_schema_not_ready",
        code: "schema_not_ready",
        detail: integrity.error,
      });
      return;
    }

    const typeDef = resolveContentType(type);
    if (!typeDef) {
      sendJson(res, 400, {
        ...buildImportApiError({
          code: "unsupported_type",
          contentType: type,
          detail: `الأنواع المدعومة: ${CONTENT_TYPES.join(", ")}`,
          failedAt: "startImportJob",
        }),
        types: CONTENT_TYPES,
      });
      return;
    }

    if (body.content && body.requirePreview !== false) {
      const preview = buildImportPreview({ type, content: body.content, filename });
      if (!preview.canImport) {
        sendJson(res, 422, {
          ok: false,
          code: "preview_blocked",
          error: "فشل فحص الملف — أصلح الأخطاء قبل الاستيراد",
          preview,
          structuredErrors: preview.structuredErrors,
        });
        return;
      }
    }

    const started = await startImportJob({
      type,
      filename,
      totalRows,
      createdBy: auth.userId || null,
    });
    if (!started.ok) {
      sendJson(res, 400, {
        ...buildImportApiError({
          code: started.code || "job_create_failed",
          contentType: type,
          normalizedType: typeDef.type,
          targetTable: typeDef.table,
          detail: started.error,
          failedAt: "createImportJob",
        }),
      });
      return;
    }

    sendJson(res, 200, {
      ...started,
      engine: "UniversalImportEngine",
      targetTable: typeDef.table,
      normalizedType: typeDef.type,
      uploadBatchSize: resolveUploadBatchSize(totalRows),
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
    if (!staged.ok) {
      const job = await getImportJob(jobId);
      const typeDef = resolveContentType(job?.type);
      sendJson(res, 422, {
        ...buildImportApiError({
          code: staged.code || "stage_failed",
          contentType: job?.type,
          targetTable: typeDef?.table,
          detail: staged.error,
          failedAt: "stageImportBatch",
        }),
        jobId,
      });
      return;
    }
    sendJson(res, 200, staged);
    return;
  }

  if (action === "commit" || action === "start-import") {
    const jobId = String(body.jobId || "").trim();
    if (!jobId) {
      sendJson(res, 400, { ok: false, error: "missing_job_id" });
      return;
    }

    const job = await getImportJob(jobId);
    const rowCount = Math.max(job?.total_rows || 0, job?.processed_rows || 0);
    const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
    const typeDef = resolveContentType(job?.type);
    const syncThreshold = getSyncThreshold(job?.type);

    const queued = await commitUniversalImport(jobId, {
      res: rowCount > syncThreshold ? res : undefined,
      dryRun,
      authHeader: rowCount > syncThreshold ? authHeader : undefined,
    });

    if (!queued.ok) {
      sendJson(res, 422, {
        ...buildImportApiError({
          code: queued.error || "empty_job",
          contentType: job?.type,
          targetTable: typeDef?.table,
          detail: queued.error,
          failedAt: "queueImportJob",
        }),
        jobId,
      });
      return;
    }

    if (queued.alreadyDone) {
      await respondWithStatus(res, jobId);
      return;
    }

    jobLog(jobId, "universal_commit", {
      rowCount,
      sync_threshold: syncThreshold,
      execution: rowCount <= syncThreshold ? "sync_candidate" : "async",
      targetTable: typeDef?.table,
    });

    if (rowCount <= syncThreshold) {
      try {
        const result = await processImportJob(jobId, { dryRun });
        const httpStatus = result.ok ? 200 : 422;
        const summary = result.report
          ? UniversalImportEngine.formatSummary({
              ok: result.ok,
              jobId,
              contentType: job?.type,
              targetTable: typeDef?.table,
              stats: result.report.stats,
              durationMs: result.timings?.total_ms,
              timings: result.timings,
              validationErrors: result.report.validationErrors,
              structuredErrors: result.report.structuredErrors,
              importErrors: result.report.importErrors,
            })
          : null;
        sendJson(res, httpStatus, {
          ok: result.ok,
          jobId,
          status: result.status,
          sync: true,
          targetTable: typeDef?.table,
          report: result.report,
          summary,
          timings: result.timings,
        });
      } catch (err) {
        sendJson(res, 500, {
          ...buildImportApiError({
            code: "import_failed",
            contentType: job?.type,
            targetTable: typeDef?.table,
            detail: String(err.message || err),
            failedAt: "processImportJob",
          }),
          jobId,
        });
      }
      return;
    }

    sendJson(res, 202, {
      ok: true,
      jobId,
      status: "queued",
      async: true,
      targetTable: typeDef?.table,
      engine: "UniversalImportEngine",
    });
    return;
  }

  if (action === "retry") {
    const jobId = String(body.jobId || "").trim();
    if (!jobId) {
      sendJson(res, 400, { ok: false, error: "missing_job_id" });
      return;
    }
    const retried = await retryImportJob(jobId);
    if (!retried.ok) {
      sendJson(res, 422, retried);
      return;
    }
    const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
    scheduleImportProcessing(res, jobId, { dryRun });
    void triggerImportWorkerFetch(jobId, authHeader);
    sendJson(res, 202, { ok: true, jobId, status: "queued", retried: true });
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
    const result = await processImportJob(jobId, { dryRun });
    sendJson(res, result.ok ? 200 : 422, result);
    return;
  }

  sendJson(res, 400, {
    ok: false,
    error: "unknown_action",
    message: "Use preview → start → stage → commit → status/result. Actions: preview, start, stage, commit, status, result, retry, cancel",
    types: CONTENT_TYPES,
  });
}
