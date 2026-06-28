import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { runProductionPurge } from "../../../lib/production/purge-runner.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const apply = req.query?.apply === "1" || body.apply === true;
  const dryRun = req.query?.dryRun === "1" || body.dryRun === true || !apply;

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, { ok: false, error: "no_admin_client" });
    return;
  }

  try {
    const report = await runProductionPurge(admin, { apply: !dryRun && apply });
    sendJson(res, 200, { ok: report.ok !== false, ...report });
  } catch (err) {
    console.error("[purge-test-content]", err);
    sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : "Purge failed" });
  }
}
