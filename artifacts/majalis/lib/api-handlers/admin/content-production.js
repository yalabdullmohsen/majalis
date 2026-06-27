import { sendJson } from "../../api/_http.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { getSchedulerDashboard, runSchedulerJob, JOB_HANDLERS } from "../../../lib/content-production/scheduler.mjs";
import { getObservability, processRetryQueue } from "../../../lib/content-production/monitoring.mjs";
import { validateContentItem } from "../../../lib/content-production/validator.mjs";
import { PRODUCTION_FLOW, PIPELINES } from "../../../lib/content-production/config.mjs";

export default async function handler(req, res) {
  const action = req.query?.action || req.body?.action || "dashboard";
  const admin = getSupabaseAdmin();

  try {
    if (action === "dashboard") {
      const dashboard = await getSchedulerDashboard(admin);
      sendJson(res, 200, {
        ok: true,
        flow: PRODUCTION_FLOW,
        pipelines: PIPELINES,
        cronJobs: Object.keys(JOB_HANDLERS),
        ...dashboard,
      });
      return;
    }

    if (action === "run-job") {
      const jobId = req.query?.job || req.body?.job;
      if (!jobId || !JOB_HANDLERS[jobId]) {
        sendJson(res, 400, { ok: false, error: "Invalid job id", available: Object.keys(JOB_HANDLERS) });
        return;
      }
      const result = await runSchedulerJob(jobId, admin);
      sendJson(res, 200, result);
      return;
    }

    if (action === "observability") {
      const data = await getObservability(admin);
      sendJson(res, 200, { ok: true, ...data });
      return;
    }

    if (action === "retry-queue") {
      const result = await processRetryQueue(admin, 20);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "validate") {
      const item = req.body?.item || {};
      const pipeline = req.body?.pipeline || req.query?.pipeline || "fawaid";
      const result = validateContentItem(item, pipeline);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "health") {
      sendJson(res, 200, {
        ok: true,
        service: "content-production",
        pipelines: Object.keys(PIPELINES).length,
        cronJobs: Object.keys(JOB_HANDLERS).length,
        supabase: !!admin,
      });
      return;
    }

    sendJson(res, 400, { ok: false, error: "Unknown action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
