/**
 * Daily operational report — aggregates 24h metrics and notifies admins.
 */

import { getSupabaseAdmin, isMissingTableError } from "../../supabase-admin.mjs";
import { createAkeAlert } from "../alerts.mjs";
import { notifyDailyReport } from "./notify.mjs";
import { getCronHealth } from "./cron-tracker.mjs";
import { akeLog } from "../monitoring.mjs";

function reportDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function generateDailyReport({ date, force = false } = {}) {
  const admin = getSupabaseAdmin();
  const reportDate = date || reportDateKey();
  if (!admin) {
    return { ok: false, error: "supabase_admin_missing" };
  }

  try {
    if (!force) {
      const { data: existing } = await admin
        .from("ake_daily_reports")
        .select("*")
        .eq("report_date", reportDate)
        .maybeSingle();
      if (existing) return { ok: true, skipped: true, report: existing };
    }

    const since = `${reportDate}T00:00:00.000Z`;
    const until = `${reportDate}T23:59:59.999Z`;

    const metrics = await collectDailyMetrics(admin, since, until);
    const recommendedActions = buildRecommendedActions(metrics);

    const summary = {
      headline: `تقرير ${reportDate}`,
      healthy: metrics.healthy_sources,
      failing: metrics.failing_sources,
      published: metrics.lessons_published + metrics.benefits_published + metrics.articles_published,
    };

    const { data: report, error } = await admin
      .from("ake_daily_reports")
      .upsert(
        {
          report_date: reportDate,
          status: "generated",
          summary,
          metrics,
          recommended_actions: recommendedActions,
          notification_sent: false,
        },
        { onConflict: "report_date" },
      )
      .select("*")
      .single();

    if (error) throw error;

    await createAkeAlert({
      type: "daily_report_generated",
      severity: "info",
      title: `التقرير اليومي — ${reportDate}`,
      message: `مصادر: ${metrics.active_sources} · منشور: ${metrics.lessons_published} درس`,
      dedupeKey: `daily_report:${reportDate}`,
      metadata: { reportId: report.id },
    });

    await notifyDailyReport(report);

    return { ok: true, report };
  } catch (err) {
    if (!isMissingTableError(err)) akeLog("daily-report", { error: err.message }, "error");
    return { ok: false, error: err.message };
  }
}

async function collectDailyMetrics(admin, since, until) {
  const dayStart = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const [
    { data: connectors },
    { data: cycles },
    { count: cronFailures },
    { data: pipelineFails },
    { count: lessonsPub },
    { count: benefitsPub },
    { count: questionsGen },
    { count: brokenLinks },
    { data: sourceEvents },
  ] = await Promise.all([
    admin.from("ake_connectors").select("id, slug, name, is_active, health_status, last_success_at, last_checked_at"),
    admin.from("ake_cycle_metrics").select("*").gte("created_at", dayStart),
    admin.from("ake_cron_runs").select("id", { count: "exact", head: true }).eq("status", "failed").gte("started_at", dayStart),
    admin.from("ake_pipeline_failures").select("stage, error_code, error_message").eq("status", "open").gte("created_at", dayStart),
    admin.from("lessons").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
    admin.from("fawaid").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
    admin.from("qa_questions").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
    admin.from("ake_link_health").select("id", { count: "exact", head: true }).eq("status", "broken"),
    admin.from("ake_source_health_events").select("connector_slug, event_type").gte("created_at", dayStart),
  ]);

  const active = (connectors || []).filter((c) => c.is_active);
  const healthy = active.filter((c) => c.health_status === "healthy");
  const failing = active.filter((c) => c.health_status === "down" || c.health_status === "degraded");

  const agg = (cycles || []).reduce(
    (a, c) => ({
      fetched: a.fetched + (c.fetched || 0),
      parsed: a.parsed + (c.parsed || 0),
      duplicates: a.duplicates + (c.duplicates || 0),
      rejected: a.rejected + (c.rejected || 0),
      published: a.published + (c.published || 0),
    }),
    { fetched: 0, parsed: 0, duplicates: 0, rejected: 0, published: 0 },
  );

  const reviewCount = await admin
    .from("knowledge_items")
    .select("id", { count: "exact", head: true })
    .eq("verification_status", "pending");

  const rejectionReasons = {};
  for (const f of pipelineFails || []) {
    const key = f.error_code || f.stage || "unknown";
    rejectionReasons[key] = (rejectionReasons[key] || 0) + 1;
  }

  const inactiveSources = active
    .filter((c) => !c.last_checked_at || new Date(c.last_checked_at) < new Date(dayStart))
    .map((c) => c.slug);

  const cronHealth = await getCronHealth(20);

  return {
    active_sources: active.length,
    healthy_sources: healthy.length,
    failing_sources: failing.length,
    items_fetched: agg.fetched,
    items_parsed: agg.parsed,
    duplicates_skipped: agg.duplicates,
    items_rejected: agg.rejected,
    items_sent_to_review: reviewCount?.count || 0,
    lessons_published: lessonsPub || 0,
    benefits_published: benefitsPub || 0,
    questions_generated: questionsGen || 0,
    articles_published: agg.published,
    broken_links_found: brokenLinks || 0,
    cron_failures: cronFailures || 0,
    pipeline_failures: (pipelineFails || []).length,
    top_rejection_reasons: Object.entries(rejectionReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count })),
    sources_no_activity: inactiveSources,
    cron_health_summary: cronHealth.crons?.length || 0,
    period_start: since,
    period_end: until,
  };
}

function buildRecommendedActions(metrics) {
  const actions = [];
  if (metrics.failing_sources > 0) {
    actions.push({ priority: "high", action: `راجع ${metrics.failing_sources} مصدراً فاشلاً في لوحة المراقبة.` });
  }
  if (metrics.cron_failures > 0) {
    actions.push({ priority: "high", action: `${metrics.cron_failures} فشل cron — راجع ake_cron_runs.` });
  }
  if (metrics.pipeline_failures > 0) {
    actions.push({ priority: "medium", action: `${metrics.pipeline_failures} فشل pipeline مفتوح.` });
  }
  if (metrics.lessons_published === 0 && metrics.benefits_published === 0 && metrics.active_sources > 0) {
    actions.push({ priority: "medium", action: "لا منشورات اليوم رغم وجود مصادر نشطة — راجع quality gate." });
  }
  if (metrics.sources_no_activity?.length) {
    actions.push({ priority: "low", action: `مصادر بلا نشاط: ${metrics.sources_no_activity.slice(0, 5).join(", ")}` });
  }
  if (!actions.length) {
    actions.push({ priority: "info", action: "النظام يعمل بشكل طبيعي." });
  }
  return actions;
}

export async function getDailyReportHistory(limit = 14) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  try {
    const { data } = await admin
      .from("ake_daily_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}
