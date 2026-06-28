/**
 * Connector health classification — required vs optional vs credential gaps.
 */
import { isInstagramGraphConfigured } from "../../cms/instagram-graph-api.mjs";

/** Core Kuwait lesson / web sources that must stay healthy. */
export const REQUIRED_CONNECTOR_HANDLES = [
  "drooss_kw", "othmanalkamees", "ibnabitallib", "masjedalmehry", "warathakw2",
  "mpe.kh11", "masjedalansary", "moudhi_mosque", "alshalahi_masjid",
  "masjid_alshalahi_women", "mhamadh.kw", "dr_hayaalsabah", "shariakuniv",
  "nadwat2025", "kwt_awqaf", "DrosQ8", "drosq8",
];

export const REQUIRED_WEB_SLUGS = [
  "web-drhayaalsabah", "web-othmanalkamees", "web-awqaf-kw",
  "tg-drosq8", "telegram-drosq8",
];

const OPTIONAL_CONNECTOR_TYPES = new Set(["seed", "manifest", "inactive"]);
const CREDENTIAL_PLATFORMS = new Set(["instagram"]);

function isRequiredConnector(connector) {
  const slug = String(connector.slug || "").toLowerCase();
  const handle = String(connector.handle || connector.api_config?.handle || "").toLowerCase();
  if (REQUIRED_WEB_SLUGS.some((s) => slug === s || slug.includes(s))) return true;
  if (REQUIRED_CONNECTOR_HANDLES.some((h) => handle === h.toLowerCase() || slug.includes(h.toLowerCase()))) return true;
  if (connector.source_priority != null && connector.source_priority <= 2) return true;
  return false;
}

function inferFailureReason(connector, health = {}) {
  if (health.reason) return health.reason;
  if (health.error === "no_url") return "disabled_by_admin";
  const code = health.statusCode;
  if (code === 403) return "external_403";
  if (code === 429) return "rate_limited";
  if (health.error?.includes("timeout") || health.error?.includes("Timeout")) return "external_timeout";
  if (health.error) return "external_timeout";
  if (connector.consecutive_failures >= 2 && !health.healthy) return "no_recent_items";
  return health.healthy ? null : "external_timeout";
}

/**
 * @returns {{
 *   slug: string,
 *   tier: 'required'|'optional'|'credential_required'|'blocked_external'|'disabled_intentionally',
 *   healthTier: 'healthy'|'degraded'|'unhealthy'|'disabled'|'setup_required',
 *   reason: string|null,
 *   platform: string|null,
 * }}
 */
export function classifyConnector(connector, health = {}) {
  const slug = connector.slug || "unknown";
  const platform = (connector.platform || connector.connector_type || "").toLowerCase();
  const base = { slug, platform: platform || null };

  if (connector.is_active === false || connector.connector_type === "inactive") {
    return {
      ...base,
      tier: "disabled_intentionally",
      healthTier: "disabled",
      reason: "disabled_by_admin",
    };
  }

  if (
    (CREDENTIAL_PLATFORMS.has(platform) || slug.startsWith("ig-"))
    && !isInstagramGraphConfigured()
  ) {
    return {
      ...base,
      tier: "credential_required",
      healthTier: "setup_required",
      reason: "missing_credentials",
    };
  }

  const required = isRequiredConnector(connector);
  const optional = OPTIONAL_CONNECTOR_TYPES.has(connector.connector_type) || !required;

  if (health.statusCode === 403) {
    return {
      ...base,
      tier: required ? "blocked_external" : "optional",
      healthTier: required ? "unhealthy" : "degraded",
      reason: "external_403",
    };
  }

  if (health.healthy) {
    return {
      ...base,
      tier: required ? "required" : "optional",
      healthTier: "healthy",
      reason: null,
    };
  }

  const reason = inferFailureReason(connector, health);

  if (required) {
    return {
      ...base,
      tier: reason === "missing_credentials" ? "credential_required" : "required",
      healthTier: "unhealthy",
      reason,
    };
  }

  return {
    ...base,
    tier: "optional",
    healthTier: "degraded",
    reason,
  };
}

export function summarizeConnectorHealth(classified = []) {
  const summary = {
    active: classified.filter((c) => c.healthTier !== "disabled").length,
    requiredHealthy: 0,
    requiredUnhealthy: 0,
    optionalDegraded: 0,
    credentialsMissing: 0,
    externalBlocked: 0,
    disabledIntentionally: 0,
    healthy: 0,
    failing: 0,
    connectors: classified,
  };

  for (const c of classified) {
    if (c.healthTier === "healthy") summary.healthy++;
    if (c.healthTier === "unhealthy" || c.healthTier === "degraded") summary.failing++;
    if (c.tier === "required" && c.healthTier === "healthy") summary.requiredHealthy++;
    if (c.tier === "required" && c.healthTier === "unhealthy") summary.requiredUnhealthy++;
    if (c.tier === "optional" && c.healthTier === "degraded") summary.optionalDegraded++;
    if (c.tier === "credential_required" || c.reason === "missing_credentials") summary.credentialsMissing++;
    if (c.reason === "external_403") summary.externalBlocked++;
    if (c.tier === "disabled_intentionally") summary.disabledIntentionally++;
  }

  if (summary.requiredUnhealthy > 0) summary.systemStatus = "critical";
  else if (summary.optionalDegraded > 0 || summary.credentialsMissing > 0) summary.systemStatus = "degraded";
  else if (summary.healthy > 0) summary.systemStatus = "healthy";
  else summary.systemStatus = "idle";

  return summary;
}

export async function classifyConnectorWithHealth(connector, healthCheckFn) {
  let health = { healthy: false, error: "not_checked" };
  const pre = classifyConnector(connector, {});

  if (pre.healthTier === "disabled" || pre.healthTier === "setup_required") {
    return { ...pre, health: { healthy: false, skipped: true, reason: pre.reason } };
  }

  try {
    health = await healthCheckFn(connector);
  } catch (err) {
    health = { healthy: false, error: err.message, checkedAt: new Date().toISOString() };
  }

  const classified = classifyConnector(connector, health);
  return { ...classified, health };
}
