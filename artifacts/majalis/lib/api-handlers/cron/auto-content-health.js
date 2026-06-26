import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { getAutoContentHealth } from "../../../lib/auto-content/auto-content-sync.mjs";

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
    const health = await getAutoContentHealth();
    sendJson(res, health.ok ? 200 : 503, health);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
