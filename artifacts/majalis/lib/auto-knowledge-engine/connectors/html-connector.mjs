/**
 * HTML page connector — crawl listing pages and extract article links.
 */

import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { enrichItemClassification } from "../autonomous/content-router.mjs";

function extractLinks(html, baseUrl) {
  const links = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
    try {
      const url = new URL(href, baseUrl).href;
      if (text.length >= 8) links.push({ url, title: text.slice(0, 300) });
    } catch {
      /* skip invalid */
    }
  }
  return links;
}

export class HtmlConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const startUrl = this.apiConfig.start_url || this.apiConfig.startUrl || this.officialUrl;
    if (!startUrl) return [];

    const response = await this.fetchWithTimeout(startUrl);
    if (!response.ok) throw new Error(`HTML fetch failed: ${response.status}`);

    const html = await response.text();
    const selector = this.apiConfig.link_selector || this.apiConfig.linkSelector;
    let links = extractLinks(html, startUrl);

    if (selector) {
      links = links.filter((l) => l.url.includes(selector) || l.title.length > 10);
    }

    const maxItems = syncOptions.limit || syncOptions.maxItems || 20;
    const items = [];

    for (const link of links.slice(0, maxItems)) {
      try {
        const pageRes = await this.fetchWithTimeout(link.url);
        if (!pageRes.ok) continue;
        const pageHtml = await pageRes.text();
        const bodyMatch = pageHtml.match(/<article[\s\S]*?<\/article>/i) ||
          pageHtml.match(/<main[\s\S]*?<\/main>/i) ||
          pageHtml.match(/<body[\s\S]*?<\/body>/i);
        const body = (bodyMatch?.[0] || pageHtml).replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 8000);

        items.push(enrichItemClassification({
          external_id: `${this.slug}:${Buffer.from(link.url).toString("base64").slice(0, 40)}`,
          source_slug: this.slug,
          source_attribution: this.name,
          source_url: this.officialUrl,
          raw_url: link.url,
          raw_title: link.title,
          raw_body: body,
          raw_payload: { html: true, canonical_url: link.url },
          content_kind: normalizeContentKind(this.allowedKinds[0] || "article"),
        }, this));
      } catch {
        /* skip page */
      }
    }

    return items;
  }
}
