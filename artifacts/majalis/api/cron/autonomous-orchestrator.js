import { sendJson } from "../_http.js";
import { validateCronAuth } from "../../lib/env-config.mjs";
import {
  runAutonomousOrchestrator,
  processRetryQueue,
  processAkeJobQueue,
  rotateDailyContent,
} from "../../lib/autonomous-ai/index.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const mode = req.query?.mode || req.body?.mode || "full";
  const action = req.query?.action || req.body?.action || "orchestrate";

  try {
    if (action === "daily") {
      const result = await rotateDailyContent(null, crypto.randomUUID());
      sendJson(res, 200, result);
      return;
    }

    if (action === "retry") {
      const result = await processRetryQueue(null, crypto.randomUUID());
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "queue") {
      const { getSupabaseAdmin } = await import("../../lib/supabase-admin.mjs");
      const admin = getSupabaseAdmin();
      const retry = await processRetryQueue(admin, crypto.randomUUID());
      const ake = await processAkeJobQueue(admin);
      sendJson(res, 200, { ok: true, retry, ake });
      return;
    }

    const result = await runAutonomousOrchestrator({
      triggerType: "cron",
      mode,
      checkLinks: req.query?.checkLinks === "1",
      runScholarlyScan: req.query?.scholarly === "1" || mode === "daily",
      generateReport: req.query?.report === "1",
      reportType: req.query?.reportType || "daily",
    });

    sendJson(res, result.ok ? 200 : 500, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
