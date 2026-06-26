import { sendJson } from "../_http.js";
import { validateAdminAuth } from "../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { getAdminLearningStats, generateDigitalLearningReport, triggerDailyNotifications } from "../../lib/digital-learning/index.mjs";

export default async function handler(req, res) {
  if (!validateAdminAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "dashboard";
  const admin = getSupabaseAdmin();

  try {
    if (action === "dashboard") {
      const stats = await getAdminLearningStats(admin);
      sendJson(res, 200, { ok: true, stats });
      return;
    }

    if (action === "report") {
      const report = await generateDigitalLearningReport();
      sendJson(res, 200, { ok: true, report });
      return;
    }

    if (action === "trigger-notifications") {
      const result = await triggerDailyNotifications(admin);
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
