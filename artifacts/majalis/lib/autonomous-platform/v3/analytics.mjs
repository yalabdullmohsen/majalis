/**
 * AKP v3 — Production Analytics Dashboard data.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { CONTENT_PIPELINES, DAILY_QUOTAS } from "../config.mjs";
import { kuwaitDateString, periodStart } from "../normalize.mjs";

function dayStart(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function countTableSince(table, since, filter = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return 0;
  try {
    let q = admin.from(table).select("id", { count: "exact", head: true }).gte("created_at", since);
    for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    const { count } = await q;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function buildProductionAnalytics() {
  const admin = getSupabaseAdmin();
  const today = periodStart("daily");
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const pipelineMetrics = {};
  let totalPublishedToday = 0;
  let totalRejectedToday = 0;
  let totalDuplicateToday = 0;

  for (const [type, pipeline] of Object.entries(CONTENT_PIPELINES)) {
    const publishedToday = await countTableSince(pipeline.targetTable, today);
    const publishedWeek = await countTableSince(pipeline.targetTable, weekStart.toISOString());
    const publishedMonth = await countTableSince(pipeline.targetTable, monthStart.toISOString());

    totalPublishedToday += publishedToday;
    pipelineMetrics[type] = {
      label: pipeline.label,
      quota: pipeline.quota,
      publishedToday,
      publishedWeek,
      publishedMonth,
      quotaMet: publishedToday >= pipeline.quota,
    };
  }

  if (admin) {
    try {
      const { count: rejected } = await admin
        .from("akp_review_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "rejected")
        .gte("created_at", today);
      totalRejectedToday = rejected || 0;

      const { count: dup } = await admin
        .from("akp_review_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "duplicate")
        .gte("created_at", today);
      totalDuplicateToday = dup || 0;
    } catch {
      /* optional */
    }
  }

  let sourceStats = [];
  let pipelineSuccess = {};
  if (admin) {
    try {
      const { data: sources } = await admin
        .from("akp_content_sources")
        .select("id, name, slug, health_score, avg_fetch_ms, items_extracted_total, error_rate_pct, last_success_at")
        .order("items_extracted_total", { ascending: false })
        .limit(20);

      sourceStats = (sources || []).map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        healthScore: s.health_score,
        avgFetchMs: s.avg_fetch_ms,
        itemsExtracted: s.items_extracted_total,
        errorRatePct: s.error_rate_pct,
        lastSuccess: s.last_success_at,
      }));

      const { data: runs } = await admin
        .from("akp_pipeline_runs")
        .select("pipeline, status")
        .gte("started_at", weekStart.toISOString());

      const byPipe = {};
      for (const r of runs || []) {
        byPipe[r.pipeline] = byPipe[r.pipeline] || { total: 0, ok: 0 };
        byPipe[r.pipeline].total += 1;
        if (r.status === "completed") byPipe[r.pipeline].ok += 1;
      }
      pipelineSuccess = Object.fromEntries(
        Object.entries(byPipe).map(([k, v]) => [k, v.total ? Math.round((v.ok / v.total) * 100) : null]),
      );
    } catch {
      /* optional */
    }
  }

  const fastest = [...sourceStats].filter((s) => s.avgFetchMs).sort((a, b) => a.avgFetchMs - b.avgFetchMs).slice(0, 5);
  const slowest = [...sourceStats].filter((s) => s.avgFetchMs).sort((a, b) => b.avgFetchMs - a.avgFetchMs).slice(0, 5);
  const topSources = sourceStats.slice(0, 10);

  const analytics = {
    date: kuwaitDateString(),
    counts: {
      today: totalPublishedToday,
      week: Object.values(pipelineMetrics).reduce((a, p) => a + p.publishedWeek, 0),
      month: Object.values(pipelineMetrics).reduce((a, p) => a + p.publishedMonth, 0),
      published: totalPublishedToday,
      rejected: totalRejectedToday,
      duplicates: totalDuplicateToday,
    },
    pipelines: pipelineMetrics,
    quotas: DAILY_QUOTAS,
    pipelineSuccessRate: pipelineSuccess,
    topSources,
    fastestSources: fastest,
    slowestSources: slowest,
  };

  if (admin) {
    await admin.from("akp_platform_analytics_daily").upsert(
      {
        day: kuwaitDateString(),
        items_fetched: totalPublishedToday + totalRejectedToday,
        items_published: totalPublishedToday,
        items_rejected: totalRejectedToday,
        items_duplicate: totalDuplicateToday,
        pipeline_stats: pipelineMetrics,
        source_stats: { top: topSources.length, fastest: fastest.length },
        top_sources: topSources,
        slow_sources: slowest,
        goal_progress: pipelineMetrics,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "day" },
    ).catch(() => {});
  }

  return { ok: true, analytics };
}

export async function getAnalyticsHistory(days = 30) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, history: [] };

  const since = dayStart(days);
  const { data } = await admin
    .from("akp_platform_analytics_daily")
    .select("*")
    .gte("day", since.slice(0, 10))
    .order("day", { ascending: false });

  return { ok: true, history: data || [] };
}
