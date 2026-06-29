/**
 * Zero-Touch Production Activation — orchestrator for all 7 phases.
 */
import { buildProductionLockdownReport } from "../production-lockdown/report.mjs";
import { runStartupValidation } from "./startup-validation.mjs";
import { detectMigrationState } from "./migration-detector.mjs";
import { runZeroTouchSelfHealing } from "./self-healing.mjs";
import { computeUnifiedHealthScore } from "./health-score.mjs";
import { runAutomationVerification } from "./automation-verify.mjs";
import { getDeploymentDashboardStats } from "../cd/deploy-state.mjs";

/**
 * Full zero-touch activation cycle — run after deploy or on demand.
 */
export async function runZeroTouchActivation(options = {}) {
  const started = Date.now();
  const base = options.base || process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";
  const phases = {};

  if (options.selfHeal !== false) {
    phases.selfHealing = await runZeroTouchSelfHealing({ baseUrl: base, ...options });
  }

  phases.startupValidation = await runStartupValidation();
  phases.migrationState = await detectMigrationState();

  phases.automationVerify = await runAutomationVerification({
    baseUrl: base,
    selfHeal: false,
  });

  phases.lockdown = await buildProductionLockdownReport({
    base,
    skipLocal: options.skipLocal !== false,
    verifyCrons: options.verifyCrons === true,
    cronSecret: process.env.CRON_SECRET,
  });

  phases.health = computeUnifiedHealthScore({
    startupValidation: phases.startupValidation,
    migrationState: phases.migrationState,
    lockdown: phases.lockdown,
    automationVerify: phases.automationVerify,
  });

  const deployStats = await getDeploymentDashboardStats();

  const audit = buildFinalProductionAudit({
    phases,
    deployStats,
    durationMs: Date.now() - started,
  });

  const alerts = [
    ...(phases.startupValidation.alerts || []),
    ...(phases.selfHealing?.alerts || []),
  ];

  const manualIntervention = collectManualInterventionItems(phases);

  return {
    ok: audit.deployVerified && audit.healthScore >= (options.minHealthScore || 60),
    at: new Date().toISOString(),
    base,
    healthScore: phases.health.healthScore,
    readinessPct: phases.health.readinessPct,
    phases,
    audit,
    alerts,
    manualIntervention,
    durationMs: Date.now() - started,
  };
}

function collectManualInterventionItems(phases) {
  const items = [];

  for (const issue of phases.startupValidation?.issues || []) {
    if (!issue.autoFixable) {
      items.push({ type: issue.type, name: issue.name, reason: "يتطلب صلاحيات أو إعداد يدوي" });
    }
  }

  for (const alert of phases.selfHealing?.alerts || []) {
    if (alert.severity === "error") {
      items.push({ type: "heal_failed", name: alert.code, reason: alert.message });
    }
  }

  for (const f of phases.migrationState?.failed?.items || []) {
    items.push({ type: "migration_failed", name: f.migration, reason: f.reason });
  }

  for (const scope of phases.migrationState?.scopes || []) {
    if (scope.missingTables?.length) {
      items.push({
        type: "scope_incomplete",
        name: scope.scope,
        reason: `جداول ناقصة: ${scope.missingTables.join(", ")}`,
      });
    }
  }

  return items;
}

/**
 * Phase 7 — Final production audit report.
 */
export function buildFinalProductionAudit({ phases, deployStats, durationMs }) {
  const validation = phases.startupValidation || {};
  const migrations = phases.migrationState || {};
  const lockdown = phases.lockdown || {};
  const verify = phases.automationVerify || {};
  const health = phases.health || {};

  const systems = lockdown.systems || [];
  const operational = systems.filter((s) => s.status === "operational").length;
  const crons = lockdown.crons || [];
  const cronsOk = crons.filter((c) => c.endpointReachable && c.lastResult !== "failed").length;

  return {
    readinessPct: health.readinessPct ?? lockdown.readinessPct ?? 0,
    healthScore: health.healthScore ?? lockdown.healthScore ?? 0,
    tablesEnabled: `${validation.tables?.present ?? 0}/${validation.tables?.expected ?? 0}`,
    migrationsApplied: migrations.applied?.count ?? 0,
    migrationsPending: migrations.pending?.count ?? 0,
    migrationsFailed: migrations.failed?.count ?? 0,
    cronJobsWorking: `${cronsOk}/${crons.length}`,
    workersStatus: verify.checks?.find((c) => c.id === "workers")?.ok ? "operational" : "degraded",
    queueStatus: verify.checks?.find((c) => c.id === "queue")?.ok ? "operational" : "degraded",
    systemsOperational: `${operational}/${systems.length}`,
    deployVerified: verify.ok,
    deployHealthy: verify.deploySuccess,
    failedChecks: verify.failedChecks || [],
    criticalErrors: (phases.selfHealing?.failedCount ?? 0) + (validation.criticalCount ?? 0),
    healthBreakdown: health.breakdown || [],
    healthDeductions: health.deductions || [],
    lastDeployment: deployStats.lastDeployment,
    lastPipelineRun: deployStats.lastPipelineRun,
    selfHealEvents: deployStats.selfHealEvents?.slice(0, 10) || [],
    durationMs,
  };
}

export { runStartupValidation } from "./startup-validation.mjs";
export { detectMigrationState } from "./migration-detector.mjs";
export { runZeroTouchSelfHealing } from "./self-healing.mjs";
export { computeUnifiedHealthScore } from "./health-score.mjs";
export { runAutomationVerification } from "./automation-verify.mjs";
