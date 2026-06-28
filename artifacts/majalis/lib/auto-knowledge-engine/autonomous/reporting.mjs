/**
 * Periodic reporting — hourly, daily, weekly, monthly.
 */

import { getSupabaseAdmin, isMissingTableError } from "../../supabase-admin.mjs";
import { generateDailyReport } from "../monitoring/daily-report.mjs";
import { getTopRejectionReasons } from "./rejection-log.mjs";
import { getCronHealth } from "../monitoring/cron-tracker.mjs";
import { notifyAdminsAkeAlert } from "../monitoring/notify.mjs";
import { akeLog } from "../monitoring.mjs";

function periodKey(type, date = new Date()) {
  const d = date;
  if (type === "hourly") return `${d.toISOString().slice(0, 13)}:00`;
  if (type === "daily") return d.toISOString().slice(0, 10);
  if (type === "weekly") {
    const week = Math.ceil((d.getUTCDate() - d.getUTCDay() + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  if (type === "monthly") return d.toISOString().slice(0, 7);
  return d.toISOString();
}

function sinceForType(type) {
  const now = Date.now();
  const hours = { hourly: 1, daily: 24, weekly: 168, monthly: 720 }[type] || 24;
  return new Date(now - hours * 3_600_000).toISOString();
}

async function collectMetrics(admin, since) {
  const [
    { count: discovered },
    { count: publishedLessons },
    { count: publishedBenefits },
    { data: cycles },
    { count: rejections },
    { count: cronFailures },
    { data: connectors },
  ] = await Promise.all([
    admin.from("knowledge_items").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("lessons").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("fawaid").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("ake_cycle_metrics").select("fetched,parsed,published,rejected,duplicates,duration_ms").gte("created_at", since),
    admin.from("ake_rejection_log").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("ake_cron_runs").select("id", { count: "exact", head: true }).eq("status", "failed").gte("started_at", since),
    admin.from("ake_connectors").select("slug, health_status, is_active"),
  ]);

  const agg = (cycles || []).reduce(
    (a, c) => ({
      fetched: a.fetched + (c.fetched || 0),
      parsed: a.parsed + (c.parsed || 0),
      published: a.published + (c.published || 0),
      rejected: a.rejected + (c.rejected || 0),
      duplicates: a.duplicates + (c.duplicates || 0),
      durationMs: a.durationMs + (c.duration_ms || 0),
      count: a.count + 1,
    }),
    { fetched: 0, parsed: 0, published: 0, rejected: 0, duplicates: 0, durationMs: 0, count: 0 },
  );

  const active = (connectors || []).filter((c) => c.is_active);
  const topRejections = await getTopRejectionReasons(since, 8);
  const cronHealth = await getCronHealth(15);

  return {
    items_discovered: discovered || 0,
    items_imported: agg.parsed,
    items_published: (publishedLessons || 0) + (publishedBenefits || 0) + agg.published,
    lessons_published: publishedLessons || 0,
    benefits_published: publishedBenefits || 0,
    items_rejected: (rejections || 0) + agg.rejected,
    duplicates_skipped: agg.duplicates,
    cron_failures: cronFailures || 0,
    active_sources: active.length,
    healthy_sources: active.filter((c) => c.health_status === "healthy").length,
    failing_sources: active.filter((c) => c.health_status === "down").length,
    avg_pipeline_duration_ms: agg.count ? Math.round(agg.durationMs / agg.count) : 0,
    top_rejection_reasons: topRejections,
    cron_health: cronHealth.crons?.length || 0,
    period_start: since,
  };
}

export async function generatePeriodicReport(reportType, { force = false } = {}) {
  const admin = getSupabaseAdmin();
  const key = periodKey(reportType);
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  if (reportType === "daily") {
    return generateDailyReport({ date: key, force });
  }

  try {
    if (!force) {
      const { data: existing } = await admin
        .from("ake_periodic_reports")
        .select("*")
        .eq("report_type", reportType)
        .eq("period_key", key)
        .maybeSingle();
      if (existing) return { ok: true, skipped: true, report: existing };
    }

    const since = sinceForType(reportType);
    const metrics = await collectMetrics(admin, since);
    const recommendedActions = [];
    if (metrics.failing_sources > 0) recommendedActions.push({ action: `راجع ${metrics.failing_sources} مصدراً فاشلاً`, priority: "high" });
    if (metrics.cron_failures > 0) recommendedActions.push({ action: `${metrics.cron_failures} فشل cron`, priority: "high" });
    if (metrics.items_published === 0 && metrics.active_sources > 0) recommendedActions.push({ action: "لا منشورات — راجع quality gate", priority: "medium" });

    const { data: report, error } = await admin
      .from("ake_periodic_reports")
      .upsert({
        report_type: reportType,
        period_key: key,
        metrics,
        summary: { headline: `${reportType} report ${key}`, ...metrics },
        recommended_actions: recommendedActions,
      }, { onConflict: "report_type,period_key" })
      .select("*")
      .single();

    if (error) throw error;

    if (reportType === "weekly" || reportType === "monthly") {
      await notifyAdminsAkeAlert({
        severity: "info",
        title: `تقرير ${reportType === "weekly" ? "أسبوعي" : "شهري"} — ${key}`,
        message: `منشور: ${metrics.items_published} · مرفوض: ${metrics.items_rejected}`,
        link: "/admin/platform/autonomous",
      });
      await admin.from("ake_periodic_reports").update({ notification_sent: true }).eq("id", report.id);
    }

    return { ok: true, report };
  } catch (err) {
    if (!isMissingTableError(err)) akeLog("periodic-report", { error: err.message, reportType }, "error");
    return { ok: false, error: err.message };
  }
}

export async function getPeriodicReportHistory(reportType, limit = 14) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  try {
    let q = admin.from("ake_periodic_reports").select("*").order("period_key", { ascending: false }).limit(limit);
    if (reportType) q = q.eq("report_type", reportType);
    const { data } = await q;
    return data || [];
  } catch {
    return [];
  }
}
