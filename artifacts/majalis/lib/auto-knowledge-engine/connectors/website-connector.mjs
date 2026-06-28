/**
 * Website Hybrid Connector — RSS → Sitemap → HTML fallback chain.
 */
import { BaseConnector } from "../connector-base.mjs";
import { SitemapConnector } from "./sitemap-connector.mjs";
import { HtmlConnector } from "./html-connector.mjs";
import { extractRssItems, cleanText } from "../../auto-content/auto-content-utils.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { buildConditionalHeaders, filterNewFeedItems } from "../incremental-crawl.mjs";

export class WebsiteConnector extends BaseConnector {
  async discoverFeedUrl() {
    if (this.feedUrl) return this.feedUrl;
    const base = this.officialUrl.replace(/\/$/, "");
    const candidates = [`${base}/feed`, `${base}/rss`, `${base}/feed.xml`, `${base}/rss.xml`, `${base}/atom.xml`];
    for (const url of candidates) {
      try {
        const res = await this.fetchWithTimeout(url, { method: "HEAD" });
        if (res.ok) return url;
      } catch {
        /* try next */
      }
    }
    return null;
  }

  async fetchViaRss(feedUrl, syncOptions) {
    const headers = buildConditionalHeaders(syncOptions.connectorConfig || {});
    const response = await this.fetchWithTimeout(feedUrl, { headers });
    if (response.status === 304) {
      syncOptions._notModified = true;
      return [];
    }
    if (!response.ok) return [];
    const xml = await response.text();
    const rssItems = extractRssItems(xml);
    let items = rssItems.map((item, idx) => ({
      external_id: `${this.slug}:rss:${Buffer.from(item.link || item.title).toString("base64").slice(0, 32)}`,
      source_slug: this.slug,
      source_attribution: this.name,
      source_url: this.officialUrl,
      raw_url: item.link,
      raw_title: cleanText(item.title),
      raw_body: cleanText(item.description),
      raw_payload: { pubDate: item.pubDate, index: idx, strategy: "rss" },
      content_kind: normalizeContentKind(this.allowedKinds[0] || "article"),
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
    }));
    items = filterNewFeedItems(items, syncOptions.connectorConfig || {});
    syncOptions._strategy = "rss";
    return items;
  }

  async fetchItems(syncOptions = {}) {
    const feedUrl = await this.discoverFeedUrl();
    if (feedUrl) {
      const rssItems = await this.fetchViaRss(feedUrl, syncOptions);
      if (rssItems.length || syncOptions._notModified) return rssItems;
    }

    try {
      const sitemap = new SitemapConnector({
        ...this,
        connector_type: "sitemap",
        api_config: { ...this.apiConfig },
      });
      const smItems = await sitemap.fetchItems(syncOptions);
      if (smItems.length) {
        syncOptions._strategy = "sitemap";
        return smItems;
      }
    } catch {
      /* fallback html */
    }

    const html = new HtmlConnector({
      ...this,
      connector_type: "html",
      api_config: { urls: [this.officialUrl, ...(this.apiConfig.pages || [])] },
    });
    syncOptions._strategy = "html";
    return html.fetchItems(syncOptions);
  }
}
