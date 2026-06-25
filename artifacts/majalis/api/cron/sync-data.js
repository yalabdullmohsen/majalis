import { sendJson } from "../_http.js";
import { validateCronAuth } from "../../lib/env-config.mjs";
import { runDailyDataSync } from "../../lib/sync-data.mjs";

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
    const result = await runDailyDataSync();
    sendJson(res, 200, result);
  } catch (error) {
    console.error("[cron/sync-data] failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "فشل التحديث التلقائي.",
      at: new Date().toISOString(),
    });
  }
}
