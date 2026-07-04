/**
 * GET/POST /api/cron/compute-lesson-quality
 * Backfills completeness_score + missing_fields on lessons that haven't been scored yet.
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { backfillLessonCompleteness } from "../../../lib/cms/lesson-completeness.mjs";

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
    const limit = parseInt(req.query?.limit || req.body?.limit || "500", 10);
    const result = await backfillLessonCompleteness({ dryRun, limit });
    sendJson(res, result.ok ? 200 : 503, result);
  } catch (err) {
    console.error("[cron/compute-lesson-quality]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
