import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runFiqhCouncilSync } from "../../../lib/fiqh-council-sync.mjs";

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
    const result = await runFiqhCouncilSync({ triggerType: "cron" });
    sendJson(res, 200, result);
  } catch (error) {
    console.error("[cron/sync-fiqh-council] failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "فشل مزامنة المجمع الفقهي.",
      at: new Date().toISOString(),
    });
  }
}
