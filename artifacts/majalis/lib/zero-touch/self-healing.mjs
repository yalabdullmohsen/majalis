/**
 * Phase 3 — Self-healing with retry, logging, and admin alerts (no silent failure).
 */
import { runProductionSelfHeal } from "../cd/self-heal.mjs";
import { logSelfHealEvent } from "../cd/deploy-state.mjs";
import { runAutomationRecoveryMigrations } from "../automation-recovery.mjs";
import { ensureAkeRpcFunctions } from "../auto-knowledge-engine/rpc-probe.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { detectMigrationState } from "./migration-detector.mjs";

const HEAL_SCOPES = [
  "automation-recovery",
  "smart-cms",
  "activation-tables",
  "ake-rpc",
  "question-generation",
  "akp-v3",
  "gke",
];

const RETRY_DELAYS_MS = [0, 3_000, 10_000];

async function triggerMigrationScope(base, cronSecret, scope) {
  if (!cronSecret) return { ok: false, error: "no_cron_secret", scope };
  try {
    const res = await fetch(`${base}/api/cron/apply-migrations?scope=${scope}`, {
      headers: { Authorization: `Bearer ${cronSecret}`, "x-vercel-cron": "1" },
      signal: AbortSignal.timeout(120_000),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && json.ok !== false, scope, status: res.status, json };
  } catch (err) {
    return { ok: false, scope, error: err.message };
  }
}

async function healMissingTablesLocally(options) {
  if (!process.env.DATABASE_URL) return { ok: false, skipped: true, reason: "no_database_url" };
  const result = await runAutomationRecoveryMigrations({
    force: options.force === true,
    includeSinJeem: false,
  });
  return { ok: result.ok, action: "automation_recovery_migrations", result };
}

async function healStuckWorkers() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: true, action: "skipped_no_admin" };

  const actions = [];
  const staleCutoff = new Date(Date.now() - 45 * 60_000).toISOString();

  for (const table of ["ake_job_queue", "content_import_jobs", "question_generation_jobs"]) {
    try {
      const col = table === "content_import_jobs" ? "updated_at" : "started_at";
      const { data, error } = await admin
        .from(table)
        .update({ status: "pending", last_error: "zero_touch_heal_reset" })
        .eq("status", "processing")
        .lt(col, staleCutoff)
        .select("id");
      if (!error) actions.push({ table, reset: (data || []).length });
    } catch {
      actions.push({ table, reset: 0, note: "table_missing_or_no_col" });
    }
  }

  return { ok: true, action: "workers_reset", actions };
}

async function healWithRetry(name, fn, maxAttempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const delay = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));

    try {
      const result = await fn();
      if (result?.ok !== false) {
        await logSelfHealEvent({
          component: "zero-touch",
          issueType: name,
          actionTaken: result.action || "healed",
          success: true,
          attempt,
        });
        return { name, success: true, attempt, ...result };
      }
      lastError = result?.error || "heal_failed";
    } catch (err) {
      lastError = err.message;
    }

    await logSelfHealEvent({
      component: "zero-touch",
      issueType: name,
      actionTaken: "retry",
      success: false,
      attempt,
      error: lastError,
    });
  }

  return { name, success: false, error: lastError, needsManualIntervention: true };
}

export async function runZeroTouchSelfHealing(options = {}) {
  const started = Date.now();
  const base = options.baseUrl || process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";
  const cronSecret = process.env.CRON_SECRET;
  const actions = [];
  const alerts = [];

  const migrationState = await detectMigrationState();
  const scopesNeedingHeal = migrationState.scopes
    .filter((s) => s.status === "failed" || s.status === "pending" || s.missingTables?.length)
    .map((s) => s.scope);

  const cdHeal = await runProductionSelfHeal({ baseUrl: base, maxAttempts: options.maxAttempts || 2 });
  actions.push({ phase: "cd_self_heal", ...cdHeal });

  if (process.env.DATABASE_URL) {
    const localMigrations = await healWithRetry("local_migrations", () => healMissingTablesLocally(options));
    actions.push(localMigrations);

    const rpcHeal = await healWithRetry("ake_rpc", () => ensureAkeRpcFunctions({ force: false }).then((r) => ({
      ok: r.ok,
      action: r.skipped ? "rpc_ok" : "rpc_repaired",
      result: r,
    })));
    actions.push(rpcHeal);
  } else if (cronSecret) {
    for (const scope of [...new Set([...scopesNeedingHeal, ...HEAL_SCOPES])].slice(0, 6)) {
      const heal = await healWithRetry(`migration_${scope}`, () => triggerMigrationScope(base, cronSecret, scope));
      actions.push(heal);
      if (!heal.success) {
        alerts.push({
          severity: "error",
          code: "migration_heal_failed",
          message: `فشل تطبيق scope=${scope}: ${heal.error}`,
        });
      }
    }
  } else {
    alerts.push({
      severity: "error",
      code: "no_heal_credentials",
      message: "لا DATABASE_URL ولا CRON_SECRET — لا يمكن الإصلاح التلقائي",
    });
  }

  const workerHeal = await healWithRetry("stuck_workers", healStuckWorkers);
  actions.push(workerHeal);

  const flatActions = actions.flatMap((a) => (a.actions ? a.actions : [a]));
  const failed = flatActions.filter((a) => a.success === false || (a.ok === false && !a.skipped));
  const healed = flatActions.filter((a) => a.success === true || a.ok === true);

  for (const f of failed) {
    if (f.needsManualIntervention !== false) {
      alerts.push({
        severity: "error",
        code: "heal_failed",
        message: `تعذر إصلاح ${f.name || f.phase}: ${f.error || "unknown"}`,
      });
    }
  }

  return {
    ok: failed.length === 0,
    healedCount: healed.length,
    failedCount: failed.length,
    actions: flatActions,
    alerts,
    durationMs: Date.now() - started,
  };
}
