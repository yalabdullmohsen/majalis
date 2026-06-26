import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runFiqhLinkCheck } from "../../../lib/fiqh-link-checker.mjs";

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
    const result = await runFiqhLinkCheck({ limit: 60 });
    sendJson(res, 200, result);
  } catch (error) {
    console.error("[cron/check-fiqh-links] failed", error);
    sendJson(res, 500, { ok: false, message: "فشل فحص روابط المجمع الفقهي." });
  }
}
