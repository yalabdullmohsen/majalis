import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import {
  runAutonomousOrchestrator,
  getAutonomousObservability,
  runSecurityAudit,
  generateAutonomousPlatformReport,
  generatePeriodicReport,
  getDailyContent,
  getRecentEvents,
} from "../../../lib/autonomous-ai/index.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";
  const admin = getSupabaseAdmin();

  try {
    if (action === "dashboard") {
      const obs = await getAutonomousObservability(admin);
      sendJson(res, 200, { ok: true, ...obs });
      return;
    }

    if (action === "run") {
      const result = await runAutonomousOrchestrator({
        triggerType: "manual",
        mode: req.body?.mode || "full",
        checkLinks: Boolean(req.body?.checkLinks),
        runScholarlyScan: Boolean(req.body?.runScholarlyScan),
        generateReport: true,
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "security") {
      const audit = await runSecurityAudit(admin);
      sendJson(res, 200, { ok: true, audit });
      return;
    }

    if (action === "report") {
      const report = await generateAutonomousPlatformReport(admin);
      sendJson(res, 200, { ok: true, report });
      return;
    }

    if (action === "periodic") {
      const report = await generatePeriodicReport(admin, req.query?.type || "daily");
      sendJson(res, 200, { ok: true, report });
      return;
    }

    if (action === "daily") {
      const content = await getDailyContent(admin);
      sendJson(res, 200, { ok: true, content });
      return;
    }

    if (action === "events") {
      const events = await getRecentEvents(admin, { limit: Number(req.query?.limit || 50) });
      sendJson(res, 200, { ok: true, events });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
