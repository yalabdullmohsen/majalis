/**
 * Incremental crawl — ETag, Last-Modified, feed hash, cursor.
 */

import { createHash } from "node:crypto";

export function buildConditionalHeaders(connector) {
  const headers = {};
  if (connector.last_etag) headers["If-None-Match"] = connector.last_etag;
  if (connector.last_modified) headers["If-Modified-Since"] = connector.last_modified;
  return headers;
}

export function computeFeedHash(content) {
  return createHash("sha256").update(String(content || "")).digest("hex").slice(0, 32);
}

export function extractResponseCrawlState(response, body) {
  return {
    last_etag: response.headers.get("etag") || null,
    last_modified: response.headers.get("last-modified") || null,
    last_feed_hash: computeFeedHash(body),
    last_checked_at: new Date().toISOString(),
  };
}

export function filterNewFeedItems(items, connector) {
  if (!items?.length) return [];

  const cursor = connector.last_cursor || connector.sync_cursor_at;
  const lastPublished = connector.last_published_item_id;

  let filtered = items;

  if (cursor) {
    const cursorMs = new Date(cursor).getTime();
    if (!Number.isNaN(cursorMs)) {
      filtered = filtered.filter((item) => {
        const pub = item.published_at || item.raw_payload?.pubDate;
        if (!pub) return true;
        const ms = new Date(pub).getTime();
        return Number.isNaN(ms) || ms > cursorMs;
      });
    }
  }

  if (lastPublished) {
    const idx = filtered.findIndex((i) => i.external_id === lastPublished);
    if (idx >= 0) filtered = filtered.slice(0, idx);
  }

  return filtered;
}

export function buildConnectorCrawlPatch(response, body, items, connector) {
  const state = extractResponseCrawlState(response, body);
  const latest = items?.[0];
  if (latest?.external_id) {
    state.last_published_item_id = latest.external_id;
  }
  const pub = latest?.published_at || latest?.raw_payload?.pubDate;
  if (pub) {
    const d = new Date(pub);
    if (!Number.isNaN(d.getTime())) state.last_cursor = d.toISOString();
  }
  return state;
}
