/**
 * Cron — Majlis Knowledge Engine (Autonomous Platform 1.0).
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runMajlisKnowledgeEngine, runMkeHealthCheck } from "../../../lib/majlis-knowledge-engine/index.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const mode = req.query?.mode || req.body?.mode || "full";

  try {
    if (mode === "health") {
      const health = await runMkeHealthCheck();
      sendJson(res, health.ok ? 200 : 500, health);
      return;
    }

    const result = await runMajlisKnowledgeEngine({
      mode,
      triggerType: "cron",
      maxSources: Number(req.query?.maxSources) || undefined,
    });

    sendJson(res, result.ok ? 200 : 500, result);
  } catch (err) {
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
