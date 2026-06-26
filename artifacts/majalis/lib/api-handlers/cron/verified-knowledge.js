import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runVerifiedKnowledgeCycle } from "../../../lib/verified-knowledge/orchestrator.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "Method not allowed" });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, message: "Unauthorized" });
    return;
  }

  try {
    const result = await runVerifiedKnowledgeCycle({
      dryRun: req.query?.dryRun === "1",
      checkLinks: req.query?.links === "1",
      persistVerification: req.query?.persist !== "0",
      trigger: "cron",
    });
    sendJson(res, result.ok ? 200 : 207, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
