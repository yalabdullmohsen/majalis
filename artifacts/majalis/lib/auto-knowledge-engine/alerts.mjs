/**
 * AKE admin alerts — deduplicated, idempotent, auto-resolving.
 */

import { getSupabaseAdmin, isMissingTableError } from "../supabase-admin.mjs";
import { notifyAdminsAkeAlert } from "./monitoring/notify.mjs";
import { akeLog } from "./monitoring.mjs";

const ALERT_THRESHOLDS = {
  noPublishHours: 24,
  noSyncHours: 12,
  queueSize: 50,
  rejectedDaily: 20,
  consecutiveFailures: 3,
};

export async function createAkeAlert(alert) {
  const admin = getSupabaseAdmin();
  const dedupeKey = alert.dedupeKey || alert.dedupe_key || `${alert.type}:${alert.connectorSlug || "global"}`;
  const title = alert.title || alert.message || alert.type;
  const row = {
    alert_type: alert.type,
    severity: alert.severity || "warning",
    title,
    message: alert.message,
    connector_slug: alert.connectorSlug || null,
    source_id: alert.sourceId || null,
    run_id: alert.runId || null,
    dedupe_key: dedupeKey,
    status: "open",
    resolved: false,
    metadata: alert.metadata || {},
  };

  if (!admin) {
    console.log(JSON.stringify({ tag: "ake:alert", ...row }));
    return { created: false, logged: true };
  }

  try {
    const { data: existing } = await admin
      .from("ake_alerts")
      .select("id, metadata")
      .eq("dedupe_key", dedupeKey)
      .eq("status", "open")
      .maybeSingle();

    if (existing?.id) {
      await admin
        .from("ake_alerts")
        .update({
          message: row.message,
          severity: row.severity,
          metadata: { ...(existing.metadata || {}), ...(row.metadata || {}), lastSeenAt: new Date().toISOString() },
        })
        .eq("id", existing.id);
      return { created: false, updated: true, id: existing.id };
    }

    const { data, error } = await admin.from("ake_alerts").insert(row).select("id").single();
    if (error) throw error;

    await notifyAdminsAkeAlert({
      severity: row.severity,
      title: row.title,
      message: row.message,
      metadata: row.metadata,
    });

    return { created: true, id: data?.id };
  } catch (err) {
    if (!isMissingTableError(err)) {
      akeLog("alert", { error: err.message }, "error");
    }
    return { created: false, error: err.message };
  }
}

export async function resolveAkeAlert({ dedupeKey, alertId, ignored = false } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return 0;

  const patch = {
    status: ignored ? "ignored" : "resolved",
    resolved: !ignored,
    resolved_at: new Date().toISOString(),
  };

  try {
    let q = admin.from("ake_alerts").update(patch).eq("status", "open");
    if (alertId) q = q.eq("id", alertId);
    else if (dedupeKey) q = q.eq("dedupe_key", dedupeKey);
    else return 0;
    const { data } = await q.select("id");
    return (data || []).length;
  } catch {
    return 0;
  }
}

export async function autoResolveAlerts(conditions = {}) {
  const resolved = [];
  if (conditions.publishResumed) {
    resolved.push(await resolveAkeAlert({ dedupeKey: "no_publish_24h" }));
  }
  if (conditions.syncResumed) {
    resolved.push(await resolveAkeAlert({ dedupeKey: "ake_sync_stale_12h" }));
  }
  if (conditions.queueBelowThreshold) {
    resolved.push(await resolveAkeAlert({ dedupeKey: "review_queue_high" }));
  }
  if (conditions.connectorSlug) {
    resolved.push(await resolveAkeAlert({ dedupeKey: `source:${conditions.connectorSlug}:source_failure` }));
    resolved.push(await resolveAkeAlert({ dedupeKey: `source:${conditions.connectorSlug}:auto_disabled` }));
  }
  return resolved.reduce((a, b) => a + b, 0);
}

/** Legacy evaluator — delegates to rules engine when available. */
export async function evaluateAkeAlerts(context = {}) {
  const { evaluateMonitoringRules } = await import("./monitoring/rules.mjs");
  return evaluateMonitoringRules(context);
}

export async function getOpenAlerts(limit = 50, { severity } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  try {
    let q = admin
      .from("ake_alerts")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (severity) q = q.eq("severity", severity);
    const { data } = await q;
    return data || [];
  } catch {
    try {
      const { data } = await admin
        .from("ake_alerts")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(limit);
      return data || [];
    } catch {
      return [];
    }
  }
}

export { ALERT_THRESHOLDS };
