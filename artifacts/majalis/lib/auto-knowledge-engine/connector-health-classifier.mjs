/**
 * Connector health taxonomy — real percentage, not blanket "critical".
 *
 * States: Healthy | Degraded | Credential Required | Disabled | External Failure | Unknown
 */

export const CONNECTOR_HEALTH_STATES = [
  "Healthy",
  "Degraded",
  "Credential Required",
  "Disabled",
  "External Failure",
  "Unknown",
];

const CREDENTIAL_PATTERNS = [
  /token/i,
  /credential/i,
  /api_key/i,
  /unauthorized/i,
  /401/,
  /403/,
  /not configured/i,
  /missing.*secret/i,
  /instagram_connector_not_configured/i,
  /bot_token/i,
];

const EXTERNAL_FAILURE_PATTERNS = [
  /timeout/i,
  /503/,
  /502/,
  /504/,
  /429/,
  /rate.?limit/i,
  /econnrefused/i,
  /fetch failed/i,
  /network/i,
  /dns/i,
  /ssl/i,
  /graph_api_error/i,
];

/**
 * Classify a connector row + optional live health probe.
 */
export function classifyConnectorHealth(config, probe = {}) {
  if (config.is_active === false) {
    return {
      state: "Disabled",
      healthy: false,
      score: 0,
      reason: "connector_inactive",
    };
  }

  const apiConfig = config.api_config || config.apiConfig || {};
  const connectorType = config.connector_type || config.connectorType || "rss";

  if (connectorType === "instagram" && !process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN) {
    return {
      state: "Credential Required",
      healthy: false,
      score: 0,
      reason: "instagram_connector_not_configured",
    };
  }

  if (connectorType === "telegram" && apiConfig.require_bot && !apiConfig.bot_token) {
    return {
      state: "Credential Required",
      healthy: false,
      score: 0,
      reason: "telegram_bot_token_missing",
    };
  }

  const err = String(probe.error || probe.failureReason || "").trim();
  const dbStatus = String(config.health_status || "").toLowerCase();
  const failures = Number(config.consecutive_failures || 0);

  if (probe.healthy === true || dbStatus === "healthy") {
    if (failures > 0 || probe.degraded) {
      return { state: "Degraded", healthy: false, score: 70, reason: probe.error || "recent_failures" };
    }
    return { state: "Healthy", healthy: true, score: 100, reason: null };
  }

  if (err && CREDENTIAL_PATTERNS.some((p) => p.test(err))) {
    return { state: "Credential Required", healthy: false, score: 0, reason: err };
  }

  if (err && EXTERNAL_FAILURE_PATTERNS.some((p) => p.test(err))) {
    return { state: "External Failure", healthy: false, score: 20, reason: err };
  }

  if (dbStatus === "down" || probe.healthy === false) {
    if (failures >= 3) {
      return { state: "External Failure", healthy: false, score: 15, reason: err || "consecutive_failures" };
    }
    return { state: "Degraded", healthy: false, score: 50, reason: err || dbStatus || "health_check_failed" };
  }

  return { state: "Unknown", healthy: false, score: 40, reason: err || "no_probe_data" };
}

/**
 * Aggregate connector health summary with real percentage.
 */
export function summarizeConnectorHealth(connectors, probeResults = []) {
  const probeBySlug = Object.fromEntries(
    (probeResults || []).map((r) => [r.slug, r]),
  );

  const breakdown = Object.fromEntries(CONNECTOR_HEALTH_STATES.map((s) => [s, 0]));
  const items = [];

  for (const config of connectors || []) {
    const probe = probeBySlug[config.slug] || {};
    const classification = classifyConnectorHealth(config, probe);
    breakdown[classification.state] = (breakdown[classification.state] || 0) + 1;
    items.push({
      slug: config.slug,
      name: config.name,
      connector_type: config.connector_type || config.connectorType,
      is_active: config.is_active !== false,
      ...classification,
      last_checked_at: config.last_health_check || config.last_checked_at || probe.checkedAt || null,
      consecutive_failures: config.consecutive_failures || 0,
    });
  }

  const total = items.length || 1;
  const healthyCount = breakdown.Healthy || 0;
  const healthPercent = Math.round((healthyCount / total) * 100);

  let overallStatus = "Healthy";
  if (breakdown["External Failure"] > 0 || breakdown["Credential Required"] > total * 0.3) {
    overallStatus = breakdown.Healthy >= total * 0.7 ? "Degraded" : "Degraded";
  }
  if (healthyCount === 0 && total > 0) overallStatus = "Degraded";
  if (breakdown.Disabled === total) overallStatus = "Disabled";

  return {
    total,
    breakdown,
    healthPercent,
    overallStatus,
    healthy: healthyCount,
    items,
    label: `${healthyCount}/${total} Healthy — ${healthPercent}%`,
  };
}
