import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { drainContentEngineQueue } from "../../../lib/content-engines/work-queue.mjs";

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
    const engineId = req.query?.engine || req.body?.engineId || undefined;
    const slot = Number(req.query?.slot);
    const result = await drainContentEngineQueue({
      engineId,
      slot: Number.isFinite(slot) ? slot : undefined,
      budgetMs: Number(req.query?.budgetMs) || 50_000,
      force: req.query?.force === "1",
    });
    sendJson(res, 200, { ok: true, drain: true, ...result });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
