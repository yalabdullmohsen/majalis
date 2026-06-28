import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runAllContentEngines, runContentEngine, CRON_ORDER } from "../../../lib/content-engines/orchestrator.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const mode = req.query?.mode || "incremental";
    const engine = req.query?.engine;

    if (mode === "backfill") {
      const result = await (await import("../../../lib/content-engines/index.mjs")).runBackfillCurrentMonth();
      sendJson(res, result.ok ? 200 : 500, { ok: result.ok !== false, continuous: true, ...result });
      return;
    }

    if (engine) {
      const result = await runContentEngine(String(engine), { runType: "cron" });
      sendJson(res, result.ok !== false ? 200 : 500, {
        ok: result.ok !== false,
        engine,
        continuous: true,
        ...result,
      });
      return;
    }

    if (req.query?.all === "1") {
      const result = await runAllContentEngines({ runType: "cron" });
      sendJson(res, result.ok ? 200 : 500, { ok: result.ok !== false, continuous: true, all: true, ...result });
      return;
    }

    // One engine per cron tick — avoids Vercel 60s handler timeout.
    const slot = Number(req.query?.slot);
    const engineId =
      CRON_ORDER[Number.isFinite(slot) ? slot % CRON_ORDER.length : Math.floor(Date.now() / (30 * 60 * 1000)) % CRON_ORDER.length];
    const result = await runContentEngine(engineId, { runType: "cron" });

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
