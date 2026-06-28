/**
 * JSON/XML API connector — configurable endpoints.
 */

import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { enrichItemClassification } from "../autonomous/content-router.mjs";

export class ApiConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const apiUrl = this.apiConfig.url || this.apiConfig.endpoint || this.feedUrl;
    if (!apiUrl) throw new Error("API connector missing url in api_config");

    const response = await this.fetchWithTimeout(apiUrl, {
      headers: this.apiConfig.headers || {},
    });
    if (!response.ok) throw new Error(`API failed: ${response.status}`);

    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();
    let entries = [];

    if (contentType.includes("json") || raw.trim().startsWith("{") || raw.trim().startsWith("[")) {
      const data = JSON.parse(raw);
      entries = data.items || data.results || data.data || data.entries || (Array.isArray(data) ? data : []);
    } else {
      const { extractRssItems } = await import("../../auto-content/auto-content-utils.mjs");
      entries = extractRssItems(raw);
    }

    const titleField = this.apiConfig.title_field || "title";
    const bodyField = this.apiConfig.body_field || this.apiConfig.description_field || "description";
    const urlField = this.apiConfig.url_field || "url";
    const idField = this.apiConfig.id_field || "id";
    const maxItems = syncOptions.limit || syncOptions.maxItems || 30;

    return entries.slice(0, maxItems).map((entry, idx) => enrichItemClassification({
      external_id: `${this.slug}:${entry[idField] || entry.slug || idx}`,
      source_slug: this.slug,
      source_attribution: entry.source_name || this.name,
      source_url: this.officialUrl,
      raw_url: entry[urlField] || entry.link || entry.source_url,
      raw_title: entry[titleField] || entry.name,
      raw_body: entry[bodyField] || entry.content || entry.summary || "",
      raw_payload: entry,
      content_kind: normalizeContentKind(entry.kind || entry.type || this.allowedKinds[0]),
      published_at: entry.published_at || entry.date || entry.pubDate || null,
    }, this));
  }
}
