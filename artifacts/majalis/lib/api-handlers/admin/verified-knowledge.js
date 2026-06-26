import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  runVerifiedKnowledgeCycle,
  getLatestQualityReport,
  getVerifiedSourcesDashboard,
  bootstrapVerifiedContent,
} from "../../../lib/verified-knowledge/orchestrator.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";
  const admin = getSupabaseAdmin();

  try {
    if (action === "dashboard") {
      const [report, sources] = await Promise.all([
        getLatestQualityReport(admin),
        getVerifiedSourcesDashboard(admin),
      ]);
      sendJson(res, 200, { ok: true, report, sources });
      return;
    }

    if (action === "run") {
      const result = await runVerifiedKnowledgeCycle({
        dryRun: req.body?.dryRun === true,
        checkLinks: req.body?.checkLinks === true,
        persistVerification: req.body?.persistVerification !== false,
        trigger: "admin",
        actorId: auth.userId ?? "admin",
      });
      sendJson(res, 200, { ok: true, result });
      return;
    }

    if (action === "bootstrap") {
      const result = await bootstrapVerifiedContent(admin, {
        dryRun: req.body?.dryRun === true,
        persistProvenance: req.body?.persistProvenance !== false,
      });
      sendJson(res, 200, { ok: true, result });
      return;
    }

    if (action === "report") {
      const report = await getLatestQualityReport(admin);
      sendJson(res, 200, { ok: true, report });
      return;
    }

    sendJson(res, 400, { ok: false, message: "Unknown action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
