/**
 * Connector health intelligence — extended metrics and auto-disable.
 */

import { shouldAutoDisable } from "../connector-scheduler.mjs";
import { akeLog } from "../monitoring.mjs";

export function computeConnectorHealthSnapshot(connector, cycleStats = {}) {
  const discovered = cycleStats.fetched || cycleStats.rawFetched || 0;
  const published = cycleStats.published || 0;
  const duplicate = cycleStats.duplicate || 0;
  const rejected = cycleStats.rejected || 0;
  const total = discovered || 1;

  const duplicatePct = Math.round((duplicate / total) * 1000) / 10;
  const failureRate = connector.consecutive_failures
    ? Math.min(100, (connector.consecutive_failures || 0) * 10)
    : connector.failure_rate_pct || 0;

  let health = "healthy";
  if (connector.health_status === "down" || (connector.consecutive_failures || 0) >= 5) {
    health = "down";
  } else if (connector.feed_degraded_at || failureRate > 30 || (connector.consecutive_failures || 0) >= 2) {
    health = "degraded";
  }

  return {
    slug: connector.slug,
    name: connector.name,
    health,
    lastSuccessfulSync: connector.last_success_at,
    avgResponseMs: connector.avg_response_ms || 0,
    failureRatePct: failureRate,
    itemsDiscovered: (connector.items_discovered || 0) + discovered,
    itemsPublished: (connector.items_published || 0) + published,
    duplicatePct,
    trustScore: connector.trust_score || connector.trust_level || 0,
    autoPublish: connector.auto_publish !== false,
    isActive: connector.is_active !== false,
    autoDisabled: Boolean(connector.auto_disabled_at),
    consecutiveFailures: connector.consecutive_failures || 0,
  };
}

export async function updateConnectorIntelligence(admin, connector, cycleStats = {}, fetchMeta = {}) {
  if (!admin || !connector.id) return null;

  const snapshot = computeConnectorHealthSnapshot(connector, cycleStats);
  const responseMs = fetchMeta.responseMs;
  const prevAvg = connector.avg_response_ms || 0;
  const newAvg = responseMs
    ? Math.round(prevAvg * 0.7 + responseMs * 0.3)
    : prevAvg;

  const patch = {
    avg_response_ms: newAvg,
    failure_rate_pct: snapshot.failureRatePct,
    duplicate_pct: snapshot.duplicatePct,
    items_discovered: snapshot.itemsDiscovered,
    items_published: snapshot.itemsPublished,
    trust_score: snapshot.trustScore,
    health_status: snapshot.health,
    updated_at: new Date().toISOString(),
  };

  if (cycleStats.ok !== false && !cycleStats.error) {
    patch.last_success_at = new Date().toISOString();
    patch.consecutive_failures = 0;
    patch.failure_rate_pct = Math.max(0, snapshot.failureRatePct - 5);
  }

  try {
    await admin.from("ake_connectors").update(patch).eq("id", connector.id);
  } catch {
    /* ignore missing columns */
  }

  if (shouldAutoDisable({ ...connector, consecutive_failures: connector.consecutive_failures || 0 })) {
    await autoDisableConnector(admin, connector, "consecutive_failures");
  }

  return snapshot;
}

export async function autoDisableConnector(admin, connector, reason) {
  if (!admin || !connector.id || connector.auto_disabled_at) return;
  try {
    await admin.from("ake_connectors").update({
      is_active: false,
      auto_disabled_at: new Date().toISOString(),
      last_error: `auto_disabled:${reason}`,
      health_status: "down",
    }).eq("id", connector.id);

    akeLog("connector-auto-disable", { slug: connector.slug, reason }, "warn");

    const { createAkeAlert } = await import("../alerts.mjs");
    await createAkeAlert({
      type: "connector_stopped",
      severity: "warning",
      title: `تم تعطيل المصدر: ${connector.name || connector.slug}`,
      message: `تعطيل تلقائي بسبب ${reason}`,
      dedupeKey: `connector_stopped:${connector.slug}`,
      connectorSlug: connector.slug,
      metadata: {
        reason,
        recommendedAction: "راجع feed_url وأعد تفعيل المصدر من لوحة AKE.",
      },
    });
  } catch {
    /* ignore */
  }
}

export async function getConnectorHealthPanel(admin) {
  if (!admin) return [];
  const { data } = await admin
    .from("ake_connectors")
    .select("id, slug, name, health_status, last_success_at, last_sync_at, avg_response_ms, failure_rate_pct, duplicate_pct, items_discovered, items_published, trust_score, trust_level, auto_publish, is_active, consecutive_failures, feed_degraded_at, auto_disabled_at")
    .order("name");

  return (data || []).map((c) => computeConnectorHealthSnapshot(c));
}
