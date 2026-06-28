import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { withCronTracking } from "../../../lib/auto-knowledge-engine/monitoring/cron-tracker.mjs";
import { runAutonomousPlatformCycle } from "../../../lib/auto-knowledge-engine/autonomous/orchestrator.mjs";
import { generatePeriodicReport } from "../../../lib/auto-knowledge-engine/autonomous/reporting.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const result = await withCronTracking(
      "autonomous-platform-cycle",
      async () => {
        const cycle = await runAutonomousPlatformCycle({ triggerType: "cron" });
        const hour = new Date().getUTCHours();
        const reports = [];
        if (hour === 4) reports.push(await generatePeriodicReport("daily", { force: false }));
        if (hour === 4 && new Date().getUTCDay() === 1) reports.push(await generatePeriodicReport("weekly"));
        if (hour === 4 && new Date().getUTCDate() === 1) reports.push(await generatePeriodicReport("monthly"));
        if (req.query?.hourly === "1") reports.push(await generatePeriodicReport("hourly", { force: true }));
        return { ...cycle, reports };
      },
      { schedule: "*/15 * * * *" },
    );
    sendJson(res, result.ok ? 200 : 500, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
