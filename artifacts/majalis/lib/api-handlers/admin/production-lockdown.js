import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { buildProductionLockdownReport, runAutomationRecoveryMigrations } from "../../../lib/production-lockdown/report.mjs";
import { runZeroTouchActivation, runZeroTouchSelfHealing } from "../../../lib/zero-touch/index.mjs";

export default async function handler(req, res) {
  const action = req.query?.action || req.body?.action || "report";

  if (["recovery", "activate", "self-heal"].includes(action) && !validateCronAuth(req)) {
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

    if (action === "self-heal") {
      const heal = await runZeroTouchSelfHealing({
        baseUrl: req.query?.base || process.env.MAJALIS_PRODUCTION_URL,
      });
      sendJson(res, heal.ok ? 200 : 503, { ok: heal.ok, action: "self-heal", heal });
      return;
    }

    if (action === "activate") {
      const activation = await runZeroTouchActivation({
        base: req.query?.base || process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com",
        selfHeal: req.query?.selfHeal !== "0",
        verifyCrons: req.query?.verifyCrons === "1",
        skipLocal: true,
      });
      sendJson(res, activation.ok ? 200 : 503, { ok: activation.ok, action: "activate", activation });
      return;
    }

    const useZeroTouch = req.query?.zeroTouch === "1" || req.query?.action === "readiness";

    if (useZeroTouch) {
      const activation = await runZeroTouchActivation({
        base: req.query?.base || process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com",
        selfHeal: false,
        verifyCrons: req.query?.verifyCrons === "1" && validateCronAuth(req),
        skipLocal: true,
      });
      sendJson(res, 200, {
        ok: true,
        report: {
          ...activation.phases.lockdown,
          healthScore: activation.healthScore,
          readinessPct: activation.readinessPct,
          zeroTouch: {
            startupValidation: activation.phases.startupValidation,
            migrationState: activation.phases.migrationState,
            automationVerify: {
              ok: activation.phases.automationVerify.ok,
              failedChecks: activation.phases.automationVerify.failedChecks,
              checks: activation.phases.automationVerify.checks?.slice(0, 20),
            },
            health: activation.phases.health,
            audit: activation.audit,
            alerts: activation.alerts,
            manualIntervention: activation.manualIntervention,
          },
        },
      });
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
