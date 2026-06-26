import { sendJson } from "../_http.js";
import { validateCronAuth } from "../../lib/env-config.mjs";
import { runKuwaitLessonsSync } from "../../lib/kuwait-lessons-sync/sync.mjs";

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
    const useAi = req.query?.ai !== "0";
    const result = await runKuwaitLessonsSync({ useAi, trigger: "cron" });
    sendJson(res, result.ok ? 200 : 207, result);
  } catch (error) {
    console.error("[cron/lesson-sync] failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "فشلت مزامنة الدروس.",
      error: error instanceof Error ? error.message : String(error),
      at: new Date().toISOString(),
    });
  }
}
