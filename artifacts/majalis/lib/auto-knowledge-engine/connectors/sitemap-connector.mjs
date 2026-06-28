/**
 * Sitemap Connector — discover URLs from sitemap.xml
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { importFromUrl } from "../../cms/url-importer.mjs";
import { cleanText } from "../../auto-content/auto-content-utils.mjs";

function parseSitemapUrls(xml) {
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1].trim());
  }
  return urls;
}

export class SitemapConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const sitemapUrl = this.apiConfig.sitemap_url || `${this.officialUrl.replace(/\/$/, "")}/sitemap.xml`;
    const limit = syncOptions.limit || 15;

    const response = await this.fetchWithTimeout(sitemapUrl);
    if (!response.ok) throw new Error(`Sitemap failed: ${response.status}`);

    const xml = await response.text();
    const urls = parseSitemapUrls(xml)
      .filter((u) => !/\.(jpg|png|pdf|zip)$/i.test(u))
      .slice(0, limit * 2);

    const items = [];
    for (const url of urls.slice(0, limit)) {
      try {
        const page = await importFromUrl(url);
        if (!page?.title) continue;
        items.push({
          external_id: `${this.slug}:sm:${Buffer.from(url).toString("base64url").slice(0, 28)}`,
          source_slug: this.slug,
          source_attribution: this.name,
          source_url: this.officialUrl,
          raw_url: page.finalUrl || url,
          raw_title: cleanText(page.title),
          raw_body: cleanText(page.description || ""),
          raw_payload: { sitemap: true, imageUrl: page.imageUrl },
          content_kind: normalizeContentKind("article"),
          published_at: null,
        });
      } catch {
        /* skip */
      }
    }
    return items;
  }
}
