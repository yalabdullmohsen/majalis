import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { runGovernanceCycle } from "../../../lib/governance/orchestrator.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, message: "غير مصرح." });
    return;
  }

  try {
    const admin = getSupabaseAdmin();
    const mode = req.query?.mode || "backup";
    const result = await runGovernanceCycle(admin, {
      backup: mode === "backup" || mode === "full",
      security: mode === "security" || mode === "full",
      quality: mode === "full",
    });
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    console.error("[cron/governance-backup] failed", error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
