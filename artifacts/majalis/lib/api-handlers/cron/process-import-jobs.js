import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { ensureContentImportSchema } from "../../../lib/content-import/ensure-schema.mjs";
import { processQueuedImportJobs, runImportJobWatchdog } from "../../../lib/content-import/engine.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const limit = Number(req.query?.limit || req.body?.limit) || 5;

  try {
    const schema = await ensureContentImportSchema();
    if (!schema.ok) {
      sendJson(res, 503, { ok: false, error: "content_import_schema_not_ready", schema });
      return;
    }
    const watchdog = await runImportJobWatchdog();
    const result = await processQueuedImportJobs(limit);
    sendJson(res, 200, { ok: true, schema: { ok: true, alreadyReady: schema.alreadyReady }, watchdog, ...result });
  } catch (err) {
    console.error("[cron/process-import-jobs]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
