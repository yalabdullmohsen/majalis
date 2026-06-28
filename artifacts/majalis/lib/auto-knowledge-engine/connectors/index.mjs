/**
 * RSS Connector
 */

import { readFile } from "node:fs/promises";
import { resolveDataFilePath } from "../../data-paths.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { BaseConnector } from "../connector-base.mjs";
import { extractRssItems, cleanText } from "../../auto-content/auto-content-utils.mjs";
import {
  buildConditionalHeaders,
  filterNewFeedItems,
  buildConnectorCrawlPatch,
} from "../incremental-crawl.mjs";
import { HtmlConnector } from "./html-connector.mjs";
import { SitemapConnector } from "./sitemap-connector.mjs";
import { WebsiteConnector } from "./website-connector.mjs";
import { InstagramConnector } from "./instagram-connector.mjs";
import { YoutubeConnector } from "./youtube-connector.mjs";
import { TelegramConnector } from "./telegram-connector.mjs";
import { SocialWebConnector } from "./social-web-connector.mjs";

export class RssConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    if (!this.feedUrl) return [];

    const connectorConfig = syncOptions.connectorConfig || {};
    const headers = buildConditionalHeaders(connectorConfig);
    const response = await this.fetchWithTimeout(this.feedUrl, { headers });

    if (response.status === 304) {
      syncOptions._notModified = true;
      return [];
    }

    if (response.status === 404 || response.status === 410) {
      throw new Error(`RSS permanent: ${response.status}`);
    }
    if (!response.ok) throw new Error(`RSS failed: ${response.status}`);

    const xml = await response.text();
    const rssItems = extractRssItems(xml);

    let items = rssItems.map((item, idx) => ({
      external_id: `${this.slug}:${Buffer.from(item.link || item.title).toString("base64").slice(0, 40)}`,
      source_slug: this.slug,
      source_attribution: this.name,
      source_url: this.officialUrl,
      raw_url: item.link,
      raw_title: item.title,
      raw_body: item.description,
      raw_payload: { pubDate: item.pubDate, index: idx, canonical_url: item.link },
      content_kind: normalizeContentKind(this.detectKind(item.title, item.description)),
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
    }));

    items = filterNewFeedItems(items, connectorConfig);
    syncOptions._crawlPatch = buildConnectorCrawlPatch(response, xml, items, connectorConfig);
    return items;
  }

  detectKind(title, body) {
    const text = `${title} ${body}`;
    if (text.includes("فتوى") || text.includes("سؤال")) return "fatwa";
    if (text.includes("قرار") || text.includes("توصية")) return "fiqh_decision";
    if (text.includes("درس") || text.includes("محاضرة")) return "lesson";
    if (text.includes("فائدة")) return "fawaid";
    if (text.includes("إعجاز")) return "miracle";
    if (text.includes("كتاب")) return "book";
    if (text.includes("حديث")) return "article";
    if (text.includes("ذكر") || text.includes("أذكار")) return "article";
    return this.allowedKinds[0] || "article";
  }
}

export class ManifestConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.manifestFile = config.api_config?.manifest_file || config.manifestFile;
  }

  async fetchItems(_syncOptions = {}) {
    if (!this.manifestFile) return [];

    const manifestPath = resolveDataFilePath(this.manifestFile);
    const raw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw);
    const entries = manifest.items || manifest.decisions || manifest.entries || [];
    const maxEntries = _syncOptions?.manifestLimit || 200;

    return entries.slice(0, maxEntries).map((entry, idx) => ({
      external_id: `${this.slug}:${entry.external_id || entry.id || entry.slug || idx}`,
      source_slug: this.slug,
      source_attribution: entry.source_name || manifest.organization || this.name,
      source_url: this.officialUrl,
      raw_url: entry.url || entry.link || entry.source_url,
      raw_title: entry.title || entry.name,
      raw_body: entry.summary || entry.body || entry.description || entry.content || "",
      raw_payload: { ...entry, _manifest_file: this.manifestFile },
      content_kind: normalizeContentKind(entry.kind || entry.type, "fiqh_decision"),
      published_at: entry.session_date || entry.date || entry.published_at || null,
    }));
  }
}

export class SeedConnector extends BaseConnector {
  async fetchItems(_syncOptions = {}) {
    const { crawlSource } = await import("../../knowledge-engine/crawler.mjs");
    const source = {
      slug: this.slug,
      name: this.name,
      official_url: this.officialUrl,
      trust_level: this.trustLevel,
      allowed_kinds: this.allowedKinds,
      seed_only: true,
    };
    const { items } = await crawlSource(source, new Set());
    return items.map((item) => ({
      ...item,
      source_slug: this.slug,
      source_attribution: this.name,
    }));
  }
}

export function createConnector(config) {
  const type = config.connector_type || config.connectorType || "rss";
  const enriched = {
    ...config,
    handle: config.handle || config.api_config?.handle,
  };
  switch (type) {
    case "manifest":
      return new ManifestConnector(enriched);
    case "seed":
      return new SeedConnector(enriched);
    case "html":
      return new HtmlConnector(enriched);
    case "sitemap":
      return new SitemapConnector(enriched);
    case "website":
      return new WebsiteConnector(enriched);
    case "instagram":
      return new InstagramConnector(enriched);
    case "youtube":
      return new YoutubeConnector(enriched);
    case "telegram":
      return new TelegramConnector(enriched);
    case "x":
    case "facebook":
    case "whatsapp":
      return new SocialWebConnector(enriched);
    case "rss":
      return new RssConnector(enriched);
    default:
      return new BaseConnector(enriched);
  }
}

export { HtmlConnector, SitemapConnector, WebsiteConnector, InstagramConnector, YoutubeConnector, TelegramConnector, SocialWebConnector };
