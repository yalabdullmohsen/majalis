/**
 * POST/GET /api/cron/lesson-source-monitor
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runLessonSourceMonitor } from "../../../lib/cms/lesson-source-monitor.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "unauthorized" });
    return;
  }

  try {
    const dryRun = req.query?.dryRun === "1" || req.body?.dryRun === true;
    const sourceId = req.query?.sourceId || req.body?.sourceId || null;
    const result = await runLessonSourceMonitor({ dryRun, sourceId });
    sendJson(res, result.ok ? 200 : 503, result);
  } catch (err) {
    console.error("[cron/lesson-source-monitor]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
