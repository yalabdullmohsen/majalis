/**
 * Unified system health — Auto Content + Auto Knowledge Engine + Cron + Env
 */

import { getEnvConfig, getEnvStatus, validateCronEnv } from "./env-config.mjs";
import { getSupabaseAdmin } from "./supabase-admin.mjs";
import { describeDatabaseUrlConfig, testDatabaseConnection } from "./database.mjs";
import { getAutoContentHealth, getAutoContentPipelineStats } from "./auto-content/auto-content-sync.mjs";
import { getAutoKnowledgeEngineStats } from "./auto-knowledge-engine/orchestrator.mjs";

const CRON_ROUTES = [
  { path: "/api/cron/auto-knowledge-sync", schedule: "30 */6 * * *", label: "Auto Knowledge Engine (full)" },
  { path: "/api/cron/auto-content-sync", schedule: "0 */6 * * *", label: "Auto Content Sync" },
  { path: "/api/cron/knowledge-sync", schedule: "0 */6 * * *", label: "Knowledge Sync (legacy)" },
  { path: "/api/cron/connector-health", schedule: "0 * * * *", label: "Connector Health" },
  { path: "/api/cron/auto-content-health", schedule: "15 */6 * * *", label: "Auto Content Health" },
  { path: "/api/cron/system-health", schedule: "45 */6 * * *", label: "System Health Monitor" },
  { path: "/api/cron/sync-fiqh-council", schedule: "0 6 * * *", label: "Fiqh Council Sync" },
  { path: "/api/cron/check-fiqh-links", schedule: "0 7 * * *", label: "Fiqh Link Check" },
  { path: "/api/cron/apply-migrations", schedule: "0 5 * * 0", label: "Schema Migrations (weekly verify)" },
];

export async function getSystemHealth() {
  const started = Date.now();
  const env = getEnvConfig();
  const envStatus = getEnvStatus();
  const envValidation = validateCronEnv();

  const [autoContentHealth, akeStats, pipelineStats, dbConn] = await Promise.all([
    getAutoContentHealth().catch((e) => ({ ok: false, error: e.message })),
    getAutoKnowledgeEngineStats(7).catch((e) => ({ ok: false, stats: {}, usingLegacy: true, error: e.message })),
    getAutoContentPipelineStats(5).catch((e) => ({ ok: false, error: e.message })),
    testDatabaseConnection().catch((e) => ({ ok: false, error: e.message })),
  ]);

  const databaseUrlConfig = describeDatabaseUrlConfig();

  const admin = getSupabaseAdmin();
  let queue = { status: "unknown", pending: 0, processing: 0, failed: 0 };
  if (admin) {
    try {
      const { data } = await admin
        .from("ake_job_queue")
        .select("status")
        .in("status", ["pending", "running", "failed"]);
      const rows = data || [];
      queue = {
        status: rows.length > 0 ? "active" : "idle",
        pending: rows.filter((r) => r.status === "pending").length,
        processing: rows.filter((r) => r.status === "running").length,
        failed: rows.filter((r) => r.status === "failed").length,
      };
    } catch {
      queue = { status: "inline", pending: 0, processing: 0, failed: 0 };
    }
  }

  const lastAutoRun = pipelineStats.runs?.[0] || autoContentHealth.cron?.lastRun || null;
  const lastAkeRun = akeStats.stats?.last_run || null;

  const errors = [];
  if (!envValidation.ok) errors.push(`Missing env: ${envValidation.missing.join(", ")}`);
  if (!admin) errors.push("Supabase service role not configured");
  if (autoContentHealth.database?.status === "error") errors.push(autoContentHealth.database.error);
  if (databaseUrlConfig.needsVercelUpdate) {
    errors.push("DATABASE_URL must be Supabase Transaction Pooler (port 6543) — update in Vercel env");
  }
  if (dbConn.ok === false) errors.push(`PostgreSQL pooler: ${dbConn.error}`);
  if (akeStats.usingLegacy) errors.push("AKE migration pending — run auto_knowledge_engine_v13.sql");

  return {
    ok: envValidation.ok && Boolean(admin) && autoContentHealth.ok !== false,
    at: new Date().toISOString(),
    durationMs: Date.now() - started,
    lastRun: {
      autoContent: lastAutoRun,
      autoKnowledgeEngine: lastAkeRun,
    },
    metrics: {
      sourcesTotal: autoContentHealth.sources?.total ?? 0,
      sourcesActive: autoContentHealth.sources?.active ?? 0,
      connectorsActive: akeStats.stats?.connectors_active ?? 0,
      itemsNewToday: akeStats.stats?.items_new_today ?? 0,
      itemsPublishedToday: akeStats.stats?.items_published_today ?? 0,
      itemsUpdated: pipelineStats.runs?.[0]?.imported_count ?? 0,
      itemsPublished: autoContentHealth.content?.published ?? pipelineStats.publishedCount ?? 0,
      itemsPending: autoContentHealth.content?.pending ?? pipelineStats.pendingCount ?? 0,
      lastDurationMs: lastAutoRun?.duration_ms ?? null,
    },
    errors: errors.length > 0 ? errors : (pipelineStats.logs || [])
      .filter((l) => l.status === "failed")
      .slice(0, 10)
      .map((l) => l.message),
    ai: {
      openai: env.openaiKey ? "configured" : "fallback_mode",
      anthropic: env.anthropicKey ? "configured" : "not_used_by_pipeline",
      status: env.openaiKey || env.anthropicKey ? "ready" : "heuristic_fallback",
    },
    supabase: {
      status: admin ? (autoContentHealth.database?.status || "connected") : "not_configured",
      url: Boolean(env.supabaseUrl),
      serviceRole: Boolean(env.serviceRoleKey),
      anonKey: Boolean(env.anonKey),
    },
    database: {
      status: dbConn.ok ? "connected" : "error",
      source: dbConn.source || databaseUrlConfig.connectionSource,
      urlConfig: databaseUrlConfig,
      connection: dbConn.ok
        ? { ping: dbConn.ping, publicTables: dbConn.publicTables, durationMs: dbConn.durationMs }
        : { error: dbConn.error },
    },
    cron: {
      secretConfigured: Boolean(env.cronSecret),
      routes: CRON_ROUTES,
      status: env.cronSecret ? "configured" : (env.nodeEnv === "production" ? "missing_secret" : "dev_mode"),
    },
    queue,
    env: envStatus,
    autoContent: autoContentHealth,
    autoKnowledgeEngine: {
      stats: akeStats.stats,
      usingLegacy: akeStats.usingLegacy,
    },
    pipeline: {
      runs: pipelineStats.runs || [],
      recentLogs: (pipelineStats.logs || []).slice(0, 15),
    },
  };
}

export { CRON_ROUTES };
