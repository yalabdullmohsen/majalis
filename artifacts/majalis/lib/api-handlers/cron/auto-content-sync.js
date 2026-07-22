import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runAutoContentSync } from "../../../lib/auto-content/auto-content-sync.mjs";
import { runInstagramMultiTypeSync, archiveExpiredEvents } from "../../../lib/cms/instagram-multitype-sync.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const result = await runAutoContentSync({ triggerType: "cron" });
    const status = result.ok ? 200 : (result.error === "Supabase not configured" ? 503 : 500);

    // نفس الكرون الموحّد: مزامنة حسابات Instagram الخمسة (دورات/فعاليات/فوائد/
    // إعلانات) + أرشفة الفعاليات المنتهية — بلا كرون منفصل (تقليل الاستهلاك).
    let instagram = null;
    let expiredEvents = null;
    try {
      instagram = await runInstagramMultiTypeSync({ runId: result.runId || null });
      expiredEvents = await archiveExpiredEvents();
    } catch (igError) {
      instagram = { ok: false, error: igError.message };
    }

    sendJson(res, status, { ...result, instagram, expiredEvents });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message, logs: [] });
  }
}
