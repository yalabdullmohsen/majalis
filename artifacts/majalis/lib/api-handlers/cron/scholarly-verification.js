import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runScholarlyVerificationScan } from "../../../lib/scholarly-verification/orchestrator.mjs";

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
    const checkLinks = req.query?.links !== "0";
    const useAi = req.query?.ai === "1";
    const persist = req.query?.persist !== "0";
    const result = await runScholarlyVerificationScan({
      checkLinks,
      useAi,
      persist,
      trigger: "cron",
    });
    sendJson(res, 200, result);
  } catch (error) {
    console.error("[cron/scholarly-verification] failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "فشل التحقق العلمي الدوري.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
