/**
 * Generic sync window — current-month backfill and incremental cursors.
 * Used by all connector types via BaseConnector.run().
 */

export function currentMonthKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function startOfCurrentMonthUtc(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function endOfCurrentMonthUtc(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

/** Extract best-effort source publication timestamp from any connector item. */
export function extractSourcePublishedAt(item) {
  const candidates = [
    item.published_at,
    item.raw_payload?.pubDate,
    item.raw_payload?.published_at,
    item.raw_payload?.session_date,
    item.raw_payload?.date,
    item.raw_payload?.created_at,
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

export function buildBackfillWindow(date = new Date()) {
  return {
    mode: "backfill",
    since: startOfCurrentMonthUtc(date),
    until: date,
    monthKey: currentMonthKey(date),
  };
}

export function buildIncrementalWindow(connector, date = new Date()) {
  const cursorRaw =
    connector.sync_cursor_at ||
    connector.last_success_at ||
    connector.last_sync_at ||
    startOfCurrentMonthUtc(date).toISOString();
  const since = new Date(cursorRaw);
  return {
    mode: "incremental",
    since: Number.isNaN(since.getTime()) ? startOfCurrentMonthUtc(date) : since,
    until: date,
    monthKey: currentMonthKey(date),
  };
}

/**
 * Filter items to sync window. Items without a parseable date are excluded in
 * backfill mode (prevents historical overload). In incremental mode they are
 * kept so brand-new undated items can still be indexed once.
 */
export function filterItemsBySyncWindow(items, window) {
  if (!window?.since) return items || [];

  const sinceMs = new Date(window.since).getTime();
  const untilMs = window.until ? new Date(window.until).getTime() : Date.now();

  return (items || []).filter((item) => {
    const published = extractSourcePublishedAt(item);
    if (!published) {
      return window.mode === "incremental";
    }
    const ms = published.getTime();
    if (ms < sinceMs) return false;
    if (ms > untilMs) return false;
    return true;
  });
}

export function sortItemsByPublishedAtDesc(items) {
  return [...(items || [])].sort((a, b) => {
    const da = extractSourcePublishedAt(a)?.getTime() || 0;
    const db = extractSourcePublishedAt(b)?.getTime() || 0;
    return db - da;
  });
}

export function isConnectorBackfillDone(connector, monthKey) {
  return connector.backfill_month_key === monthKey && Boolean(connector.backfill_completed_at);
}

export function resolveConnectorImportMode(connector, globalMode, monthKey) {
  const forced = connector.sync_mode || connector.api_config?.sync_mode;
  if (forced === "backfill") return "backfill";
  if (forced === "incremental") return "incremental";

  if (globalMode === "incremental") return "incremental";
  if (isConnectorBackfillDone(connector, monthKey)) return "incremental";
  return "backfill";
}

export function buildConnectorSyncWindow(connector, importMode, date = new Date()) {
  if (importMode === "backfill") {
    return buildBackfillWindow(date);
  }
  return buildIncrementalWindow(connector, date);
}
