import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getMonitoringDashboard } from "../../../lib/auto-knowledge-engine/monitoring/dashboard.mjs";
import { getOpenAlerts, resolveAkeAlert } from "../../../lib/auto-knowledge-engine/alerts.mjs";
import { evaluateMonitoringRules, sendTestAlert } from "../../../lib/auto-knowledge-engine/monitoring/rules.mjs";
import { generateDailyReport } from "../../../lib/auto-knowledge-engine/monitoring/daily-report.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";

  try {
    if (action === "dashboard") {
      const dashboard = await getMonitoringDashboard();
      sendJson(res, 200, dashboard);
      return;
    }

    if (action === "alerts") {
      const limit = Number(req.query?.limit || 50);
      const severity = req.query?.severity || undefined;
      const alerts = await getOpenAlerts(limit, severity ? { severity } : undefined);
      sendJson(res, 200, { ok: true, alerts });
      return;
    }

    if (action === "resolve-alert" && req.method === "POST") {
      const alertId = req.body?.alertId;
      if (!alertId) {
        sendJson(res, 400, { ok: false, error: "alertId required" });
        return;
      }
      const result = await resolveAkeAlert(alertId, auth.userId || "admin");
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "evaluate") {
      const rules = await evaluateMonitoringRules();
      sendJson(res, 200, { ok: true, rules });
      return;
    }

    if (action === "daily-report") {
      const report = await generateDailyReport({ force: Boolean(req.query?.force) });
      sendJson(res, report.ok ? 200 : 500, report);
      return;
    }

    if (action === "test-alert" && req.method === "POST") {
      const result = await sendTestAlert();
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "rejections") {
      const admin = getSupabaseAdmin();
      if (!admin) {
        sendJson(res, 503, { ok: false, error: "no_admin" });
        return;
      }
      const limit = Math.min(Number(req.query?.limit || 50), 200);
      const { data, error } = await admin
        .from("ake_rejection_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }
      sendJson(res, 200, { ok: true, rejections: data || [] });
      return;
    }

    sendJson(res, 400, { ok: false, error: `Unknown action: ${action}` });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
