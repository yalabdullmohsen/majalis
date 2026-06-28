import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getMonitoringDashboard } from "../../../lib/auto-knowledge-engine/monitoring/dashboard.mjs";
import { getOpenAlerts, resolveAkeAlert } from "../../../lib/auto-knowledge-engine/alerts.mjs";
import { generateDailyReport, getDailyReportHistory } from "../../../lib/auto-knowledge-engine/monitoring/daily-report.mjs";
import { sendTestAlert } from "../../../lib/auto-knowledge-engine/monitoring/rules.mjs";
import { getCronHealth } from "../../../lib/auto-knowledge-engine/monitoring/cron-tracker.mjs";
import { getOpenPipelineFailures } from "../../../lib/auto-knowledge-engine/monitoring/pipeline-failures.mjs";
import { getRecentSourceHealthEvents } from "../../../lib/auto-knowledge-engine/monitoring/source-health-events.mjs";
import { evaluateMonitoringRules } from "../../../lib/auto-knowledge-engine/monitoring/rules.mjs";
import { applyMigrations } from "../../../lib/db-migrate.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";

  try {
    if (action === "dashboard") {
      const data = await getMonitoringDashboard();
      sendJson(res, 200, data);
      return;
    }

    if (action === "alerts") {
      const alerts = await getOpenAlerts(Number(req.query?.limit || 50));
      sendJson(res, 200, { ok: true, alerts });
      return;
    }

    if (action === "resolve") {
      const alertId = req.body?.alertId || req.query?.alertId;
      const dedupeKey = req.body?.dedupeKey || req.query?.dedupeKey;
      const ignored = Boolean(req.body?.ignored);
      const count = await resolveAkeAlert({ alertId, dedupeKey, ignored });
      sendJson(res, 200, { ok: true, resolved: count });
      return;
    }

    if (action === "test-alert") {
      const result = await sendTestAlert();
      sendJson(res, 200, { ok: true, result });
      return;
    }

    if (action === "generate-report") {
      const force = req.body?.force === true || req.query?.force === "1";
      const result = await generateDailyReport({ force });
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    if (action === "reports") {
      const reports = await getDailyReportHistory(Number(req.query?.limit || 14));
      sendJson(res, 200, { ok: true, reports });
      return;
    }

    if (action === "cron-runs") {
      const health = await getCronHealth(Number(req.query?.limit || 40));
      sendJson(res, 200, { ok: true, ...health });
      return;
    }

    if (action === "pipeline-failures") {
      const failures = await getOpenPipelineFailures(Number(req.query?.limit || 50));
      sendJson(res, 200, { ok: true, failures });
      return;
    }

    if (action === "source-events") {
      const events = await getRecentSourceHealthEvents(Number(req.query?.limit || 40));
      sendJson(res, 200, { ok: true, events });
      return;
    }

    if (action === "evaluate") {
      const alerts = await evaluateMonitoringRules();
      sendJson(res, 200, { ok: true, alerts });
      return;
    }

    if (action === "apply-migration") {
      const result = await applyMigrations({
        files: ["auto_knowledge_engine_v17_monitoring.sql"],
        continueOnError: false,
        trackApplied: true,
      });
      sendJson(res, result.ok ? 200 : 500, { ok: result.ok, migration: result });
      return;
    }

    sendJson(res, 400, { ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("[admin/ake-monitoring]", error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
