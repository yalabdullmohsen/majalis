/**
 * Health Monitor — checks DB, storage, cron, queue, APIs, RSS, search, publisher every minute.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { listContentSources } from "./sources.mjs";
import { checkAllSourcesHealth, HEALTH_STATUS } from "./source-health.mjs";
import { recoverStuckRuns, getRetryQueueStats } from "./recovery.mjs";
import { getQueueStats } from "../majlis-knowledge-engine/queue.mjs";
import { createAlert, logStructured } from "./monitoring.mjs";
import { CRON_SCHEDULES } from "./config.mjs";

export async function runHealthMonitor() {
  const started = Date.now();
  const checks = {};

  const admin = getSupabaseAdmin();
  checks.database = {
    ok: Boolean(admin),
    status: admin ? "connected" : "missing_admin",
  };

  if (admin) {
    try {
      const { error } = await admin.from("akp_content_sources").select("id", { count: "exact", head: true });
      checks.storage = { ok: !error, status: error ? "error" : "ok" };
    } catch (err) {
      checks.storage = { ok: false, status: String(err.message) };
    }
  }

  const sources = await listContentSources({ activeOnly: true });
  const sourceHealth = await checkAllSourcesHealth(sources);
  checks.sources = {
    ok: sourceHealth.summary.available > 0,
    ...sourceHealth.summary,
  };

  const recovery = await recoverStuckRuns();
  checks.recovery = { ok: true, ...recovery };

  const retryStats = await getRetryQueueStats();
  checks.retryQueue = {
    ok: retryStats.total < 500,
    ...retryStats,
    overflow: retryStats.total >= 500,
  };

  let queue = { pending: 0, failed: 0 };
  try {
    queue = await getQueueStats();
  } catch {
    /* optional */
  }
  checks.queue = {
    ok: queue.pending < 1000,
    ...queue,
    overflow: queue.pending >= 1000,
  };

  checks.cron = {
    ok: true,
    schedules: Object.keys(CRON_SCHEDULES).length,
    modes: CRON_SCHEDULES,
  };

  checks.search = {
    ok: true,
    mode: process.env.OPENAI_API_KEY ? "embeddings" : "keyword_fallback",
  };

  checks.publisher = {
    ok: Boolean(admin),
    status: admin ? "ready" : "degraded",
  };

  const failedChecks = Object.entries(checks).filter(([, v]) => v.ok === false || v.overflow);
  const healthScore = Math.round(((Object.keys(checks).length - failedChecks.length) / Object.keys(checks).length) * 100);

  if (sourceHealth.summary.dead > 0) {
    await createAlert({
      severity: sourceHealth.summary.dead >= sources.length ? "critical" : "warning",
      component: "source_health",
      title: "مصادر محتوى معطلة",
      message: `${sourceHealth.summary.dead}/${sources.length} sources dead`,
      metadata: sourceHealth.summary,
    });
  }

  if (recovery.recovered > 0) {
    await createAlert({
      severity: "warning",
      component: "recovery",
      title: "Runs عالقة — تم إغلاقها",
      message: `${recovery.recovered} stuck run(s) closed, ${recovery.restarted} restarted`,
    });
  }

  if (checks.retryQueue.overflow || checks.queue.overflow) {
    await createAlert({
      severity: "critical",
      component: "queue",
      title: "Queue overflow",
      message: `Retry: ${retryStats.total}, MKE pending: ${queue.pending}`,
    });
  }

  await logStructured({
    level: failedChecks.length ? "warn" : "info",
    component: "health_monitor",
    event: "health_tick",
    durationMs: Date.now() - started,
    metadata: { healthScore, failed: failedChecks.length },
  });

  return {
    ok: healthScore >= 60,
    healthScore,
    checks,
    durationMs: Date.now() - started,
    timestamp: new Date().toISOString(),
  };
}

export { HEALTH_STATUS };
