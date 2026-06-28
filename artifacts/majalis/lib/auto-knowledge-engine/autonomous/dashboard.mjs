/**
 * Autonomous platform dashboard data.
 */

import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { getMonitoringDashboard } from "../monitoring/dashboard.mjs";
import { getRecentRejections, getTopRejectionReasons } from "./rejection-log.mjs";
import { getPeriodicReportHistory } from "./reporting.mjs";
import { AUTONOMOUS_PIPELINE_STAGES, CONTENT_TYPE_TARGETS } from "./pipeline-stages.mjs";
import { getContentEngineStats } from "../../content-engines/stats.mjs";

export async function getAutonomousDashboard() {
  const admin = getSupabaseAdmin();
  const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const [monitoring, rejections, topRejections, hourlyReports, weeklyReports, engineStats] = await Promise.all([
    getMonitoringDashboard(),
    getRecentRejections(30, { since: since24h }),
    getTopRejectionReasons(since24h, 10),
    getPeriodicReportHistory("hourly", 24),
    getPeriodicReportHistory("weekly", 8),
    getContentEngineStats().catch(() => null),
  ]);

  let queueSize = 0;
  let pendingReview = 0;
  if (admin) {
    const [{ count: q }, { count: r }] = await Promise.all([
      admin.from("ake_job_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("knowledge_items").select("id", { count: "exact", head: true }).eq("publish_status", "review"),
    ]);
    queueSize = q || 0;
    pendingReview = r || 0;
  }

  return {
    ok: true,
    at: new Date().toISOString(),
    systemStatus: monitoring.systemStatus,
    pipelineStages: AUTONOMOUS_PIPELINE_STAGES,
    contentTypes: CONTENT_TYPE_TARGETS,
    monitoring,
    queue: { pending: queueSize, review: pendingReview },
    rejections24h: rejections,
    topRejectionReasons: topRejections,
    hourlyReports,
    weeklyReports,
    contentEngines: engineStats,
    publishing24h: monitoring.publishing24h,
    connectors: monitoring.connectors,
  };
}
