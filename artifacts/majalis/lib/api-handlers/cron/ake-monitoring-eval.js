import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { withCronTracking } from "../../../lib/auto-knowledge-engine/monitoring/cron-tracker.mjs";
import { evaluateMonitoringRules } from "../../../lib/auto-knowledge-engine/monitoring/rules.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const result = await withCronTracking(
      "ake-monitoring-eval",
      async () => {
        const admin = getSupabaseAdmin();
        let scheduler = null;
        if (admin) {
          const { data } = await admin.from("ake_scheduler_state").select("*").eq("id", "global").maybeSingle();
          scheduler = data;
        }
        const alerts = await evaluateMonitoringRules({
          lastPublishedAt: scheduler?.last_published_at,
        });
        return { ok: true, alertsTriggered: alerts.filter((a) => a?.created).length, alerts };
      },
      { schedule: "5,20,35,50 * * * *" },
    );
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
