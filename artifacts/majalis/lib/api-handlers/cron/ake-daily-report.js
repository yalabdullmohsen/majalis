import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { withCronTracking } from "../../../lib/auto-knowledge-engine/monitoring/cron-tracker.mjs";
import { generateDailyReport } from "../../../lib/auto-knowledge-engine/monitoring/daily-report.mjs";

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
    const result = await withCronTracking(
      "ake-daily-report",
      async () => generateDailyReport({ force: req.query?.force === "1" }),
      { schedule: "0 4 * * *" },
    );
    sendJson(res, result.ok ? 200 : 500, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
