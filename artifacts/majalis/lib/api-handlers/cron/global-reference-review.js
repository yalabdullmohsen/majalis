import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { runReviewCycle } from "../../../lib/global-reference/review.mjs";

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
    const checkLinks = req.query?.links !== "0";
    const cycle = await runReviewCycle(admin, { checkLinks, type: "cron" });
    sendJson(res, 200, { ok: true, cycle });
  } catch (error) {
    console.error("[cron/global-reference-review] failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "فشلت المراجعة المرجعية الدورية.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
