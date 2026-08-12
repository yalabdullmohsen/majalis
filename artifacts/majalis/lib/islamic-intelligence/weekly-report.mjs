/**
 * AI Weekly Report — comprehensive weekly platform summary.
 */

import crypto from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getIntelligenceAnalytics } from "./analytics.mjs";
import { getAllSources, auditAllSources } from "../global-reference/sources.mjs";
import { getReviewHistory } from "../global-reference/review.mjs";
import { getAutonomousObservability } from "../autonomous-ai/observability.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

export async function generateWeeklyReport(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 86400000);

  const [analytics, sources, reviews, autonomous] = await Promise.all([
    getIntelligenceAnalytics(admin, { days: 7 }),
    auditAllSources(admin).catch(() => getAllSources(admin)),
    getReviewHistory(admin, 3),
    getAutonomousObservability(admin).catch(() => null),
  ]);

  let agentRuns = [];
  if (admin) {
    try {
      const { data } = await admin
        .from("intelligence_runs")
        .select("*")
        .gte("started_at", weekStart.toISOString())
        .order("started_at", { ascending: false })
        .limit(20);
      agentRuns = data || [];
    } catch {
      /* table may not exist */
    }
  }

  const brokenSources = (Array.isArray(sources) ? sources : []).filter((s) => s.ok === false || s.status === "broken");

  const report = {
    id: runId,
    agent: "weekly_report",
    report_type: "weekly",
    generated_at: now.toISOString(),
    period: {
      start: weekStart.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10),
    },
    new_content: {
      count: analytics.content_growth?.new_items || autonomous?.metrics?.itemsNew || 0,
      daily_avg: Math.round((analytics.content_growth?.new_items || 0) / 7),
    },
    updated_content: {
      count: analytics.content_growth?.updated_items || autonomous?.metrics?.itemsUpdated || 0,
    },
    needs_review: {
      count: analytics.quality?.needs_review || 0,
      incomplete: analytics.quality?.incomplete || 0,
      flagged_low_quality: agentRuns.find((r) => r.agent_id === "quality_scorer")?.issues_found || 0,
    },
    sources: {
      total: sources.length,
      broken: brokenSources.length,
      broken_list: brokenSources.slice(0, 5).map((s) => ({ slug: s.slug, name: s.name, status: s.status })),
      healthy: sources.length - brokenSources.length,
    },
    system: {
      status: autonomous?.ok ? "healthy" : "degraded",
      ai_status: analytics.system?.ai_status,
      database_status: analytics.system?.database_status,
      success_rate: autonomous?.metrics?.successRate || analytics.update_success_rate,
      cron_jobs: analytics.system?.cron_jobs,
    },
    quality_indicators: {
      avg_score: analytics.quality?.avg_score || 0,
      verification_pct: analytics.verification_pct || 0,
      search_quality: analytics.search_quality_score || 0,
      relations_total: analytics.relations?.total || 0,
    },
    search_highlights: {
      top_queries: analytics.most_searched?.slice(0, 5) || [],
      top_topics: analytics.most_read_topics?.slice(0, 5) || [],
      content_gaps: analytics.pages_needing_enrichment?.slice(0, 5) || [],
    },
    agent_activity: agentRuns.map((r) => ({
      agent: r.agent_id,
      status: r.status,
      items_checked: r.items_checked,
      issues_found: r.issues_found,
      at: r.started_at,
    })),
    recent_reviews: reviews,
    recommendations: [
      ...(brokenSources.length > 0 ? [`إصلاح ${brokenSources.length} مصدر معطل`] : []),
      ...(analytics.quality?.needs_review > 0 ? [`مراجعة ${analytics.quality.needs_review} عنصر`] : []),
      ...(analytics.insufficient_content?.length > 0 ? ["إثراء المحتوى للاستعلامات بدون نتائج"] : []),
      "متابعة خطة المحتوى الأسبوعية",
    ],
  };

  if (admin) {
    try {
      await admin.from("intelligence_weekly_reports").upsert(
        {
          id: runId,
          period_start: report.period.start,
          period_end: report.period.end,
          report,
        },
        { onConflict: "period_start" },
      );
    } catch {
      /* table may not exist */
    }
  }

  writeFileSync(path.join(ROOT, "data/islamic-intelligence-weekly.json"), JSON.stringify(report, null, 2), "utf8");

  return report;
}
