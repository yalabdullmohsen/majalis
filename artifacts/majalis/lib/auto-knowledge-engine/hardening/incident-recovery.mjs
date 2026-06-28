/**
 * Automatic incident recovery — self-healing for cron, DB, queue, RPC, connectors.
 */

import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { ensureAkeRpcFunctions } from "../rpc-probe.mjs";
import { recoverInterruptedWork } from "../recovery.mjs";
import { akeLog } from "../monitoring.mjs";

const WORKERS = ["orchestrator", "queue-processor", "connector-fetch", "ai-analyzer", "publisher"];

export async function recordIncident(admin, { type, severity = "warning", workerScope, error, recoveryAction, metadata = {} }) {
  if (!admin) return null;
  try {
    const { data } = await admin.from("ake_incident_log").insert({
      incident_type: type,
      severity,
      worker_scope: workerScope || null,
      status: "open",
      error_message: String(error || "").slice(0, 1000),
      recovery_action: recoveryAction || null,
      metadata,
    }).select("id").single();
    return data?.id;
  } catch {
    return null;
  }
}

export async function resolveIncident(admin, incidentId, action) {
  if (!admin || !incidentId) return;
  try {
    await admin.from("ake_incident_log").update({
      status: "resolved",
      recovery_action: action,
      resolved_at: new Date().toISOString(),
    }).eq("id", incidentId);
  } catch { /* ignore */ }
}

export async function heartbeatWorker(admin, workerId, workerType, status = "running", metrics = {}) {
  if (!admin) return;
  try {
    await admin.from("ake_worker_status").upsert({
      worker_id: workerId,
      worker_type: workerType,
      status,
      last_heartbeat_at: new Date().toISOString(),
      last_success_at: status === "running" ? new Date().toISOString() : undefined,
      metrics,
      updated_at: new Date().toISOString(),
    });
  } catch { /* table may not exist */ }
}

export async function recoverDatabaseConnection() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, action: "reconnect_failed", error: "no_admin" };
  }
  try {
    const { error } = await admin.from("ake_scheduler_state").select("id").limit(1);
    if (error) throw error;
    return { ok: true, action: "db_reconnected" };
  } catch (err) {
    return { ok: false, action: "db_unavailable", error: err.message };
  }
}

export async function recoverRpcFailures() {
  try {
    const repair = await ensureAkeRpcFunctions({ force: false });
    return { ok: repair.ok, action: repair.skipped ? "rpc_healthy" : "rpc_repaired", repair };
  } catch (err) {
    return { ok: false, action: "rpc_repair_failed", error: err.message };
  }
}

export async function recoverQueueCorruption(admin) {
  if (!admin) return { ok: false };
  const stats = await recoverInterruptedWork(admin, null, { recoveryLimit: 20 });
  return { ok: true, action: "queue_recovered", stats };
}

export async function recoverStuckCron(admin) {
  if (!admin) return { ok: false };
  const cutoff = new Date(Date.now() - 30 * 60_000).toISOString();
  try {
    const { data } = await admin
      .from("ake_cron_runs")
      .update({ status: "failed", error_message: "recovery_stuck_cron", finished_at: new Date().toISOString() })
      .eq("status", "running")
      .lt("started_at", cutoff)
      .select("id");
    return { ok: true, action: "cron_unstuck", count: (data || []).length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function runIncidentRecoveryCycle(admin = getSupabaseAdmin(), context = {}) {
  const results = [];

  await heartbeatWorker(admin, "orchestrator", "orchestrator", "running");

  const dbRecovery = await recoverDatabaseConnection();
  results.push({ type: "database", ...dbRecovery });
  if (!dbRecovery.ok) {
    await recordIncident(admin, {
      type: "database_unavailable",
      severity: "critical",
      workerScope: "global",
      error: dbRecovery.error,
      recoveryAction: "Check DATABASE_URL and Supabase status",
    });
    const { notifyHardeningAlert } = await import("./notifications.mjs");
    await notifyHardeningAlert("database_unavailable", { error: dbRecovery.error });
    return { ok: false, results, partial: true };
  }

  const rpcRecovery = await recoverRpcFailures();
  results.push({ type: "rpc", ...rpcRecovery });
  if (!rpcRecovery.ok) {
    await recordIncident(admin, {
      type: "rpc_failure",
      severity: "warning",
      workerScope: "rpc",
      error: rpcRecovery.error,
      recoveryAction: "Apply auto_knowledge_engine_v13_rpc_fix.sql",
    });
  }

  const queueRecovery = await recoverQueueCorruption(admin);
  results.push({ type: "queue", ...queueRecovery });

  const cronRecovery = await recoverStuckCron(admin);
  results.push({ type: "cron", ...cronRecovery });

  if (context.runId) {
    const workRecovery = await recoverInterruptedWork(admin, context.runId);
    results.push({ type: "pending_items", ok: true, stats: workRecovery });
  }

  akeLog("incident-recovery", { results: results.map((r) => r.type + ":" + (r.ok !== false ? "ok" : "fail")) });
  return { ok: true, results };
}

export async function getWorkerStatus(admin = getSupabaseAdmin()) {
  if (!admin) return [];
  try {
    const { data } = await admin.from("ake_worker_status").select("*").order("worker_id");
    return data || WORKERS.map((w) => ({ worker_id: w, status: "unknown" }));
  } catch {
    return WORKERS.map((w) => ({ worker_id: w, status: "unknown" }));
  }
}

export async function getOpenIncidents(admin = getSupabaseAdmin(), limit = 20) {
  if (!admin) return [];
  try {
    const { data } = await admin
      .from("ake_incident_log")
      .select("*")
      .in("status", ["open", "recovering"])
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

export { WORKERS };
