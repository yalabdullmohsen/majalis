/**
 * Monitoring Intelligence — unified platform health for admin dashboard.
 */
import { getEngineMetrics } from "./metrics.mjs";
import { getQueueStats } from "./queue.mjs";
import { getSearchCapabilities } from "./search-intelligence.mjs";
import { resolveActiveAiProvider, resolveVisionFallback } from "./self-healing.mjs";
import { CHANNELS } from "./notification-platform.mjs";
import { INTELLIGENCE_LAYERS, ENGINE_VERSION } from "./config.mjs";

export async function getPlatformMonitoring() {
  const metrics = await getEngineMetrics();
  const queue = await getQueueStats();

  let v2Stats = {};
  const admin = metrics.database?.status === "connected";
  if (admin) {
    v2Stats = await loadV2TableCounts();
  }

  return {
    engineVersion: ENGINE_VERSION,
    intelligenceLayers: INTELLIGENCE_LAYERS,
    health: computeHealthScore(metrics, queue, v2Stats),
    subsystems: {
      sources: { total: metrics.sourcesTotal, byType: metrics.sourcesByType },
      vision: { ...metrics.vision, fallback: resolveVisionFallback() },
      ocr: { status: metrics.vision?.visionEnabled ? "active" : "fallback" },
      ai: { provider: resolveActiveAiProvider(), openai: metrics.aiUsage?.openai },
      queue: queue,
      cron: metrics.cron,
      database: metrics.database,
      search: { ...getSearchCapabilities(), status: metrics.search?.status },
      notifications: { channels: CHANNELS, pushConfigured: Boolean(process.env.NOTIFICATION_API_URL) },
      knowledgeGraph: { status: admin ? "connected" : "unknown" },
      performance: {
        cache: metrics.cache?.status,
        ttfbTargetMs: 150,
        lighthouseTarget: 95,
      },
    },
    counts: {
      drafts: metrics.drafts ?? 0,
      pendingReview: metrics.pendingReview ?? 0,
      publishedToday: metrics.publishedToday ?? 0,
      duplicates: metrics.duplicates ?? 0,
      rejected: metrics.rejected ?? 0,
      mkeRuns: metrics.mkeRuns ?? 0,
      ...v2Stats,
    },
    extraction: metrics.extractionMetrics,
    sourceSuccessRates: metrics.sourceSuccessRates,
  };
}

async function loadV2TableCounts() {
  const { getSupabaseAdmin } = await import("../supabase-admin.mjs");
  const admin = getSupabaseAdmin();
  if (!admin) return {};

  const tables = [
    "mke_source_scores",
    "mke_discovery_queue",
    "mke_quality_reports",
    "mke_self_heal_log",
    "mke_notification_jobs",
    "mke_decision_scores",
  ];

  const out = {};
  for (const table of tables) {
    try {
      const { count } = await admin.from(table).select("id", { count: "exact", head: true });
      out[table.replace("mke_", "")] = count || 0;
    } catch {
      out[table.replace("mke_", "")] = null;
    }
  }
  return out;
}

function computeHealthScore(metrics, queue, v2Stats) {
  let score = 100;
  if (metrics.database?.status !== "connected") score -= 40;
  if (!metrics.vision?.visionEnabled) score -= 10;
  if (metrics.search?.status !== "embeddings_ready") score -= 5;
  if ((queue.failed ?? 0) > 10) score -= 15;
  if ((metrics.errors ?? 0) > 5) score -= 10;
  if (metrics.sourcesTotal === 0) score -= 20;

  const status = score >= 85 ? "healthy" : score >= 60 ? "degraded" : "critical";
  return { score: Math.max(0, score), status, v2Tables: v2Stats };
}

export { getEngineMetrics };
