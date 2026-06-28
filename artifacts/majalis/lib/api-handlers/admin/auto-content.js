import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  getAutoContentPipelineStats,
  getAutoContentHealth,
} from "../../../lib/auto-content/auto-content-sync.mjs";
import { getSystemHealth } from "../../../lib/system-health.mjs";
import {
  createAutoContentJob,
  getAutoContentJob,
  listAutoContentJobs,
  cancelAutoContentJob,
} from "../../../lib/auto-content/auto-content-jobs.mjs";
import {
  processAutoContentJob,
  processQueuedAutoContentJobs,
} from "../../../lib/auto-content/auto-content-job-worker.mjs";
import {
  scheduleAutoContentProcessing,
  WORKER_SECRET,
} from "../../../lib/auto-content/auto-content-worker.mjs";
import { runAutoContentJobWatchdog } from "../../../lib/auto-content/auto-content-jobs.mjs";

function isAutoContentWorkerRequest(req) {
  const header = req.headers?.["x-auto-content-worker"] || req.headers?.["X-Auto-Content-Worker"];
  return WORKER_SECRET && header === WORKER_SECRET;
}

function formatJobStatus(job) {
  return {
    ok: true,
    jobId: job.id,
    status: job.status,
    phase: job.phase,
    progress: job.progress ?? 0,
    result: job.result ?? null,
    error: job.error_message ?? null,
    logs: job.metadata?.logs?.slice(-10) ?? [],
    startedAt: job.started_at,
    finishedAt: job.finished_at,
    createdAt: job.created_at,
  };
}

export default async function handler(req, res) {
  const body = req.method === "POST" ? req.body || {} : {};
  const query = req.query || {};
  const action = String(body.action || query.action || "stats").trim();

  const workerBypass = action === "process" && isAutoContentWorkerRequest(req);

  const auth = workerBypass
    ? { userId: "auto-content-worker", role: "owner" }
    : await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  try {
    if (action === "stats") {
      const limit = Number(query.limit || 10);
      const result = await getAutoContentPipelineStats(limit);
      sendJson(res, 200, result);
      return;
    }

    if (action === "jobs") {
      const limit = Number(query.limit || body.limit || 10);
      const listed = await listAutoContentJobs(limit);
      sendJson(res, listed.ok ? 200 : 503, listed);
      return;
    }

    if (action === "status") {
      const jobId = String(query.jobId || body.jobId || "").trim();
      if (!jobId) {
        sendJson(res, 400, { ok: false, error: "missing_job_id" });
        return;
      }
      await runAutoContentJobWatchdog();
      const snap = await getAutoContentJob(jobId);
      if (!snap.ok) {
        sendJson(res, 404, { ok: false, error: snap.error || "job_not_found" });
        return;
      }
      sendJson(res, 200, formatJobStatus(snap.job));
      return;
    }

    if (req.method === "GET" && action !== "health" && action !== "system") {
      sendJson(res, 405, { ok: false, error: "method_not_allowed" });
      return;
    }

    if (req.method !== "POST") {
      if (action === "health") {
        const health = await getAutoContentHealth();
        sendJson(res, health.ok ? 200 : 503, health);
        return;
      }
      if (action === "system") {
        const health = await getSystemHealth();
        sendJson(res, health.ok ? 200 : 503, health);
        return;
      }
      sendJson(res, 405, { ok: false, error: "method_not_allowed" });
      return;
    }

    if (action === "start" || action === "run") {
      const started = await createAutoContentJob({
        type: "sync",
        createdBy: auth.userId,
        metadata: { triggerType: "manual", requestedBy: auth.userId },
      });

      if (!started.ok) {
        sendJson(res, started.code === "schema_not_ready" ? 503 : 500, {
          ok: false,
          error: started.error,
        });
        return;
      }

      scheduleAutoContentProcessing(res, started.jobId);

      sendJson(res, 200, {
        ok: true,
        jobId: started.jobId,
        status: "queued",
        ...(action === "run" ? { deprecated: "action=run is deprecated — use action=start" } : {}),
      });
      return;
    }

    if (action === "process") {
      const jobId = String(query.jobId || body.jobId || "").trim();
      if (!jobId) {
        sendJson(res, 400, { ok: false, error: "missing_job_id" });
        return;
      }

      if (workerBypass) {
        const result = await processAutoContentJob(jobId);
        sendJson(res, result.ok ? 200 : 500, result);
        return;
      }

      scheduleAutoContentProcessing(res, jobId);
      sendJson(res, 202, { ok: true, jobId, status: "processing", mode: "scheduled" });
      return;
    }

    if (action === "cancel") {
      const jobId = String(query.jobId || body.jobId || "").trim();
      if (!jobId) {
        sendJson(res, 400, { ok: false, error: "missing_job_id" });
        return;
      }
      const result = await cancelAutoContentJob(jobId);
      sendJson(res, result.ok ? 200 : 404, result);
      return;
    }

    if (action === "health") {
      const health = await getAutoContentHealth();
      sendJson(res, health.ok ? 200 : 503, health);
      return;
    }

    if (action === "system") {
      const health = await getSystemHealth();
      sendJson(res, health.ok ? 200 : 503, health);
      return;
    }

    if (action === "process-queue") {
      const limit = Number(query.limit || body.limit) || 3;
      const result = await processQueuedAutoContentJobs(limit);
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 400, { ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("[admin/auto-content] failed", error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
