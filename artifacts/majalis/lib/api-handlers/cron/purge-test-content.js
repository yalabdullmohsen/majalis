/**
 * POST/GET /api/cron/purge-test-content
 * Cron-protected production purge for misclassified test/import fawaid.
 * Query: dryRun=1 (default) | apply=1
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { runProductionPurge } from "../../../lib/production/purge-runner.mjs";
import { shouldPurgeFawaidRow } from "../../../lib/production/fawaid-cleanup.mjs";

async function verifyFawaidClean(admin) {
  const { data, error } = await admin
    .from("fawaid")
    .select("id, text, author_name, status")
    .eq("status", "approved")
    .limit(2000);
  if (error) return { ok: false, error: error.message };
  const rows = data || [];
  const bad = rows.filter((r) => shouldPurgeFawaidRow(r));
  return {
    ok: bad.length === 0,
    approved: rows.length,
    bad: bad.length,
    good: rows.length - bad.length,
  };
}

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, { ok: false, error: "no_admin_client" });
    return;
  }

  const apply =
    req.query?.apply === "1" ||
    req.body?.apply === true ||
    req.query?.action === "apply";

  try {
    const report = await runProductionPurge(admin, { apply });
    const verify = await verifyFawaidClean(admin);
    sendJson(res, 200, {
      ok: report.ok !== false && verify.ok,
      apply,
      purge: report,
      verify,
    });
  } catch (err) {
    console.error("[cron/purge-test-content]", err);
    sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : "Purge failed" });
  }
}
