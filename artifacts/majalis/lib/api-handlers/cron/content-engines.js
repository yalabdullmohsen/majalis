import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runAllContentEngines, runContentEngine, CRON_ORDER } from "../../../lib/content-engines/orchestrator.mjs";
import { CRON_BUDGET_MS } from "../../../lib/content-engines/budget.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const mode = req.query?.mode || "incremental";
    const engine = req.query?.engine;
    const isCronAuth = req.headers?.["x-vercel-cron"] === "1";

    if (mode === "backfill") {
      if (isCronAuth && req.query?.force !== "1") {
        sendJson(res, 200, {
          ok: true,
          deferred: true,
          message: "Backfill runs one step per /api/cron/content-engines-drain tick",
          use: "/api/cron/content-engines-drain?engine=backfill",
        });
        return;
      }
      const result = await runContentEngine("backfill", { runType: "backfill", budgetMs: CRON_BUDGET_MS, drain: true });
      sendJson(res, result.ok !== false ? 200 : 500, { ok: result.ok !== false, continuous: true, ...result });
      return;
    }

    if (engine) {
      const result = await runContentEngine(String(engine), { runType: "cron", budgetMs: CRON_BUDGET_MS });
      sendJson(res, result.ok !== false ? 200 : 500, {
        ok: result.ok !== false,
        engine,
        continuous: true,
        ...result,
      });
      return;
    }

    if (req.query?.all === "1") {
      if (isCronAuth) {
        sendJson(res, 400, {
          ok: false,
          error: "all_engines_blocked_on_cron",
          message: "Use /api/cron/content-engines-drain for sequential processing",
        });
        return;
      }
      const result = await runAllContentEngines({ runType: "manual" });
      sendJson(res, result.ok ? 200 : 500, { ok: result.ok !== false, continuous: true, all: true, ...result });
      return;
    }

    // One engine per cron tick — budget-wrapped, never all-at-once.
    const slot = Number(req.query?.slot);
    const engineId =
      CRON_ORDER[Number.isFinite(slot) ? slot % CRON_ORDER.length : Math.floor(Date.now() / (30 * 60 * 1000)) % CRON_ORDER.length];
    const result = await runContentEngine(engineId, { runType: "cron", budgetMs: CRON_BUDGET_MS });

    sendJson(res, result.ok !== false ? 200 : 500, {
      ok: result.ok !== false,
      continuous: true,
      rotated: true,
      engine: engineId,
      slot: Number.isFinite(slot) ? slot : undefined,
      ...result,
    });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message });
  }
}
