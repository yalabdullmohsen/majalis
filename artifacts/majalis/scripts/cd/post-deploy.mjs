#!/usr/bin/env node
/**
 * Post-deploy verification + optional rollback.
 *
 * Usage:
 *   node scripts/cd/post-deploy.mjs
 *   node scripts/cd/post-deploy.mjs --rollback-on-failure
 *   node scripts/cd/post-deploy.mjs --json
 */
import { runPostDeployVerification } from "../../lib/cd/post-deploy-verify.mjs";
import { rollbackToPreviousHealthy, waitForProductionDeploy } from "../../lib/cd/vercel-client.mjs";
import { recordDeployment } from "../../lib/cd/deploy-state.mjs";
import { sendDeploymentNotification } from "../../lib/cd/notifications.mjs";
import { runProductionSelfHeal } from "../../lib/cd/self-heal.mjs";

const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const rollbackOnFailure = args.includes("--rollback-on-failure");
const commitSha = process.env.GITHUB_SHA || args.find((a) => a.startsWith("--sha="))?.slice(6);

const started = Date.now();

if (process.argv.includes("--wait-deploy")) {
  const deploy = await waitForProductionDeploy({ commitSha, timeoutMs: 300_000 });
  if (!deploy.ok && !deploy.skipped) {
    console.error("Deploy wait failed:", deploy.error);
    process.exit(1);
  }
  if (deploy.skipped) console.warn("Deploy wait skipped:", deploy.reason);
  else console.log("Deploy ready:", deploy.deploymentId);
}

const verify = await runPostDeployVerification({ selfHeal: true });

let rollback = null;
if (!verify.ok && rollbackOnFailure) {
  rollback = await rollbackToPreviousHealthy(null);
  if (rollback.ok) {
    await runProductionSelfHeal();
    await sendDeploymentNotification({
      status: "rollback",
      title: "Production Rollback Executed",
      reason: `Post-deploy checks failed: ${verify.failedChecks.join(", ")}`,
      commit: commitSha,
      branch: "main",
      durationMs: Date.now() - started,
      fixApplied: `Rolled back to ${rollback.rolledBackTo?.id}`,
    });
  }
}

await recordDeployment({
  commitSha,
  branch: "main",
  status: rollback?.ok ? "rollback" : verify.ok ? "healthy" : "unhealthy",
  healthStatus: verify.healthy ? "healthy" : verify.ok ? "degraded" : "unhealthy",
  verifyDurationMs: verify.durationMs,
  failureChecks: verify.failedChecks,
  selfHealActions: verify.checks.find((c) => c.id === "self_heal")?.details || [],
  metadata: { checks: verify.checks.map((c) => ({ id: c.id, ok: c.ok })) },
});

if (verify.ok) {
  await sendDeploymentNotification({
    status: "success",
    title: "Production Deployment Healthy",
    commit: commitSha,
    branch: "main",
    durationMs: Date.now() - started,
  });
} else if (!rollback?.ok) {
  await sendDeploymentNotification({
    status: "failure",
    title: "Post-Deploy Verification Failed",
    reason: verify.failedChecks.join(", "),
    commit: commitSha,
    branch: "main",
    durationMs: Date.now() - started,
  });
}

const report = { verify, rollback, durationMs: Date.now() - started };
if (jsonOut) console.log(JSON.stringify(report, null, 2));
else {
  console.log("\n=== Post-Deploy Verification ===");
  for (const c of verify.checks) console.log(`  ${c.ok ? "✓" : "✗"} ${c.label}`);
  if (rollback) console.log(`Rollback: ${rollback.ok ? "SUCCESS" : rollback.error}`);
}

process.exit(verify.ok || rollback?.ok ? 0 : 1);
