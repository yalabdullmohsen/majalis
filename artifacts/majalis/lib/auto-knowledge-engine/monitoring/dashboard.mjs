/**
 * Monitoring dashboard data aggregator.
 */

import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { getOpenAlerts } from "../alerts.mjs";
import { getCronHealth } from "./cron-tracker.mjs";
import { getOpenPipelineFailures } from "./pipeline-failures.mjs";
import { getRecentSourceHealthEvents } from "./source-health-events.mjs";
import { getDailyReportHistory } from "./daily-report.mjs";
import { AKE_MONITORED_CRONS } from "./cron-registry.mjs";

export async function getMonitoringDashboard() {
  const admin = getSupabaseAdmin();
  const now = new Date();
  const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const [openAlerts, criticalAlerts, cronHealth, pipelineFailures, sourceEvents, reports] = await Promise.all([
    getOpenAlerts(100),
    getOpenAlerts(20, { severity: "critical" }),
    getCronHealth(40),
    getOpenPipelineFailures(30),
    getRecentSourceHealthEvents(25),
    getDailyReportHistory(7),
  ]);

  let publishing24h = {
    lessons: 0,
    benefits: 0,
    questions: 0,
    knowledgePublished: 0,
    fetched: 0,
    rejected: 0,
  };
  let systemStatus = "unknown";
  let scheduler = null;
  let connectorsSummary = { active: 0, healthy: 0, failing: 0 };

  if (admin) {
    const [
      { count: lessons },
      { count: benefits },
      { count: questions },
      { data: cycles },
      { data: sched },
      { data: connectors },
    ] = await Promise.all([
      admin.from("lessons").select("id", { count: "exact", head: true }).gte("created_at", since24h),
      admin.from("fawaid").select("id", { count: "exact", head: true }).gte("created_at", since24h),
      admin.from("qa_questions").select("id", { count: "exact", head: true }).gte("created_at", since24h),
      admin.from("ake_cycle_metrics").select("published,fetched,rejected").gte("created_at", since24h),
      admin.from("ake_scheduler_state").select("*").eq("id", "global").maybeSingle(),
      admin.from("ake_connectors").select("is_active, health_status"),
    ]);

    publishing24h = {
      lessons: lessons || 0,
      benefits: benefits || 0,
      questions: questions || 0,
      knowledgePublished: (cycles || []).reduce((s, c) => s + (c.published || 0), 0),
      fetched: (cycles || []).reduce((s, c) => s + (c.fetched || 0), 0),
      rejected: (cycles || []).reduce((s, c) => s + (c.rejected || 0), 0),
    };

    scheduler = sched;
    const active = (connectors || []).filter((c) => c.is_active);
    connectorsSummary = {
      active: active.length,
      healthy: active.filter((c) => c.health_status === "healthy").length,
      failing: active.filter((c) => c.health_status === "down" || c.health_status === "degraded").length,
    };

    if (criticalAlerts.length > 0) systemStatus = "critical";
    else if (openAlerts.length > 0) systemStatus = "warning";
    else if (connectorsSummary.active > 0) systemStatus = "healthy";
    else systemStatus = "idle";
  }

  const cronStatus = AKE_MONITORED_CRONS.map((def) => {
    const last = cronHealth.crons.find((c) => c.cron_name === def.name);
    return {
      ...def,
      lastRun: last?.started_at || null,
      lastStatus: last?.status || "unknown",
      durationMs: last?.duration_ms,
      errorMessage: last?.error_message,
    };
  });

  return {
    ok: true,
    at: now.toISOString(),
    systemStatus,
    connectors: connectorsSummary,
    scheduler,
    publishing24h,
    openAlerts,
    criticalAlerts,
    cronStatus,
    pipelineFailures,
    sourceEvents,
    dailyReports: reports,
    tablesReady: Boolean(admin),
  };
}
