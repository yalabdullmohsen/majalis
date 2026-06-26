/**
 * Observability — unified health, cron status, AI status, metrics.
 */

import { getSystemHealth } from "../system-health.mjs";
import { CRON_SCHEDULE, PIPELINE_STAGES } from "./config.mjs";
import { getRecentEvents } from "./audit.mjs";

export async function getAutonomousObservability(admin) {
  const started = Date.now();
  const systemHealth = await getSystemHealth().catch(() => ({ ok: false }));

  let platformStats = {};
  if (admin) {
    try {
      const { data } = await admin.rpc("autonomous_platform_stats", { days: 7 });
      platformStats = data || {};
    } catch {
      /* stats RPC may not exist */
    }
  }

  const recentEvents = await getRecentEvents(admin, { limit: 20 });
  const failedEvents = recentEvents.filter((e) => !e.success);
  const rejectionReasons = failedEvents.reduce((acc, e) => {
    const reason = e.metadata?.rejectReason || e.message || "unknown";
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  const totalEvents = Number(platformStats.events_total) || recentEvents.length;
  const failedCount = Number(platformStats.events_failed) || failedEvents.length;
  const successRate = totalEvents ? Math.round(((totalEvents - failedCount) / totalEvents) * 1000) / 10 : 100;

  const cronJobs = Object.entries(CRON_SCHEDULE).map(([name, schedule]) => ({
    name,
    schedule,
    path: name === "orchestrator" ? "/api/cron/autonomous-orchestrator" : `/api/cron/${name.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
    status: systemHealth.ok ? "healthy" : "degraded",
  }));

  return {
    ok: systemHealth.ok !== false,
    at: new Date().toISOString(),
    durationMs: Date.now() - started,
    cronJobs,
    ai: {
      status: systemHealth.env?.openai || systemHealth.env?.anthropic ? "configured" : "limited",
      openai: Boolean(process.env.OPENAI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      metadataOnly: true,
      generatesReligiousText: false,
    },
    database: {
      status: systemHealth.supabase?.status || (admin ? "connected" : "disconnected"),
      serviceRole: Boolean(admin),
    },
    sources: {
      total: systemHealth.metrics?.sourcesTotal ?? 0,
      active: systemHealth.metrics?.sourcesActive ?? 0,
      connectorsHealthy: systemHealth.metrics?.connectorsHealthy ?? 0,
    },
    metrics: {
      itemsNew: platformStats.items_published ?? systemHealth.metrics?.itemsNewToday ?? 0,
      itemsUpdated: platformStats.items_updated ?? 0,
      itemsRejected: platformStats.items_rejected ?? 0,
      runsTotal: platformStats.runs_total ?? 0,
      runsSuccess: platformStats.runs_success ?? 0,
      successRate,
      avgDurationMs: systemHealth.durationMs ?? 0,
      retryPending: platformStats.retry_pending ?? 0,
      dailyContentCount: platformStats.daily_content_count ?? 0,
    },
    rejectionReasons,
    pipelineStages: PIPELINE_STAGES.length,
    recentEvents: recentEvents.slice(0, 10),
    systemHealth,
  };
}
