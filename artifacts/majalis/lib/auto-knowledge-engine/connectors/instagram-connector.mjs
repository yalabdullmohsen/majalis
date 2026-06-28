/**
 * Instagram AKE Connector — plugin wrapper around Phase 7 Graph API + OG fallback.
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { discoverInstagramSource } from "../../cms/instagram-connector.mjs";
import { filterCurrentMonthItems } from "../v2/extraction-service.mjs";

export class InstagramConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const handle = this.handle || this.apiConfig.handle;
    const source = {
      id: this.id,
      source_name: this.name,
      source_url: this.officialUrl,
      source_type: "instagram",
      platform: "instagram",
      config: { ...this.apiConfig, handle },
      trust_score: this.trustLevel * 20,
    };

    const discovery = await discoverInstagramSource(source);
    if (discovery.connectorRequired || !discovery.items?.length) {
      if (discovery.hint) syncOptions._hint = discovery.hint;
      return [];
    }

    let items = discovery.items.map((post, idx) => ({
      external_id: `${this.slug}:ig:${post.id || post.link || idx}`,
      source_slug: this.slug,
      source_attribution: this.name,
      source_url: this.officialUrl,
      raw_url: post.link || post.permalink || this.officialUrl,
      raw_title: post.title || post.caption?.slice(0, 120) || this.name,
      raw_body: post.description || post.caption || "",
      raw_payload: {
        handle,
        imageUrl: post.imageUrl || post.media_url,
        media_url: post.media_url,
        timestamp: post.timestamp || post.published_at,
        instagram_id: post.id,
        media_type: post.media_type,
        extracted_via: discovery.graphApi ? "instagram_graph_api" : "og_tags",
      },
      content_kind: normalizeContentKind(this.classifyPost(post)),
      published_at: post.timestamp || post.published_at || null,
    }));

    items = filterCurrentMonthItems(items);
    return items.slice(0, syncOptions.limit || 10);
  }

  classifyPost(post) {
    const text = `${post.title || ""} ${post.description || ""} ${post.caption || ""}`;
    if (/دورة|course/i.test(text)) return "course";
    if (/إعلان|announcement/i.test(text)) return "announcement";
    if (/فائدة/i.test(text)) return "fawaid";
    if (/تنبيه|alert/i.test(text)) return "announcement";
    if (/درس|lesson|محاضرة/i.test(text)) return "lesson";
    return "lesson";
  }
}
