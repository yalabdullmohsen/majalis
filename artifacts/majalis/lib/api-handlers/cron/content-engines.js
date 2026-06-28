import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runAllContentEngines } from "../../../lib/content-engines/index.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const mode = req.query?.mode || "incremental";
    const result =
      mode === "backfill"
        ? await (await import("../../../lib/content-engines/index.mjs")).runBackfillCurrentMonth()
        : await runAllContentEngines({ runType: "cron" });

    sendJson(res, result.ok ? 200 : 500, { ok: result.ok !== false, continuous: true, ...result });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message });
  }
}
