/**
 * Social Web Connector — X, Facebook, WhatsApp via OG metadata.
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { importFromUrl } from "../../cms/url-importer.mjs";

export class SocialWebConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const url = this.officialUrl;
    const page = await importFromUrl(url);
    if (!page?.title && !page?.description && !page?.imageUrl) {
      return [];
    }

    return [{
      external_id: `${this.slug}:${this.connectorType}:${Buffer.from(url).toString("base64url").slice(0, 24)}`,
      source_slug: this.slug,
      source_attribution: this.name,
      source_url: url,
      raw_url: page.finalUrl || url,
      raw_title: page.title || this.name,
      raw_body: page.description || "",
      raw_payload: {
        platform: this.connectorType,
        imageUrl: page.imageUrl,
        extracted_via: "og_tags",
      },
      content_kind: normalizeContentKind("announcement"),
      published_at: null,
    }];
  }
}
