/**
 * MKE metrics — dashboard stats for automation center.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getVisionStatus } from "./vision-intelligence.mjs";
import { getInstagramGraphStatus } from "../cms/instagram-graph-api.mjs";
import { listRegisteredSources, listSupportedPlatforms } from "./source-registry.mjs";
import { getQueueStats } from "./queue.mjs";
import { isVisionEnabled } from "../cms/lesson-extractor.mjs";
import { ENGINE_VERSION } from "./config.mjs";

export async function getEngineMetrics() {
  const admin = getSupabaseAdmin();
  const sources = await listRegisteredSources({ activeOnly: true });

  const stats = {
    engineVersion: ENGINE_VERSION,
    sourcesTotal: sources.length,
    platformsSupported: listSupportedPlatforms().length,
    sourcesByType: countBy(sources, "source_type"),
    vision: getVisionStatus(),
    instagram: getInstagramGraphStatus(),
    cron: { status: "active", schedules: ["*/15 lesson-intelligence", "*/15 source-monitor", "0 8 autonomous-orchestrator"] },
    database: { status: admin ? "connected" : "missing_admin" },
    search: { status: process.env.OPENAI_API_KEY ? "embeddings_ready" : "keyword_fallback" },
    cache: { status: "request_time_dynamic" },
    aiUsage: { visionEnabled: isVisionEnabled(), openai: !!process.env.OPENAI_API_KEY },
  };

  if (admin) {
    stats.drafts = await countTable(admin, "lesson_import_drafts", { status: "draft" });
    stats.pendingReview = await countTable(admin, "lesson_import_drafts", { automation_status: "pending_review" });
    stats.publishedToday = await countRecentLessons(admin);
    stats.automationLogs = await countTable(admin, "automation_step_logs");
    stats.duplicates = await countTable(admin, "lesson_automation_audit", { decision: "duplicate" });
    stats.rejected = await countTable(admin, "lesson_automation_audit", { decision: "rejected" });
    stats.mkeRuns = await countTable(admin, "mke_runs");
    stats.queue = await getQueueStats();
    stats.sourceSuccessRates = await computeSourceSuccessRates(admin);
    stats.extractionMetrics = await computeExtractionMetrics(admin);
  }

  return stats;
}

async function countTable(admin, table, filter = {}) {
  try {
    let q = admin.from(table).select("id", { count: "exact", head: true });
    for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    const { count } = await q;
    return count || 0;
  } catch {
    return 0;
  }
}

async function countRecentLessons(admin) {
  try {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { count } = await admin
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .gte("published_at", since.toISOString());
    return count || 0;
  } catch {
    return 0;
  }
}

async function computeSourceSuccessRates(admin) {
  try {
    const { data } = await admin
      .from("lesson_intelligence_runs")
      .select("source_id, status, items_published, items_errors")
      .order("started_at", { ascending: false })
      .limit(50);
    const bySource = {};
    for (const run of data || []) {
      if (!run.source_id) continue;
      if (!bySource[run.source_id]) bySource[run.source_id] = { ok: 0, err: 0 };
      if (run.items_errors > 0) bySource[run.source_id].err += 1;
      else bySource[run.source_id].ok += 1;
    }
    return Object.entries(bySource).map(([id, v]) => ({
      sourceId: id,
      successRate: v.ok + v.err ? Math.round((v.ok / (v.ok + v.err)) * 100) : 0,
    }));
  } catch {
    return [];
  }
}

async function computeExtractionMetrics(admin) {
  const metrics = {
    visionAccuracy: null,
    ocrAccuracy: null,
    sheikhMatchRate: null,
    duplicateDetectionRate: null,
  };
  try {
    const { data } = await admin
      .from("lesson_intelligence_extractions")
      .select("confidence_score, decision, metadata")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!data?.length) return metrics;

    const confidences = data.map((r) => Number(r.confidence_score || 0)).filter((c) => c > 0);
    metrics.visionAccuracy = confidences.length
      ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100)
      : null;

    const dupes = data.filter((r) => r.decision === "duplicate").length;
    metrics.duplicateDetectionRate = Math.round((dupes / data.length) * 100);

    const sheikhMatched = data.filter((r) => r.metadata?.sheikh_matched).length;
    metrics.sheikhMatchRate = Math.round((sheikhMatched / data.length) * 100);
  } catch {
    /* optional */
  }
  return metrics;
}

function countBy(arr, key) {
  const out = {};
  for (const item of arr) {
    const k = item[key] || "unknown";
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

export function computeAutomationCompletion(stats) {
  const checks = [
    stats.sourcesTotal > 0,
    stats.vision?.visionEnabled,
    stats.database?.status === "connected",
    stats.platformsSupported >= 20,
  ];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { pct, checks: checks.length, passed: checks.filter(Boolean).length };
}
