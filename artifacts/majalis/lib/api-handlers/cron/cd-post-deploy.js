/**
 * Cron — Post-deploy verification + self-healing (runs after production deploy).
 */
import { sendJson } from "../../api/_http.mjs";
import { runPostDeployVerification } from "../../../lib/cd/post-deploy-verify.mjs";
import { runZeroTouchActivation } from "../../../lib/zero-touch/index.mjs";
import { recordDeployment } from "../../../lib/cd/deploy-state.mjs";
import { sendDeploymentNotification } from "../../../lib/cd/notifications.mjs";
import { rollbackToPreviousHealthy } from "../../../lib/cd/vercel-client.mjs";

export default async function handler(req, res) {
  const cronHeader = req.headers["x-vercel-cron"];
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  const authorized =
    cronHeader === "1" ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!authorized) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const rollback = req.query?.rollback === "1" || req.body?.rollback === true;
    const zeroTouch = req.query?.legacy !== "1";

    let verify;
    let activation = null;

    if (zeroTouch) {
      activation = await runZeroTouchActivation({
        selfHeal: true,
        skipLocal: true,
        verifyCrons: false,
      });
      verify = activation.phases.automationVerify;
    } else {
      verify = await runPostDeployVerification({ selfHeal: true });
    }

    let rollbackResult = null;
    if (!verify.ok && rollback) {
      rollbackResult = await rollbackToPreviousHealthy(null);
    }

    await recordDeployment({
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA,
      branch: process.env.VERCEL_GIT_COMMIT_REF || "main",
      status: rollbackResult?.ok ? "rollback" : verify.ok ? "healthy" : "unhealthy",
      healthStatus: verify.healthy ? "healthy" : verify.ok ? "degraded" : "unhealthy",
      verifyDurationMs: verify.durationMs,
      failureChecks: verify.failedChecks,
      productionUrl: verify.productionUrl,
      selfHealActions: activation?.phases?.selfHealing?.actions?.slice(0, 10) || [],
      metadata: activation
        ? {
            healthScore: activation.healthScore,
            readinessPct: activation.readinessPct,
            manualIntervention: activation.manualIntervention?.length ?? 0,
          }
        : {},
    });

    if (!verify.ok) {
      await sendDeploymentNotification({
        status: rollbackResult?.ok ? "rollback" : "failure",
        title: rollbackResult?.ok ? "Auto Rollback After Failed Verification" : "Post-Deploy Verification Failed",
        reason: [
          ...verify.failedChecks,
          ...(activation?.manualIntervention?.slice(0, 3).map((m) => m.reason) || []),
        ].join(", "),
        commit: process.env.VERCEL_GIT_COMMIT_SHA,
        durationMs: verify.durationMs,
      });
    }

    sendJson(res, verify.ok || rollbackResult?.ok ? 200 : 503, {
      ok: verify.ok || rollbackResult?.ok,
      verify,
      activation: activation
        ? {
            healthScore: activation.healthScore,
            readinessPct: activation.readinessPct,
            audit: activation.audit,
            alerts: activation.alerts,
            manualIntervention: activation.manualIntervention,
          }
        : null,
      rollback: rollbackResult,
    });
  } catch (err) {
    console.error("[cron/cd-post-deploy]", err);
    sendJson(res, 500, { ok: false, error: err.message });
  }
}
