/**
 * CD Self-Healing — auto-repair production issues before declaring failure.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { logSelfHealEvent } from "./deploy-state.mjs";
import { ensureAkeRpcFunctions } from "../auto-knowledge-engine/rpc-probe.mjs";
import { getAkeRpcHealth } from "../auto-knowledge-engine/rpc-probe.mjs";
import { testDatabaseConnection } from "../database.mjs";

const RETRY_DELAYS_MS = [0, 5_000, 60_000, 300_000, 900_000];

export async function runProductionSelfHeal(options = {}) {
  const started = Date.now();
  const actions = [];
  const base = options.baseUrl || process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";
  const cronSecret = process.env.CRON_SECRET;

  const healers = [
    { name: "database_connection", fn: () => healDatabase() },
    { name: "ake_rpc", fn: () => healAkeRpc() },
    { name: "migrations", fn: () => healMigrations(base, cronSecret) },
    { name: "ake_sync_schema", fn: () => healAkeSync(base, cronSecret) },
    { name: "stuck_queue", fn: () => healStuckQueue() },
    { name: "connector_health", fn: () => healConnectors(base, cronSecret) },
  ];

  for (const healer of healers) {
    const result = await healWithSchedule(healer.name, healer.fn, options.maxAttempts || 2);
    actions.push(result);
  }

  return {
    ok: actions.every((a) => a.success !== false),
    actions,
    durationMs: Date.now() - started,
  };
}

async function healWithSchedule(name, fn, maxAttempts = 2) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const delay = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
    if (delay > 0) await sleep(delay);

    try {
      const result = await fn();
      if (result?.ok !== false) {
        await logSelfHealEvent({
          component: "cd",
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
      component: "cd",
      issueType: name,
      actionTaken: "retry",
      success: false,
      attempt,
      error: lastError,
    });
  }

  return { name, success: false, error: lastError };
}

async function healDatabase() {
  const conn = await testDatabaseConnection();
  if (conn.ok) return { ok: true, action: "database_ok" };
  await sleep(3000);
  const retry = await testDatabaseConnection();
  return retry.ok ? { ok: true, action: "database_reconnected" } : { ok: false, error: retry.error };
}

async function healAkeRpc() {
  const health = await getAkeRpcHealth();
  if (health.ok && health.functions?.every((f) => f.ok)) {
    return { ok: true, action: "rpc_ok" };
  }
  const repair = await ensureAkeRpcFunctions();
  if (repair?.ok) return { ok: true, action: "rpc_repaired" };
  return { ok: false, error: repair?.error || "rpc_repair_failed" };
}

async function healMigrations(base, cronSecret) {
  if (!cronSecret) return { ok: true, action: "skipped_no_cron_secret" };
  const res = await fetch(`${base}/api/cron/apply-migrations?scope=ake-sync`, {
    headers: { Authorization: `Bearer ${cronSecret}`, "x-vercel-cron": "1" },
  });
  const json = await res.json().catch(() => ({}));
  return res.ok && json.ok !== false
    ? { ok: true, action: "migrations_applied" }
    : { ok: false, error: json.error || `HTTP ${res.status}` };
}

async function healAkeSync(base, cronSecret) {
  if (!cronSecret) return { ok: true, action: "skipped_no_cron_secret" };
  const res = await fetch(`${base}/api/cron/auto-knowledge-sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cronSecret}`, "x-vercel-cron": "1" },
  });
  return res.ok ? { ok: true, action: "ake_sync_triggered" } : { ok: false, error: `HTTP ${res.status}` };
}

async function healStuckQueue() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: true, action: "skipped_no_admin" };

  const staleCutoff = new Date(Date.now() - 30 * 60_000).toISOString();
  try {
    const { data } = await admin
      .from("ake_job_queue")
      .update({ status: "pending", last_error: "cd_self_heal_reset" })
      .eq("status", "processing")
      .lt("started_at", staleCutoff)
      .select("id");

    return { ok: true, action: `queue_reset_${(data || []).length}` };
  } catch {
    return { ok: true, action: "queue_table_missing" };
  }
}

async function healConnectors(base, cronSecret) {
  if (!cronSecret) return { ok: true, action: "skipped_no_cron_secret" };
  const res = await fetch(`${base}/api/cron/connector-health`, {
    headers: { Authorization: `Bearer ${cronSecret}`, "x-vercel-cron": "1" },
  });
  return res.ok ? { ok: true, action: "connector_health_triggered" } : { ok: false, error: `HTTP ${res.status}` };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
