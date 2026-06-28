/**
 * Unified platform monitoring — connectors, engines, queue, crons, publisher, infra.
 */

import { getSystemHealth, CRON_ROUTES } from "./system-health.mjs";
import { getMonitoringDashboard } from "./auto-knowledge-engine/monitoring/dashboard.mjs";
import { getCircuitBreakerStats } from "./http/fetch-layer.mjs";
import { getInstagramGraphStatus, testInstagramConnection } from "./cms/instagram-graph-api.mjs";
import { getSupabaseAdmin } from "./supabase-admin.mjs";
import { getContentEngineStats } from "./content-engines/stats.mjs";

export async function getPlatformMonitoring() {
  const started = Date.now();
  const [systemHealth, akeMonitoring, engineStats, instagramStatus] = await Promise.all([
    getSystemHealth().catch((e) => ({ ok: false, error: e.message })),
    getMonitoringDashboard().catch((e) => ({ ok: false, error: e.message })),
    getContentEngineStats(7).catch((e) => ({ ok: false, error: e.message })),
    (async () => {
      const status = getInstagramGraphStatus();
      if (!status.configured) {
        return {
          ok: false,
          configured: false,
          failureReason: "instagram_connector_not_configured",
          message: "Instagram Graph API credentials not set — pipeline continues with other sources",
          envKeys: status.envKeys,
        };
      }
      const test = await testInstagramConnection();
      return {
        ok: test.ok,
        configured: true,
        account: test.account || null,
        failureReason: test.ok ? null : test.error || "graph_api_test_failed",
        tokenExpired: String(test.error || "").includes("token_expired"),
      };
    })(),
  ]);

  const admin = getSupabaseAdmin();
  let realtime = {
    lessons: 0,
    sheikhs: 0,
    connectors: 0,
    connectorsActive: 0,
    queuePending: 0,
    queueFailed: 0,
    publishedToday: 0,
    failedToday: 0,
    pendingReview: 0,
    avgProcessingMs: null,
    successRate: null,
    errorRate: null,
  };

  if (admin) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const since = dayStart.toISOString();

    const [
      { count: lessons },
      { count: sheikhs },
      { count: connectors },
      { count: connectorsActive },
      { count: publishedToday },
      { count: pendingReview },
      { data: runs },
      { data: queueRows },
    ] = await Promise.all([
      admin.from("lessons").select("id", { count: "exact", head: true }).eq("status", "approved"),
      admin.from("sheikhs").select("id", { count: "exact", head: true }),
      admin.from("ake_connectors").select("id", { count: "exact", head: true }),
      admin.from("ake_connectors").select("id", { count: "exact", head: true }).eq("is_active", true),
      admin.from("knowledge_items").select("id", { count: "exact", head: true }).eq("publish_status", "published").gte("published_at", since),
      admin.from("knowledge_items").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
      admin.from("content_engine_runs").select("duration_ms,status,errors").gte("started_at", since).limit(200),
      admin.from("ake_job_queue").select("status").in("status", ["pending", "failed"]),
    ]);

    const runList = runs || [];
    const durations = runList.map((r) => r.duration_ms).filter((n) => typeof n === "number" && n > 0);
    const successes = runList.filter((r) => r.status === "completed" || r.status === "success").length;
    const failedRuns = runList.filter((r) => r.status === "failed" || (r.errors && r.errors > 0)).length;
    const totalRuns = runList.length || 1;

    realtime = {
      lessons: lessons || 0,
      sheikhs: sheikhs || 0,
      connectors: connectors || 0,
      connectorsActive: connectorsActive || 0,
      queuePending: (queueRows || []).filter((r) => r.status === "pending").length,
      queueFailed: (queueRows || []).filter((r) => r.status === "failed").length,
      publishedToday: publishedToday || 0,
      failedToday: failedRuns,
      pendingReview: pendingReview || 0,
      avgProcessingMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
      successRate: Math.round((successes / totalRuns) * 100),
      errorRate: Math.round(((totalRuns - successes) / totalRuns) * 100),
    };
  }

  const crons = (CRON_ROUTES || []).map((route) => {
    const tracked = akeMonitoring.cronStatus?.find((c) => c.path === route.path || c.name === route.path);
    return {
      ...route,
      lastRun: tracked?.lastRun || null,
      lastStatus: tracked?.lastStatus || "unknown",
      durationMs: tracked?.durationMs || null,
      errorMessage: tracked?.errorMessage || null,
    };
  });

  return {
    ok: systemHealth.ok !== false,
    at: new Date().toISOString(),
    durationMs: Date.now() - started,
    systemStatus: akeMonitoring.systemStatus || (systemHealth.ok ? "healthy" : "degraded"),
    realtime,
    instagram: instagramStatus,
    systemHealth,
    akeMonitoring,
    contentEngines: engineStats,
    crons,
    circuitBreakers: getCircuitBreakerStats(),
    vercel: {
      nodeEnv: process.env.NODE_ENV || "development",
      region: process.env.VERCEL_REGION || null,
    },
  };
}
