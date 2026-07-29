/**
 * Cron — Majlis Knowledge Engine.
 * mode=health stays fast inline; all other modes enqueue (202).
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runMkeHealthCheck } from "../../../lib/majlis-knowledge-engine/index.mjs";
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

const enqueue = createEnqueueCronHandler("majlis-knowledge-engine");

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const mode = req.query?.mode || req.body?.mode || "full";
  if (mode === "health") {
    try {
      const health = await runMkeHealthCheck();
      sendJson(res, health.ok ? 200 : 500, health);
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String(err?.message || err) });
    }
    return;
  }

  return enqueue(req, res);
}
