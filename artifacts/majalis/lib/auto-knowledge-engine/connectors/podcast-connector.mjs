/**
 * Podcast connector — RSS with audio/video enclosures (lessons).
 */

import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { extractRssItems } from "../../auto-content/auto-content-utils.mjs";
import { buildConditionalHeaders, filterNewFeedItems, buildConnectorCrawlPatch } from "../incremental-crawl.mjs";
import { enrichItemClassification } from "../autonomous/content-router.mjs";

export class PodcastConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const feedUrl = this.apiConfig.podcast_feed_url || this.podcast_feed_url || this.feedUrl;
    if (!feedUrl) return [];

    const connectorConfig = syncOptions.connectorConfig || {};
    const headers = buildConditionalHeaders(connectorConfig);
    const response = await this.fetchWithTimeout(feedUrl, { headers });
    if (response.status === 304) {
      syncOptions._notModified = true;
      return [];
    }
    if (!response.ok) throw new Error(`Podcast RSS failed: ${response.status}`);

    const xml = await response.text();
    const rssItems = extractRssItems(xml);
    let items = rssItems.map((item, idx) => enrichItemClassification({
      external_id: `${this.slug}:pod:${Buffer.from(item.link || item.title).toString("base64").slice(0, 40)}`,
      source_slug: this.slug,
      source_attribution: this.name,
      source_url: this.officialUrl,
      raw_url: item.link,
      raw_title: item.title,
      raw_body: item.description,
      raw_payload: { pubDate: item.pubDate, index: idx, media_type: "audio", enclosure_url: item.enclosure, is_podcast: true },
      content_kind: normalizeContentKind("lesson"),
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
    }, this));

    items = filterNewFeedItems(items, connectorConfig);
    syncOptions._crawlPatch = buildConnectorCrawlPatch(response, xml, items, connectorConfig);
    return items;
  }
}
