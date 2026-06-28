#!/usr/bin/env node
/**
 * Verify AKE near real-time modules (unit + dry).
 */
import { isConnectorDue, resolvePollIntervalMinutes, isPermanentFetchError } from "../lib/auto-knowledge-engine/connector-scheduler.mjs";
import { buildConditionalHeaders, computeFeedHash, filterNewFeedItems } from "../lib/auto-knowledge-engine/incremental-crawl.mjs";
import { detectDuplicate, normalizeUrl } from "../lib/auto-knowledge-engine/duplicate-detection.mjs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const now = new Date("2026-06-28T12:00:00Z");

assert(resolvePollIntervalMinutes({ slug: "islamweb-news", connector_type: "rss" }) === 15, "news 15m");
assert(resolvePollIntervalMinutes({ slug: "kuwait-lessons", connector_type: "rss" }) === 360, "library 6h");
assert(isConnectorDue({ slug: "x", is_active: true, last_checked_at: null }, now), "never checked = due");
assert(!isConnectorDue({ slug: "x", is_active: true, last_checked_at: now.toISOString(), poll_interval_minutes: 15 }, now), "just checked = not due");

const headers = buildConditionalHeaders({ last_etag: "abc", last_modified: "Mon, 01 Jan 2024 00:00:00 GMT" });
assert(headers["If-None-Match"] === "abc", "etag header");

const hash = computeFeedHash("<rss></rss>");
assert(hash.length === 32, "feed hash");

const items = filterNewFeedItems(
  [
    { external_id: "a", published_at: "2026-06-27T12:00:00Z" },
    { external_id: "b", published_at: "2026-06-28T12:00:00Z" },
  ],
  { sync_cursor_at: "2026-06-28T00:00:00Z" },
);
assert(items.length === 1 && items[0].external_id === "b", "cursor filter");

const dup = detectDuplicate(
  { external_id: "n1", raw_url: "https://example.com/a/", raw_title: "Test Title", published_at: "2026-06-01" },
  [{ id: "e1", raw_url: "https://example.com/a", raw_title: "Test Title", source_published_at: "2026-06-01", publish_status: "published" }],
);
assert(dup.isDuplicate && dup.reason === "url_match", "url dup");

assert(isPermanentFetchError("RSS permanent: 404"), "permanent 404");
assert(!isPermanentFetchError("timeout"), "timeout retryable");

console.log(JSON.stringify({ ok: true, tests: 10 }, null, 2));
