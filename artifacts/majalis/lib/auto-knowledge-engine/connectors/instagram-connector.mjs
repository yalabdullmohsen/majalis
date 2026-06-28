/**
 * Instagram AKE Connector — professional engine with full metadata extraction.
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { discoverInstagramSource } from "../../cms/instagram-connector.mjs";
import { filterCurrentMonthItems } from "../v2/extraction-service.mjs";
import { enrichInstagramPost, toAkeItem } from "../../production/instagram-engine.mjs";

export class InstagramConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const handle = this.handle || this.apiConfig.handle;
    const source = {
      id: this.id,
      name: this.name,
      url: this.officialUrl,
      source_name: this.name,
      source_url: this.officialUrl,
      source_type: "instagram",
      platform: "instagram",
      config: { ...this.apiConfig, handle },
      trust_score: this.trustLevel * 20,
    };

    const discovery = await discoverInstagramSource(source);
    if (discovery.connectorRequired || !discovery.items?.length) {
      const graphConfigured = discovery.graphApi === true || discovery.graphApiAttempted;
      const hint = discovery.hint
        || (discovery.connectorRequired
          ? "Instagram Graph API not configured; public fallback active/limited"
          : "Instagram fetch unavailable: credentials required or public access blocked");
      syncOptions._fetchStatus = hint;
      syncOptions._instagramStatus = {
        graphApi: graphConfigured,
        itemsReturned: discovery.items?.length || 0,
        hint,
      };
      return [];
    }

    const connectorMeta = { slug: this.slug, name: this.name };
    const enrichedItems = [];

    for (const post of discovery.items.slice(0, syncOptions.limit || 10)) {
      try {
        const enriched = await enrichInstagramPost(post, {
          handle,
          sourceId: this.id,
          sourceName: this.name,
        });
        const akeItem = toAkeItem(enriched, connectorMeta);
        akeItem.content_kind = normalizeContentKind(this.classifyPost(enriched));
        enrichedItems.push(akeItem);
      } catch {
        enrichedItems.push({
          external_id: `${this.slug}:ig:${post.id || post.link}`,
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
            media_type: post.media_type || post.mediaType,
            extracted_via: discovery.graphApi ? "instagram_graph_api" : "og_tags",
          },
          content_kind: normalizeContentKind(this.classifyPost(post)),
          published_at: post.timestamp || post.published_at || null,
        });
      }
    }

    return filterCurrentMonthItems(enrichedItems);
  }

  classifyPost(post) {
    const text = `${post.title || ""} ${post.description || ""} ${post.caption || ""}`;
    if (/دورة|course/i.test(text) || post.is_course_ad) return "course";
    if (/إعلان|announcement/i.test(text)) return "announcement";
    if (/فائدة/i.test(text)) return "fawaid";
    if (/تنبيه|alert/i.test(text)) return "announcement";
    if (/درس|lesson|محاضرة/i.test(text) || post.is_lesson_ad) return "lesson";
    return "lesson";
  }
}
