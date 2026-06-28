/**
 * Production hardening dashboard data aggregator.
 */

import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { getAkeRpcHealth } from "../rpc-probe.mjs";
import { getConnectorHealthPanel } from "./connector-health.mjs";
import { getAnalyticsDashboard } from "./analytics.mjs";
import { getWorkerStatus, getOpenIncidents } from "./incident-recovery.mjs";
import { getFiqhMigrationStatus } from "./fiqh-migration.mjs";
import { getPendingDiscoveredSources } from "./source-discovery.mjs";
import { getOpenAlerts } from "../alerts.mjs";
import { getCronHealth } from "../monitoring/cron-tracker.mjs";
import { getOpenPipelineFailures } from "../monitoring/pipeline-failures.mjs";

export async function getHardeningDashboard(admin = getSupabaseAdmin()) {
  const at = new Date().toISOString();

  if (!admin) {
    return { ok: false, at, error: "no_admin", tablesReady: false };
  }

  const tablesReady = await probeHardeningTables(admin);

  const [
    rpcHealth,
    connectors,
    analytics,
    workers,
    incidents,
    fiqhMigration,
    discoveredSources,
    openAlerts,
    cronHealth,
    pipelineFailures,
    queueMetrics,
    retryQueue,
    rejectedQueue,
  ] = await Promise.all([
    getAkeRpcHealth(),
    getConnectorHealthPanel(admin),
    getAnalyticsDashboard(admin),
    getWorkerStatus(admin),
    getOpenIncidents(admin, 15),
    getFiqhMigrationStatus(admin),
    getPendingDiscoveredSources(admin, 10),
    getOpenAlerts(20),
    getCronHealth(20),
    getOpenPipelineFailures(15),
    getQueueMetrics(admin),
    getRetryQueue(admin),
    getRejectedQueue(admin),
  ]);

  const activeConnectors = connectors.filter((c) => c.isActive);
  const healthyCount = activeConnectors.filter((c) => c.health === "healthy").length;
  const degradedCount = activeConnectors.filter((c) => c.health === "degraded").length;
  const downCount = activeConnectors.filter((c) => c.health === "down").length;

  let systemStatus = "healthy";
  if (downCount > 0 || !rpcHealth.ok || incidents.some((i) => i.severity === "critical")) {
    systemStatus = "critical";
  } else if (degradedCount > 0 || openAlerts.some((a) => a.severity === "warning")) {
    systemStatus = "warning";
  }

  let engineStats = null;
  try {
    const { data } = await admin.rpc("ake_engine_stats", { p_days: 7 });
    engineStats = data;
  } catch { /* rpc may be unavailable */ }

  return {
    ok: true,
    at,
    tablesReady,
    systemStatus,
    rpc: {
      ok: rpcHealth.ok,
      engineStatsCallable: rpcHealth.engineStatsCallable,
      missingRequired: rpcHealth.missingRequired || [],
      missingGrants: rpcHealth.missingGrants || [],
      functions: rpcHealth.functions || [],
    },
    connectors: {
      total: connectors.length,
      active: activeConnectors.length,
      healthy: healthyCount,
      degraded: degradedCount,
      down: downCount,
      panel: connectors,
    },
    analytics,
    publishing24h: analytics.daily || {},
    workers,
    incidents,
    fiqhMigration,
    discoveredSources,
    openAlerts,
    cronStatus: cronHealth.runs || cronHealth.crons || [],
    pipelineFailures,
    queueMetrics,
    retryQueue,
    rejectedQueue,
    engineStats,
    pipeline: buildPipelineVisualization(analytics, queueMetrics),
  };
}

async function probeHardeningTables(admin) {
  try {
    const { error } = await admin.from("ake_publishing_analytics").select("id", { head: true, count: "exact" });
    return !error;
  } catch {
    return false;
  }
}

async function getQueueMetrics(admin) {
  try {
    const [{ count: pending }, { count: running }, { count: failed }] = await Promise.all([
      admin.from("ake_job_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("ake_job_queue").select("id", { count: "exact", head: true }).eq("status", "running"),
      admin.from("ake_job_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
    ]);
    return { pending: pending || 0, running: running || 0, failed: failed || 0 };
  } catch {
    return { pending: 0, running: 0, failed: 0 };
  }
}

async function getRetryQueue(admin, limit = 15) {
  try {
    const { data } = await admin
      .from("ake_job_queue")
      .select("id, job_type, status, attempts, last_error, scheduled_at, connector_id")
      .in("status", ["pending", "failed"])
      .order("scheduled_at", { ascending: true })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

async function getRejectedQueue(admin, limit = 15) {
  try {
    const { data } = await admin
      .from("ake_rejection_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    try {
      const { data } = await admin
        .from("knowledge_items")
        .select("external_id, raw_title, content_kind, verification_status, updated_at")
        .eq("publish_status", "rejected")
        .order("updated_at", { ascending: false })
        .limit(limit);
      return data || [];
    } catch {
      return [];
    }
  }
}

function buildPipelineVisualization(analytics, queueMetrics) {
  const daily = analytics.daily || {};
  return {
    stages: [
      { name: "discovered", count: daily.items_discovered || 0 },
      { name: "parsed", count: daily.items_parsed || 0 },
      { name: "published", count: daily.items_published || 0 },
      { name: "rejected", count: daily.items_rejected || 0 },
      { name: "duplicate", count: daily.items_duplicate || 0 },
    ],
    queue: queueMetrics,
    avgAiConfidence: daily.avg_ai_confidence || 0,
  };
}

export async function ensureHardeningSchema(admin) {
  try {
    const { applyMigrations } = await import("../../db-migrate.mjs");
    return await applyMigrations({
      files: ["auto_knowledge_engine_v19_hardening.sql"],
      continueOnError: false,
      trackApplied: true,
    });
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
