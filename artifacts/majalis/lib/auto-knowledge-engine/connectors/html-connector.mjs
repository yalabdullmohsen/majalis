/**
 * HTML Parser Connector — scrape pages when no RSS available.
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { importFromUrl } from "../../cms/url-importer.mjs";
import { cleanText } from "../../auto-content/auto-content-utils.mjs";

export class HtmlConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const urls = this.apiConfig.urls || this.apiConfig.pages || [this.officialUrl];
    const limit = syncOptions.limit || syncOptions.maxItems || 10;
    const items = [];

    for (const url of urls.slice(0, limit)) {
      try {
        const page = await importFromUrl(url);
        if (!page?.title && !page?.description) continue;

        items.push({
          external_id: `${this.slug}:html:${Buffer.from(url).toString("base64url").slice(0, 32)}`,
          source_slug: this.slug,
          source_attribution: this.name,
          source_url: this.officialUrl,
          raw_url: page.finalUrl || url,
          raw_title: cleanText(page.title || ""),
          raw_body: cleanText(page.description || page.rawText || ""),
          raw_payload: {
            imageUrl: page.imageUrl,
            platform: page.platform,
            extracted_via: "html_parser",
          },
          content_kind: normalizeContentKind(this.detectKind(page.title, page.description)),
          published_at: null,
        });
      } catch {
        /* skip broken page */
      }
    }

    return items;
  }

  detectKind(title, body) {
    const text = `${title} ${body}`;
    if (/درس|محاضرة|دورة/i.test(text)) return "lesson";
    if (/فتوى|سؤال/i.test(text)) return "fatwa";
    if (/إعلان/i.test(text)) return "announcement";
    return this.allowedKinds[0] || "article";
  }
}
