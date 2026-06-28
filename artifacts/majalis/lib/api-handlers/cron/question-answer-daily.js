import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runDailyGeneration } from "../../../lib/question-generation/pipeline.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized", code: "Missing or invalid CRON_SECRET" });
    return;
  }

  const force = req.query?.force === "1" || req.body?.force === true;

  try {
    const result = await runDailyGeneration({ force });
    sendJson(res, result.ok ? 200 : 500, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || "generation_failed" });
  }
}
