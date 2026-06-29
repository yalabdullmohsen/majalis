import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { buildProductionLockdownReport, runAutomationRecoveryMigrations } from "../../../lib/production-lockdown/report.mjs";

export default async function handler(req, res) {
  const action = req.query?.action || req.body?.action || "report";

  if (action === "recovery" && !validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  try {
    if (action === "recovery") {
      const recovery = await runAutomationRecoveryMigrations({
        force: req.query?.force === "1",
      });
      sendJson(res, recovery.ok ? 200 : 500, { ok: recovery.ok, action: "recovery", recovery });
      return;
    }

    const report = await buildProductionLockdownReport({
      base: req.query?.base || process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com",
      verifyCrons: req.query?.verifyCrons === "1" && validateCronAuth(req),
      skipLocal: true,
      cronSecret: process.env.CRON_SECRET,
    });

    sendJson(res, 200, { ok: true, report });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
