/**
 * Hardening notifications — immediate alerts with diagnostics and recovery actions.
 */

import { createAkeAlert } from "../alerts.mjs";
import { akeLog } from "../monitoring.mjs";

const ALERT_TEMPLATES = {
  connector_stopped: {
    severity: "warning",
    title: (ctx) => `مصدر متوقف: ${ctx.slug || "unknown"}`,
    action: "راجع feed_url وأعد تفعيل المصدر من لوحة AKE Hardening.",
  },
  no_publish_24h: {
    severity: "warning",
    title: () => "لا محتوى منشور خلال 24 ساعة",
    action: "تحقق من quality gate ومصادر AKE النشطة.",
  },
  cron_failure: {
    severity: "critical",
    title: (ctx) => `فشل Cron: ${ctx.cronName || "unknown"}`,
    action: "تحقق من Vercel crons وCRON_SECRET.",
  },
  pipeline_failure: {
    severity: "warning",
    title: (ctx) => `فشل Pipeline: ${ctx.stage || "unknown"}`,
    action: "راجع ake_pipeline_failures وake_incident_log.",
  },
  database_unavailable: {
    severity: "critical",
    title: () => "قاعدة البيانات غير متاحة",
    action: "تحقق من DATABASE_URL وSupabase dashboard.",
  },
  migration_failure: {
    severity: "critical",
    title: (ctx) => `فشل Migration: ${ctx.migration || "unknown"}`,
    action: "طبّق auto_knowledge_engine_v19_hardening.sql يدوياً.",
  },
  ai_unavailable: {
    severity: "warning",
    title: () => "خدمة AI غير متاحة",
    action: "تحقق من ANTHROPIC_API_KEY — النظام يستخدم fallback.",
  },
  high_rejection_rate: {
    severity: "warning",
    title: (ctx) => `معدل رفض مرتفع: ${ctx.rate || 0}%`,
    action: "راجع ake_rejection_log لأسباب الرفض.",
  },
  broken_rss: {
    severity: "warning",
    title: (ctx) => `RSS معطّل: ${ctx.slug || "unknown"}`,
    action: "أضف mirror URL في ake_feed_mirrors.",
  },
  storage_problem: {
    severity: "warning",
    title: () => "مشكلة تخزين",
    action: "تحقق من Supabase Storage quotas.",
  },
  rpc_failure: {
    severity: "warning",
    title: () => "فشل RPC",
    action: "شغّل scope=ake-rpc في apply-migrations cron.",
  },
};

export async function notifyHardeningAlert(type, context = {}) {
  const template = ALERT_TEMPLATES[type];
  if (!template) {
    akeLog("notify-unknown", { type, context }, "warn");
    return null;
  }

  const dedupeKey = context.dedupeKey || `${type}:${context.slug || context.cronName || "global"}`;

  return createAkeAlert({
    type,
    severity: context.severity || template.severity,
    title: typeof template.title === "function" ? template.title(context) : template.title,
    message: context.message || context.error || "",
    dedupeKey,
    connectorSlug: context.slug,
    metadata: {
      ...context,
      recommendedAction: context.recommendedAction || template.action,
      diagnosticDetails: context.details || context.error,
    },
  });
}

export async function evaluateHardeningAlerts(admin, signals = {}) {
  const alerts = [];

  if (signals.rejectionRate >= 50 && signals.fetched > 10) {
    alerts.push(await notifyHardeningAlert("high_rejection_rate", {
      rate: signals.rejectionRate,
      fetched: signals.fetched,
      rejected: signals.rejected,
    }));
  }

  if (signals.aiDown) {
    alerts.push(await notifyHardeningAlert("ai_unavailable", { dedupeKey: "ai_unavailable_24h" }));
  }

  if (signals.rpcUnhealthy) {
    alerts.push(await notifyHardeningAlert("rpc_failure", { dedupeKey: "rpc_failure_global" }));
  }

  for (const connector of signals.degradedFeeds || []) {
    alerts.push(await notifyHardeningAlert("broken_rss", {
      slug: connector.slug,
      dedupeKey: `broken_rss:${connector.slug}`,
      error: connector.last_error,
    }));
  }

  return alerts.filter(Boolean);
}

export { ALERT_TEMPLATES };
