import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runAutoContentSync } from "../../../lib/auto-content/auto-content-sync.mjs";

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
    sendJson(res, status, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message, logs: [] });
  }
}
