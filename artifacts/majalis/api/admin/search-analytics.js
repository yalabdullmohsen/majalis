import { sendJson } from "../_http.js";
import { requireAdminAccess } from "../../lib/admin-auth.mjs";
import { getSearchAnalytics } from "../../lib/scholarly-intelligence/analytics.mjs";
import { generateScholarlyIntelligenceReport } from "../../lib/scholarly-intelligence/report.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";
  const admin = getSupabaseAdmin();
  const days = Number(req.query?.days || req.body?.days || 30);

  try {
    if (action === "dashboard") {
      const analytics = await getSearchAnalytics(admin, days);
      sendJson(res, 200, { ok: true, analytics, days });
      return;
    }

    if (action === "report") {
      const report = await generateScholarlyIntelligenceReport();
      sendJson(res, 200, { ok: true, report });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
