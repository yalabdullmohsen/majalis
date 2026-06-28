/**
 * RSS reliability layer — mirrors, alternate URLs, format detection, feed caching.
 */

import { classifyRetryError, RETRY_CLASS } from "./adaptive-retry.mjs";
import { extractRssItems } from "../../auto-content/auto-content-utils.mjs";
import { akeLog } from "../monitoring.mjs";

const FEED_FORMATS = ["rss", "atom", "json", "xml"];

export function detectFeedFormat(contentType, body) {
  const ct = String(contentType || "").toLowerCase();
  const text = String(body || "").trim().slice(0, 500);

  if (ct.includes("json") || text.startsWith("{") || text.startsWith("[")) return "json";
  if (text.includes("<feed") && text.includes("xmlns=\"http://www.w3.org/2005/Atom\"")) return "atom";
  if (text.includes("<rss") || text.includes("<channel")) return "rss";
  if (text.includes("<?xml")) return "xml";
  return "rss";
}

export function parseFeedBody(body, format) {
  if (format === "json") {
    return parseJsonFeed(body);
  }
  return extractRssItems(body);
}

function parseJsonFeed(body) {
  try {
    const data = JSON.parse(body);
    const items = data.items || data.entries || data.articles || data.feed?.items || [];
    return items.map((item) => ({
      title: item.title || item.name || "",
      link: item.url || item.link || item.guid || "",
      description: item.summary || item.description || item.content || item.content_html || "",
      pubDate: item.date_published || item.published || item.pubDate || item.updated || null,
    }));
  } catch {
    return [];
  }
}

export function buildFeedUrlList(connector) {
  const urls = [];
  const seen = new Set();

  function add(url, priority = 10, format = "rss") {
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push({ url, priority, format });
  }

  if (connector.cached_feed_url) add(connector.cached_feed_url, 0, connector.feed_format || "rss");
  if (connector.feed_url) add(connector.feed_url, 1, connector.feed_format || "rss");
  if (connector.podcast_feed_url) add(connector.podcast_feed_url, 2, "rss");
  if (connector.sitemap_url) add(connector.sitemap_url, 5, "sitemap");

  const mirrors = connector.feed_mirror_urls || connector.api_config?.mirror_urls || [];
  for (const m of mirrors) {
    add(typeof m === "string" ? m : m.url, typeof m === "object" ? (m.priority || 3) : 3);
  }

  return urls.sort((a, b) => a.priority - b.priority);
}

export async function fetchFeedWithReliability(connector, fetchFn, options = {}) {
  const urls = buildFeedUrlList(connector);
  if (urls.length === 0) {
    throw new Error("RSS permanent: no feed URL configured");
  }

  let lastError = null;
  let lastStatus = null;

  for (const { url, format } of urls) {
    const start = Date.now();
    try {
      const response = await fetchFn(url, options.headers || {});
      lastStatus = response.status;

      if (response.status === 304) {
        return { notModified: true, url, format, responseMs: Date.now() - start };
      }

      if (response.status === 404 || response.status === 410) {
        lastError = new Error(`RSS permanent: ${response.status}`);
        continue;
      }

      if (response.status === 403 || response.status === 401) {
        lastError = new Error(`RSS unavailable: ${response.status}`);
        continue;
      }

      if (!response.ok) {
        lastError = new Error(`RSS failed: ${response.status}`);
        continue;
      }

      const body = await response.text();
      const detectedFormat = detectFeedFormat(response.headers.get("content-type"), body);
      const items = parseFeedBody(body, format === "sitemap" ? "rss" : (format || detectedFormat));

      if (items.length === 0 && body.length > 100) {
        lastError = new Error("unsupported format: empty parse result");
        continue;
      }

      return {
        ok: true,
        url,
        format: detectedFormat,
        items,
        body,
        response,
        responseMs: Date.now() - start,
        etag: response.headers.get("etag"),
        lastModified: response.headers.get("last-modified"),
      };
    } catch (err) {
      lastError = err;
      const { class: retryClass } = classifyRetryError(err);
      if (retryClass === RETRY_CLASS.NEVER) continue;
    }
  }

  akeLog("feed-reliability", {
    slug: connector.slug,
    tried: urls.length,
    lastStatus,
    error: lastError?.message,
  }, "warn");

  throw lastError || new Error(`RSS failed: all ${urls.length} URLs exhausted`);
}

export async function cacheSuccessfulFeedUrl(admin, connector, result) {
  if (!admin || !result?.url) return;
  try {
    await admin.from("ake_feed_cache").upsert({
      connector_id: connector.id || null,
      connector_slug: connector.slug,
      feed_url: result.url,
      feed_format: result.format || "rss",
      http_status: result.response?.status || 200,
      etag: result.etag || null,
      last_modified: result.lastModified || null,
      last_success_at: new Date().toISOString(),
      is_primary: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "connector_slug,feed_url" });

    if (connector.id) {
      await admin.from("ake_connectors").update({
        cached_feed_url: result.url,
        feed_format: result.format || "rss",
        feed_degraded_at: null,
        updated_at: new Date().toISOString(),
      }).eq("id", connector.id);
    }
  } catch {
    /* table may not exist yet */
  }
}

export async function markFeedDegraded(admin, connector, error) {
  if (!admin || !connector.id) return;
  try {
    await admin.from("ake_connectors").update({
      health_status: "degraded",
      feed_degraded_at: new Date().toISOString(),
      last_error: String(error?.message || error).slice(0, 500),
      updated_at: new Date().toISOString(),
    }).eq("id", connector.id);
  } catch {
    /* ignore */
  }
}

export async function checkDegradedFeedAlert(admin, connector) {
  if (!admin || !connector.feed_degraded_at) return null;
  const degradedMs = Date.now() - new Date(connector.feed_degraded_at).getTime();
  if (degradedMs < 24 * 3_600_000) return null;

  const { createAkeAlert } = await import("../alerts.mjs");
  return createAkeAlert({
    type: "broken_rss_24h",
    severity: "warning",
    title: `RSS معطّل +24h: ${connector.name || connector.slug}`,
    message: `المصدر ${connector.slug} بدون feed ناجح منذ ${Math.round(degradedMs / 3_600_000)} ساعة`,
    dedupeKey: `broken_rss:${connector.slug}`,
    connectorSlug: connector.slug,
    metadata: {
      lastError: connector.last_error,
      feedUrl: connector.feed_url,
      recommendedAction: "أضف mirror URL أو حدّث feed_url في ake_connectors.",
    },
  });
}

export { FEED_FORMATS };
