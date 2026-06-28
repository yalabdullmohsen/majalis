/**
 * Per-connector intelligent scheduling — only poll when due.
 */

export const DEFAULT_POLL_INTERVALS = {
  rss: 15,
  manifest: 30,
  seed: 360,
  instagram: 15,
  youtube: 15,
  telegram: 15,
  website: 30,
  html: 30,
  sitemap: 30,
  x: 15,
  facebook: 15,
  whatsapp: 15,
  inactive: 1440,
  default: 15,
};

/** High-frequency news sources (15 min). */
const NEWS_SLUGS = new Set(["islamweb-news", "alukah-articles"]);

/** Priority lesson sources — custom poll intervals. */
const SLUG_POLL_OVERRIDES = {
  "instagram-murtaqaa": 10,
  "telegram-drosq8": 5,
};

/** Large libraries / static (6h). */
const LIBRARY_SLUGS = new Set(["kuwait-lessons", "kfas-sharia"]);

export function resolvePollIntervalMinutes(connector) {
  if (connector.poll_interval_minutes > 0) {
    return connector.poll_interval_minutes;
  }
  const cfg = connector.api_config?.poll_interval_minutes;
  if (cfg > 0) return cfg;

  if (SLUG_POLL_OVERRIDES[connector.slug]) return SLUG_POLL_OVERRIDES[connector.slug];
  if (NEWS_SLUGS.has(connector.slug)) return 15;
  if (LIBRARY_SLUGS.has(connector.slug)) return 360;

  const type = connector.connector_type || "rss";
  return DEFAULT_POLL_INTERVALS[type] || DEFAULT_POLL_INTERVALS.default;
}

export function isConnectorDue(connector, now = new Date()) {
  if (connector.is_active === false) return false;
  if (connector.auto_disabled_at) return false;
  if (connector.connector_type === "inactive") return false;

  const intervalMin = resolvePollIntervalMinutes(connector);
  const lastChecked = connector.last_checked_at || connector.last_sync_at || connector.last_success_at;
  if (!lastChecked) return true;

  const elapsedMs = now.getTime() - new Date(lastChecked).getTime();
  return elapsedMs >= intervalMin * 60_000;
}

export function filterDueConnectors(connectors, now = new Date()) {
  return (connectors || []).filter((c) => isConnectorDue(c, now));
}

export function shouldAutoDisable(connector) {
  const failures = connector.consecutive_failures || 0;
  if (failures < 5) return false;
  const lastError = connector.last_error || "";
  if (/404|410|not found|unsupported|invalid format/i.test(lastError)) return true;
  return failures >= 10;
}

export function isPermanentFetchError(error) {
  if (!error) return false;
  return /404|410|unsupported format|invalid content|deleted source/i.test(String(error));
}
