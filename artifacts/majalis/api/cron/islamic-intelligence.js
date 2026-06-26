import { sendJson } from "../_http.js";
import { validateCronAuth } from "../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { runIslamicIntelligencePlatform, generateWeeklyReport } from "../../lib/islamic-intelligence/index.mjs";

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
    const mode = req.query?.mode || "daily";
    const isWeekly = req.query?.weekly === "1" || mode === "weekly";

    if (isWeekly) {
      const [platform, weekly] = await Promise.all([
        runIslamicIntelligencePlatform({ mode: "weekly", checkLinks: true }),
        generateWeeklyReport(admin),
      ]);
      sendJson(res, 200, { ok: true, platform, weekly });
      return;
    }

    const result = await runIslamicIntelligencePlatform({
      mode,
      checkLinks: req.query?.links !== "0",
    });
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    console.error("[cron/islamic-intelligence] failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "فشل تشغيل منصة الاستخبارات العلمية.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
