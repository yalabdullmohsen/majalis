import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runAllContentEngines } from "../../../lib/content-engines/index.mjs";
import { withCronTracking } from "../../../lib/auto-knowledge-engine/monitoring/cron-tracker.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const mode = req.query?.mode || "incremental";
    const result = await withCronTracking(
      "content-engines",
      async () => {
        const run =
          mode === "backfill"
            ? await (await import("../../../lib/content-engines/index.mjs")).runBackfillCurrentMonth()
            : await runAllContentEngines({ runType: "cron" });
        return { ok: run.ok !== false, continuous: true, ...run };
      },
      { schedule: "10,40 * * * *" },
    );

    sendJson(res, result.ok ? 200 : 500, result);
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message });
  }
}
