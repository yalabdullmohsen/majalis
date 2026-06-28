import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getAutonomousDashboard } from "../../../lib/auto-knowledge-engine/autonomous/dashboard.mjs";
import { runAutonomousPlatformCycle } from "../../../lib/auto-knowledge-engine/autonomous/orchestrator.mjs";
import { generatePeriodicReport, getPeriodicReportHistory } from "../../../lib/auto-knowledge-engine/autonomous/reporting.mjs";
import { getRecentRejections } from "../../../lib/auto-knowledge-engine/autonomous/rejection-log.mjs";
import { applyMigrations } from "../../../lib/db-migrate.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";

  try {
    if (action === "dashboard") {
      sendJson(res, 200, await getAutonomousDashboard());
      return;
    }

    if (action === "run-cycle") {
      const result = await runAutonomousPlatformCycle({
        triggerType: "manual",
        includeContentEngines: req.body?.includeContentEngines !== false,
      });
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    if (action === "report") {
      const reportType = req.query?.type || req.body?.type || "daily";
      const result = await generatePeriodicReport(reportType, { force: req.body?.force === true });
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    if (action === "reports") {
      const reports = await getPeriodicReportHistory(req.query?.type, Number(req.query?.limit || 14));
      sendJson(res, 200, { ok: true, reports });
      return;
    }

    if (action === "rejections") {
      const rejections = await getRecentRejections(Number(req.query?.limit || 50));
      sendJson(res, 200, { ok: true, rejections });
      return;
    }

    if (action === "apply-migration") {
      const result = await applyMigrations({
        files: ["auto_knowledge_engine_v18_autonomous.sql"],
        continueOnError: false,
        trackApplied: true,
      });
      sendJson(res, result.ok ? 200 : 500, { ok: result.ok, migration: result });
      return;
    }

    sendJson(res, 400, { ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("[admin/ake-autonomous]", error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
