/**
 * AI Analytics — unified intelligence dashboard metrics.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getSearchAnalytics } from "../scholarly-intelligence/analytics.mjs";
import { getReferenceDashboard } from "../global-reference/dashboard.mjs";
import { getAutonomousObservability } from "../autonomous-ai/observability.mjs";
import { getQualityStats } from "../global-reference/quality.mjs";
import { getRelationStats } from "../global-reference/relations.mjs";

export async function getIntelligenceAnalytics(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const days = opts.days || 30;

  const [search, reference, autonomous, quality, relations] = await Promise.all([
    getSearchAnalytics(admin, days),
    getReferenceDashboard(admin).catch(() => null),
    getAutonomousObservability(admin).catch(() => null),
    getQualityStats(admin),
    getRelationStats(admin),
  ]);

  let contentGrowth = { new_items: 0, updated_items: 0, growth_rate: 0 };
  if (admin) {
    try {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { count: newCount } = await admin
        .from("global_content_refs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since);
      const { count: updatedCount } = await admin
        .from("global_content_refs")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", since);

      contentGrowth = {
        new_items: newCount || 0,
        updated_items: updatedCount || 0,
        growth_rate: newCount ? Math.round((newCount / Math.max(reference?.counts?.refs || 1, 1)) * 100) : 0,
      };
    } catch {
      /* optional */
    }
  }

  const updateSuccessRate = autonomous?.metrics?.successRate || 90;
  const enrichmentNeeded = (search.content_gaps || []).slice(0, 10).map((g) => ({
    query: g.query,
    search_count: g.count,
    status: "needs_enrichment",
  }));

  const insufficientContent = (search.zero_result_queries || []).slice(0, 10).map((q) => ({
    query: q.query,
    searches: q.count,
    message: "المستخدمون لا يجدون محتوى كافياً",
  }));

  return {
    ok: true,
    at: new Date().toISOString(),
    period_days: days,
    most_read_topics: search.top_topics || [],
    most_searched: search.top_queries || [],
    pages_needing_enrichment: enrichmentNeeded,
    insufficient_content: insufficientContent,
    content_growth: contentGrowth,
    update_success_rate: updateSuccessRate,
    quality: {
      avg_score: quality.avg || reference?.avg_quality_score || 0,
      incomplete: quality.incomplete || reference?.counts?.incomplete || 0,
      needs_review: reference?.counts?.needs_review || 0,
    },
    relations: {
      total: relations.total || reference?.counts?.relations || 0,
    },
    verification_pct: reference?.verification_pct || 0,
    system: {
      ai_status: autonomous?.ai?.status || "limited",
      database_status: autonomous?.database?.status || "unknown",
      cron_jobs: autonomous?.cronJobs?.length || 0,
    },
    search_quality_score: search.quality_score || 0,
    avg_response_ms: search.avg_response_ms || 0,
    click_through_rate: search.click_through_rate || 0,
    total_searches: search.total_searches || 0,
  };
}
