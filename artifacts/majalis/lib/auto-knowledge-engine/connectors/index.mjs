/**
 * RSS Connector
 */

import { BaseConnector } from "../connector-base.mjs";
import { extractRssItems, cleanText } from "../../auto-content/auto-content-utils.mjs";

export class RssConnector extends BaseConnector {
  async fetchItems() {
    if (!this.feedUrl) return [];

    const response = await this.fetchWithTimeout(this.feedUrl);
    if (!response.ok) throw new Error(`RSS failed: ${response.status}`);

    const xml = await response.text();
    const rssItems = extractRssItems(xml);

    return rssItems.map((item, idx) => ({
      external_id: `${this.slug}:${Buffer.from(item.link || item.title).toString("base64").slice(0, 40)}`,
      source_slug: this.slug,
      source_attribution: this.name,
      source_url: this.officialUrl,
      raw_url: item.link,
      raw_title: item.title,
      raw_body: item.description,
      raw_payload: { pubDate: item.pubDate, index: idx },
      content_kind: this.detectKind(item.title, item.description),
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
    }));
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

  async fetchItems() {
    if (!this.manifestFile) return [];

    const { readFile } = await import("node:fs/promises");
    const { fileURLToPath } = await import("node:url");
    const path = await import("node:path");
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const manifestPath = path.resolve(dir, "../../data", this.manifestFile);

    const raw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw);
    const entries = manifest.items || manifest.decisions || manifest.entries || [];

    return entries.slice(0, 30).map((entry, idx) => ({
      external_id: `${this.slug}:${entry.id || entry.slug || idx}`,
      source_slug: this.slug,
      source_attribution: this.name,
      source_url: this.officialUrl,
      raw_url: entry.url || entry.link || entry.source_url,
      raw_title: entry.title || entry.name,
      raw_body: entry.summary || entry.body || entry.description || "",
      raw_payload: entry,
      content_kind: entry.kind || entry.type || "fiqh_decision",
      published_at: entry.date || entry.published_at || null,
    }));
  }
}

export class SeedConnector extends BaseConnector {
  async fetchItems() {
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
  switch (type) {
    case "manifest":
      return new ManifestConnector(config);
    case "seed":
      return new SeedConnector(config);
    case "rss":
      return new RssConnector(config);
    default:
      return new BaseConnector(config);
  }
}
