/**
 * GET/POST /api/cron/extract-telegram
 * Polls active Telegram channels and publishes new lessons directly.
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runTelegramExtraction } from "../../../lib/cms/telegram-extractor.mjs";

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
    const dryRun = req.query?.dryRun === "1" || req.body?.dryRun === true;
    const channelId = req.query?.channelId || req.body?.channelId || null;

    const result = await runTelegramExtraction({ dryRun, channelId });
    sendJson(res, result.ok ? 200 : 503, result);
  } catch (err) {
    console.error("[cron/extract-telegram]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
