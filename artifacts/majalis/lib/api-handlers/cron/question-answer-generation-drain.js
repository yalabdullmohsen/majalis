import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runDailyGeneration } from "../../../lib/question-generation/pipeline.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

/** Resume partial daily jobs (runs every 15 min) */
export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, { ok: false, error: "database_unavailable" });
    return;
  }

  try {
    const { data: partial } = await admin
      .from("question_generation_jobs")
      .select("*")
      .in("status", ["running", "partial", "queued"])
      .order("day_key", { ascending: false })
      .limit(1);

    if (!partial?.length) {
      sendJson(res, 200, { ok: true, skipped: true, reason: "no_active_job" });
      return;
    }

    const result = await runDailyGeneration({ force: false });
    sendJson(res, result.ok ? 200 : 500, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
