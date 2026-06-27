import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { monitorContentSources } from "../../../lib/cms/source-monitor.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "unauthorized" });
    return;
  }

  try {
    const result = await monitorContentSources();
    sendJson(res, 200, result);
  } catch (err) {
    console.error("[cron/monitor-sources]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
