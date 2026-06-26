/**
 * Enterprise Governance — system monitoring dashboard.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getSystemHealth } from "../system-health.mjs";
import { getAutonomousObservability } from "../autonomous-ai/observability.mjs";
import { cacheStats } from "../open-platform/cache.mjs";

export async function getGovernanceMonitoring(admin) {
  admin = admin || getSupabaseAdmin();

  const [systemHealth, autonomous, platformStats] = await Promise.all([
    getSystemHealth().catch(() => ({ ok: false })),
    getAutonomousObservability(admin).catch(() => null),
    admin
      ? admin.rpc("governance_platform_stats").then(({ data }) => data).catch(() => null)
      : null,
  ]);

  let queueStats = { pending: 0, failed: 0 };
  if (admin) {
    try {
      const { count: pending } = await admin.from("governance_reviews").select("*", { count: "exact", head: true }).eq("status", "needs_review");
      const { count: failed } = await admin.from("autonomous_pipeline_events").select("*", { count: "exact", head: true }).eq("success", false);
      queueStats = { pending: pending || 0, failed: failed || 0 };
    } catch {
      /* optional */
    }
  }

  return {
    ok: systemHealth.ok !== false,
    at: new Date().toISOString(),
    database: {
      status: systemHealth.supabase?.status || (admin ? "connected" : "disconnected"),
      pooler: systemHealth.database?.poolerConfigured ?? false,
    },
    vercel: {
      status: process.env.VERCEL ? "deployed" : "local",
      region: process.env.VERCEL_REGION || "local",
      cron: systemHealth.cron?.secretConfigured ? "configured" : "missing_secret",
    },
    supabase: {
      status: admin ? "connected" : "disconnected",
      service_role: Boolean(admin),
    },
    cron_jobs: {
      total: systemHealth.cron?.routes?.length || autonomous?.cronJobs?.length || 0,
      status: systemHealth.cron?.status || "unknown",
      jobs: autonomous?.cronJobs?.slice(0, 10) || [],
    },
    ai: {
      status: autonomous?.ai?.status || "limited",
      metadata_only: true,
      openai: Boolean(process.env.OPENAI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    },
    queue: queueStats,
    backups: {
      status: "supabase_auto",
      note: "Supabase automatic backups on paid plans; governance backup cron weekly",
      last_check: platformStats?.last_backup_check || null,
    },
    storage: {
      cache_entries: cacheStats().entries,
    },
    performance: {
      avg_duration_ms: autonomous?.durationMs || systemHealth.durationMs || 0,
      success_rate: autonomous?.metrics?.successRate || 100,
    },
    platform_stats: platformStats,
    system_health: systemHealth,
  };
}
