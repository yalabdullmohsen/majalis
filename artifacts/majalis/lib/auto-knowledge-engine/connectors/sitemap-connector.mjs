/**
 * Sitemap connector — discover URLs from sitemap.xml.
 */

import { BaseConnector } from "../connector-base.mjs";
import { HtmlConnector } from "./html-connector.mjs";

function parseSitemapUrls(xml, limit = 50) {
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/gi;
  let m;
  while ((m = re.exec(xml)) !== null && urls.length < limit) {
    urls.push(m[1].trim());
  }
  return urls;
}

export class SitemapConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const sitemapUrl = this.apiConfig.sitemap_url || this.apiConfig.sitemapUrl || this.sitemap_url || `${this.officialUrl?.replace(/\/$/, "")}/sitemap.xml`;
    if (!sitemapUrl) return [];

    const response = await this.fetchWithTimeout(sitemapUrl);
    if (!response.ok) throw new Error(`Sitemap failed: ${response.status}`);

    const xml = await response.text();
    const urlFilter = this.apiConfig.url_filter || this.apiConfig.urlFilter;
    let urls = parseSitemapUrls(xml, syncOptions.limit || 40);
    if (urlFilter) urls = urls.filter((u) => u.includes(urlFilter));

    const htmlConnector = new HtmlConnector({
      ...this,
      connector_type: "html",
      api_config: { start_url: urls[0], link_selector: urlFilter },
    });

    const items = [];
    const maxPages = Math.min(urls.length, syncOptions.maxItems || 15);
    for (let i = 0; i < maxPages; i++) {
      try {
        const pageRes = await this.fetchWithTimeout(urls[i]);
        if (!pageRes.ok) continue;
        const html = await pageRes.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const body = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 6000);
        if (body.length < 40) continue;
        items.push({
          external_id: `${this.slug}:${Buffer.from(urls[i]).toString("base64").slice(0, 40)}`,
          source_slug: this.slug,
          source_attribution: this.name,
          source_url: this.officialUrl,
          raw_url: urls[i],
          raw_title: titleMatch?.[1]?.trim() || urls[i].split("/").pop(),
          raw_body: body,
          raw_payload: { sitemap: true, canonical_url: urls[i] },
          content_kind: this.allowedKinds[0] || "article",
        });
      } catch {
        /* skip */
      }
    }

    const { enrichItemClassification } = await import("../autonomous/content-router.mjs");
    return items.map((item) => enrichItemClassification(item, this));
  }
}
