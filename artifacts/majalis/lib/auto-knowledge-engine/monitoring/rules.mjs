/**
 * Monitoring rules engine — 10 default alert rules with auto-resolve.
 */

import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { createAkeAlert, resolveAkeAlert, autoResolveAlerts, ALERT_THRESHOLDS } from "../alerts.mjs";
import { AKE_MONITORED_CRONS, expectedMaxGapMinutes } from "./cron-registry.mjs";
import { getLastCronRun } from "./cron-tracker.mjs";
import { akeLog } from "../monitoring.mjs";

export async function evaluateMonitoringRules(context = {}) {
  const admin = getSupabaseAdmin();
  const alerts = [];
  if (!admin) return alerts;

  const now = Date.now();

  // Gather live signals
  const signals = await gatherSignals(admin, context);

  // Rule 1: Critical — active source failed 3 times consecutively
  for (const c of signals.failingConnectors) {
    if ((c.consecutive_failures || 0) >= ALERT_THRESHOLDS.consecutiveFailures) {
      alerts.push(await createAkeAlert({
        type: "source_consecutive_failures",
        severity: "critical",
        title: `فشل متكرر: ${c.name || c.slug}`,
        message: `المصدر ${c.slug} فشل ${c.consecutive_failures} مرات متتالية`,
        dedupeKey: `source:${c.slug}:consecutive_failures`,
        connectorSlug: c.slug,
        sourceId: c.id,
        metadata: {
          sourceUrl: c.base_url || c.url,
          connectorType: c.connector_type,
          lastSuccessfulSync: c.last_success_at,
          failureReason: c.last_error,
          retryCount: c.consecutive_failures,
          recommendedAction: "تحقق من الرابط وأعد تفعيل المصدر.",
        },
      }));
    } else if (c.health_status === "healthy") {
      await autoResolveAlerts({ connectorSlug: c.slug });
    }
  }

  // Rule 2: Critical — no successful AKE full sync in 12 hours
  const lastSync = signals.scheduler?.last_cycle_at || signals.lastAkeSync?.started_at;
  if (lastSync) {
    const syncHours = (now - new Date(lastSync).getTime()) / 3_600_000;
    if (syncHours >= ALERT_THRESHOLDS.noSyncHours) {
      alerts.push(await createAkeAlert({
        type: "ake_sync_stale",
        severity: "critical",
        title: "لا مزامنة AKE منذ 12 ساعة",
        message: `آخر دورة AKE: ${Math.round(syncHours)} ساعة`,
        dedupeKey: "ake_sync_stale_12h",
        metadata: { lastSync, syncHours, recommendedAction: "تحقق من cron auto-knowledge-sync وCRON_SECRET." },
      }));
    } else {
      await resolveAkeAlert({ dedupeKey: "ake_sync_stale_12h" });
    }
  }

  // Rule 3: Warning — no published lesson/content in 24 hours (with active sources)
  const lastPublished = signals.scheduler?.last_published_at || signals.lastPublishedAt;
  const activeSources = signals.activeConnectorsCount || 0;
  if (activeSources > 0 && lastPublished) {
    const pubHours = (now - new Date(lastPublished).getTime()) / 3_600_000;
    if (pubHours >= ALERT_THRESHOLDS.noPublishHours) {
      const subReason = classifyNoPublishReason(signals);
      alerts.push(await createAkeAlert({
        type: "no_publish_24h",
        severity: "warning",
        title: "لا محتوى منشور خلال 24 ساعة",
        message: subReason.message,
        dedupeKey: "no_publish_24h",
        metadata: {
          subReason: subReason.code,
          activeSources,
          lastPublished,
          pubHours,
          itemsInReview: signals.reviewQueueSize,
          rejectedToday: signals.rejectedToday,
          recommendedAction: subReason.action,
        },
      }));
    } else {
      await resolveAkeAlert({ dedupeKey: "no_publish_24h" });
    }
  }

  // Rule 3b: Critical — pipeline published lessons but public catalog is empty
  const pipelinePublishedLessons =
    (signals.recentLessonPublishes || 0) > 0 ||
    (signals.recentCycles || []).some((c) => (c.published || 0) > 0);
  if (pipelinePublishedLessons && (signals.approvedLessonsCount || 0) === 0) {
    alerts.push(await createAkeAlert({
      type: "PUBLIC_LESSONS_EMPTY_AFTER_SUCCESSFUL_PIPELINE",
      severity: "critical",
      title: "الدروس العامة فارغة رغم نجاح المسار",
      message: "المسار نشر دروساً إلى knowledge_items/lessons لكن صفحة /lessons لا تعرض أي درس معتمد",
      dedupeKey: "PUBLIC_LESSONS_EMPTY_AFTER_SUCCESSFUL_PIPELINE",
      metadata: {
        approvedLessonsCount: signals.approvedLessonsCount || 0,
        recentLessonPublishes: signals.recentLessonPublishes || 0,
        recentCyclesPublished: (signals.recentCycles || []).reduce((s, c) => s + (c.published || 0), 0),
        recommendedAction: "تحقق من bootstrap Supabase، RLS، وفلتر status=approved في /lessons.",
      },
    }));
  } else if ((signals.approvedLessonsCount || 0) > 0) {
    await resolveAkeAlert({ dedupeKey: "PUBLIC_LESSONS_EMPTY_AFTER_SUCCESSFUL_PIPELINE" });
  }

  // Rule 4: Warning — more than 20 rejected items in one day
  if (signals.rejectedToday >= ALERT_THRESHOLDS.rejectedDaily) {
    alerts.push(await createAkeAlert({
      type: "high_rejection_rate",
      severity: "warning",
      title: "رفض مرتفع للمحتوى اليوم",
      message: `${signals.rejectedToday} عنصر مرفوض خلال 24 ساعة`,
      dedupeKey: "high_rejection_daily",
      metadata: { rejectedToday: signals.rejectedToday, topReasons: signals.topRejectionReasons },
    }));
  } else {
    await resolveAkeAlert({ dedupeKey: "high_rejection_daily" });
  }

  // Rule 5: Warning — review queue > 50
  if (signals.reviewQueueSize >= ALERT_THRESHOLDS.queueSize) {
    alerts.push(await createAkeAlert({
      type: "review_queue_high",
      severity: "warning",
      title: "طابور المراجعة ممتلئ",
      message: `${signals.reviewQueueSize} عنصر في طابور المراجعة`,
      dedupeKey: "review_queue_high",
      metadata: { queueSize: signals.reviewQueueSize },
    }));
  } else if (signals.reviewQueueSize < ALERT_THRESHOLDS.queueSize) {
    await resolveAkeAlert({ dedupeKey: "review_queue_high" });
  }

  // Rule 6 & 7 handled by pipeline-failures.mjs on event

  // Rule 8: Warning — AI fallback active > 24h
  if (context.aiDown || signals.aiFallbackActive) {
    alerts.push(await createAkeAlert({
      type: "ai_fallback_active",
      severity: "warning",
      title: "AI fallback نشط",
      message: "خدمات AI غير متاحة — يستخدم النظام fallback",
      dedupeKey: "ai_fallback_24h",
      metadata: { recommendedAction: "تحقق من OPENAI_API_KEY أو مزود AI." },
    }));
  } else {
    await resolveAkeAlert({ dedupeKey: "ai_fallback_24h" });
  }

  // Rule 9: Warning — cron missed schedule
  for (const cron of AKE_MONITORED_CRONS) {
    const last = await getLastCronRun(cron.name);
    if (!last?.started_at) continue;
    const maxGap = expectedMaxGapMinutes(cron.schedule) * 2;
    const gapMin = (now - new Date(last.started_at).getTime()) / 60_000;
    if (gapMin > maxGap && last.status !== "running") {
      alerts.push(await createAkeAlert({
        type: "cron_missed",
        severity: "warning",
        title: `Cron متأخر: ${cron.label}`,
        message: `${cron.name} لم يُشغّل منذ ${Math.round(gapMin)} دقيقة (المتوقع: ${cron.schedule})`,
        dedupeKey: `cron_missed:${cron.name}`,
        metadata: {
          cronName: cron.name,
          schedule: cron.schedule,
          lastRun: last.started_at,
          lastSuccess: last.last_success_at,
          lastFailure: last.status === "failed" ? last.started_at : null,
          gapMinutes: gapMin,
          suggestedFix: "تحقق من Vercel crons وCRON_SECRET.",
        },
      }));
    } else if (gapMin <= maxGap) {
      await resolveAkeAlert({ dedupeKey: `cron_missed:${cron.name}` });
    }
  }

  // Rule 10: Info — daily report (handled in daily-report.mjs)

  // Legacy context passthrough
  for (const c of context.downConnectors || []) {
    alerts.push(await createAkeAlert({
      type: "connector_stopped",
      severity: "warning",
      title: `مصدر متوقف: ${c.slug}`,
      message: `Connector ${c.slug} is down`,
      dedupeKey: `source:${c.slug}:connector_stopped`,
      connectorSlug: c.slug,
    }));
  }

  if (context.databaseDown) {
    alerts.push(await createAkeAlert({
      type: "database_unavailable",
      severity: "critical",
      title: "قاعدة البيانات غير متاحة",
      message: "Database unavailable",
      dedupeKey: "database_unavailable",
    }));
  }

  if ((context.publishFailures || 0) >= 10) {
    alerts.push(await createAkeAlert({
      type: "publish_failures",
      severity: "warning",
      title: "فشل نشر متكرر",
      message: `${context.publishFailures} publishing failures this cycle`,
      dedupeKey: "publish_failures_cycle",
    }));
  }

  akeLog("rules-eval", { alertsTriggered: alerts.filter((a) => a?.created).length });
  return alerts;
}

async function gatherSignals(admin, context) {
  const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const [
    { data: connectors },
    { data: scheduler },
    { count: reviewCount },
    { data: recentCycles },
    { count: rejectedCount },
    { data: lastAkeSync },
    { count: approvedLessonsCount },
    { count: recentLessonPublishes },
  ] = await Promise.all([
    admin.from("ake_connectors").select("*"),
    admin.from("ake_scheduler_state").select("*").eq("id", "global").maybeSingle(),
    admin.from("knowledge_items").select("id", { count: "exact", head: true }).eq("publish_status", "review"),
    admin.from("ake_cycle_metrics").select("published,rejected,fetched").gte("created_at", since24h).order("created_at", { ascending: false }).limit(20),
    admin.from("knowledge_items").select("id", { count: "exact", head: true }).eq("publish_status", "rejected").gte("updated_at", since24h),
    admin.from("ake_cron_runs").select("*").eq("cron_name", "auto-knowledge-sync").eq("status", "success").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("lessons").select("id", { count: "exact", head: true }).eq("status", "approved"),
    admin.from("knowledge_items").select("id", { count: "exact", head: true }).eq("publish_status", "published").eq("target_table", "lessons").gte("published_at", since24h),
  ]);

  const active = (connectors || []).filter((c) => c.is_active);
  const failing = (connectors || []).filter((c) => c.is_active && (c.health_status === "down" || c.consecutive_failures >= 2));

  return {
    activeConnectorsCount: active.length,
    failingConnectors: failing,
    scheduler: scheduler || {},
    reviewQueueSize: reviewCount || 0,
    rejectedToday: rejectedCount || 0,
    recentCycles: recentCycles || [],
    lastAkeSync,
    lastPublishedAt: context.lastPublishedAt,
    aiFallbackActive: context.aiDown,
    topRejectionReasons: [],
    approvedLessonsCount: approvedLessonsCount || 0,
    recentLessonPublishes: recentLessonPublishes || 0,
  };
}

function classifyNoPublishReason(signals) {
  const recentFetched = (signals.recentCycles || []).reduce((s, c) => s + (c.fetched || 0), 0);
  const recentRejected = (signals.recentCycles || []).reduce((s, c) => s + (c.rejected || 0), 0);

  if (recentFetched === 0 && !signals.lastAkeSync) {
    return { code: "cron_not_run", message: "Cron لم يُشغّل — لا بيانات مجلبة", action: "تحقق من Vercel crons." };
  }
  if (recentFetched === 0) {
    return { code: "no_content_found", message: "لا محتوى جديد من المصادر", action: "راجع المصادر النشطة." };
  }
  if (signals.reviewQueueSize > 20) {
    return { code: "stuck_in_review", message: "محتوى عالق في طابور المراجعة", action: "راجع عناصر knowledge_items في review." };
  }
  if (recentRejected > 0) {
    return { code: "content_rejected", message: "محتوى مُجلب لكن مرفوض", action: "راجع أسباب الرفض في quality gate." };
  }
  return { code: "pipeline_failed", message: "فشل pipeline قبل النشر", action: "راجع ake_pipeline_failures." };
}

export async function sendTestAlert() {
  return createAkeAlert({
    type: "test_alert",
    severity: "info",
    title: "تنبيه اختبار — AKE Monitoring",
    message: "هذا تنبيه اختبار من لوحة المراقبة. النظام يعمل.",
    dedupeKey: `test_alert:${Date.now()}`,
    metadata: { test: true },
  });
}
