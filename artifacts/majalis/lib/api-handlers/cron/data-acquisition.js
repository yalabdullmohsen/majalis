import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runAcquisitionEngine, runDedupCleanup } from "../../../lib/data-acquisition/index.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "unauthorized" });
    return;
  }

  const mode = String(req.query?.mode || "hourly");
  let result;

  if (mode === "dedup") {
    result = await runDedupCleanup();
  } else if (mode === "daily") {
    const fetchResult = await runAcquisitionEngine({ mode: "daily", triggerType: "cron" });
    const dedupResult = await runDedupCleanup();
    result = { fetch: fetchResult, dedup: dedupResult };
  } else if (mode === "weekly") {
    result = {
      daily: await runAcquisitionEngine({ mode: "daily", triggerType: "cron" }),
      dedup: await runDedupCleanup(),
      report: { generatedAt: new Date().toISOString(), mode: "weekly" },
    };
  } else {
    result = await runAcquisitionEngine({ mode: "hourly", triggerType: "cron" });
  }

  sendJson(res, 200, { ok: true, mode, result });
}
