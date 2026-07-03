/**
 * Cron: Process Telegram extraction queue.
 * Runs AI extraction on pending channel posts.
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { processExtractionQueue } from "../../../lib/telegram/queue-processor.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 403, { ok: false, error: "unauthorized" });
    return;
  }

  try {
    const batchSize = Number(req.query?.batch || req.body?.batch) || 5;
    const result = await processExtractionQueue({ batchSize });
    sendJson(res, 200, { ok: true, ...result, at: new Date().toISOString() });
  } catch (err) {
    console.error("[cron/telegram-processor]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
