/**
 * Source health event audit trail — fetch/parse/connector failures.
 */

import { getSupabaseAdmin, isMissingTableError } from "../../supabase-admin.mjs";
import { createAkeAlert } from "../alerts.mjs";
import { akeLog } from "../monitoring.mjs";

export async function recordSourceHealthEvent({
  sourceId,
  connectorSlug,
  connectorType,
  eventType,
  healthScore,
  previousHealthScore,
  failureReason,
  errorMessage,
  retryCount = 0,
  recommendedAction,
  metadata = {},
  alertOnFailure = true,
}) {
  const admin = getSupabaseAdmin();
  const row = {
    source_id: sourceId || null,
    connector_slug: connectorSlug || null,
    connector_type: connectorType || null,
    event_type: eventType,
    health_score: healthScore ?? null,
    previous_health_score: previousHealthScore ?? null,
    failure_reason: failureReason || null,
    error_message: errorMessage || null,
    retry_count: retryCount,
    recommended_action: recommendedAction || null,
    metadata,
  };

  if (!admin) {
    akeLog("source-health-event", row);
    return null;
  }

  try {
    await admin.from("ake_source_health_events").insert(row);
  } catch (err) {
    if (!isMissingTableError(err)) akeLog("source-health-event", { error: err.message }, "error");
  }

  if (alertOnFailure && ["fetch_failed", "parse_failed", "connector_failed", "auto_disabled", "health_degraded"].includes(eventType)) {
    const severity =
      eventType === "auto_disabled" || (retryCount >= 3)
        ? "critical"
        : eventType === "health_degraded"
          ? "warning"
          : "warning";

    await createAkeAlert({
      type: eventType === "auto_disabled" ? "source_auto_disabled" : "source_failure",
      severity,
      title: `فشل المصدر: ${connectorSlug || "unknown"}`,
      message: errorMessage || failureReason || eventType,
      dedupeKey: `source:${connectorSlug}:${eventType}`,
      sourceId,
      connectorSlug,
      metadata: {
        connectorType,
        sourceUrl: metadata.sourceUrl || metadata.url,
        lastSuccessfulSync: metadata.lastSuccessfulSync,
        failureReason,
        errorMessage,
        retryCount,
        recommendedAction: recommendedAction || suggestAction(eventType, retryCount),
        ...metadata,
      },
    });
  }

  return row;
}

function suggestAction(eventType, retryCount) {
  if (eventType === "auto_disabled") return "راجع URL المصدر وأعد تفعيله يدوياً بعد الإصلاح.";
  if (retryCount >= 3) return "تحقق من صحة الرابط أو نوع الموصل (RSS/HTML/Instagram).";
  if (eventType === "parse_failed") return "تحقق من بنية RSS/JSON/HTML للمصدر.";
  return "انتظر إعادة المحاولة التلقائية أو شغّل فحص الصحة يدوياً.";
}

export async function getRecentSourceHealthEvents(limit = 40) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  try {
    const { data } = await admin
      .from("ake_source_health_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}
