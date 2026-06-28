/**
 * AKE admin alerts — notify on anomalies.
 */

import { getSupabaseAdmin, isMissingTableError } from "../supabase-admin.mjs";

const ALERT_THRESHOLDS = {
  noPublishHours: 24,
  queueSize: 50,
  failureRatePct: 40,
  retryLoopCount: 20,
};

export async function createAkeAlert(alert) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.log(JSON.stringify({ tag: "ake:alert", ...alert }));
    return;
  }
  try {
    await admin.from("ake_alerts").insert({
      alert_type: alert.type,
      severity: alert.severity || "warning",
      message: alert.message,
      connector_slug: alert.connectorSlug || null,
      metadata: alert.metadata || {},
    });
  } catch (err) {
    if (!isMissingTableError(err)) console.error("[ake:alert]", err.message);
  }
}

export async function evaluateAkeAlerts(context = {}) {
  const admin = getSupabaseAdmin();
  const alerts = [];
  if (!admin) return alerts;

  const now = Date.now();

  if (context.lastPublishedAt) {
    const hours = (now - new Date(context.lastPublishedAt).getTime()) / 3_600_000;
    if (hours >= ALERT_THRESHOLDS.noPublishHours) {
      alerts.push({
        type: "no_publish_24h",
        severity: "critical",
        message: `No content published in ${Math.round(hours)} hours`,
      });
    }
  }

  if ((context.queueSize || 0) >= ALERT_THRESHOLDS.queueSize) {
    alerts.push({
      type: "queue_growth",
      severity: "warning",
      message: `Queue size ${context.queueSize} exceeds threshold`,
    });
  }

  for (const c of context.downConnectors || []) {
    alerts.push({
      type: "connector_stopped",
      severity: "warning",
      message: `Connector ${c.slug} is down`,
      connectorSlug: c.slug,
    });
  }

  if (context.missedCycles > 2) {
    alerts.push({
      type: "cron_missed",
      severity: "critical",
      message: `Missed ${context.missedCycles} AKE cycles`,
    });
  }

  if (context.databaseDown) {
    alerts.push({ type: "database_unavailable", severity: "critical", message: "Database unavailable" });
  }

  if (context.aiDown) {
    alerts.push({ type: "ai_unavailable", severity: "warning", message: "AI services unavailable — using fallback" });
  }

  if ((context.publishFailures || 0) >= 10) {
    alerts.push({
      type: "publish_failures",
      severity: "warning",
      message: `${context.publishFailures} publishing failures this cycle`,
    });
  }

  for (const a of alerts) {
    await createAkeAlert(a);
  }

  return alerts;
}

export async function getOpenAlerts(limit = 20) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
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
