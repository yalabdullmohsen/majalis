import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runReasoningCycle } from "../../../lib/reasoning-engine/orchestrator.mjs";

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
    const result = await runReasoningCycle({
      trigger: "cron",
      autoFix: req.query?.fix === "1",
      inferenceLimit: Number(req.query?.limit || 150),
    });
    sendJson(res, result.ok ? 200 : 207, { ok: result.ok, result });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
