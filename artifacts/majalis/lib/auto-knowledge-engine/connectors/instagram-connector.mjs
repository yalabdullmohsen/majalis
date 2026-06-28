/**
 * Instagram AKE Connector — plugin wrapper around Phase 7 Graph API + OG fallback.
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { discoverInstagramSource } from "../../cms/instagram-connector.mjs";
import { filterCurrentMonthItems } from "../v2/extraction-service.mjs";

function extractHashtags(text) {
  return [...new Set(String(text || "").match(/#[\u0600-\u06FF\w]+/g) || [])];
}

function mapPostToItem(post, connector, handle, discovery) {
  const caption = post.description || post.caption || "";
  const externalId = post.externalId || post.id || post.link;
  const mediaType = post.mediaType || post.media_type || "IMAGE";
  const isReel = mediaType === "VIDEO" && /\/reel\//i.test(post.link || post.permalink || "");

  return {
    external_id: `${connector.slug}:ig:${externalId}`,
    source_slug: connector.slug,
    source_attribution: connector.name,
    source_url: connector.officialUrl,
    raw_url: post.link || post.permalink || connector.officialUrl,
    raw_title: post.title || caption.slice(0, 120) || connector.name,
    raw_body: caption,
    raw_payload: {
      handle,
      imageUrl: post.imageUrl || post.media_url,
      media_url: post.mediaUrl || post.media_url,
      media_urls: post.mediaUrls || [],
      timestamp: post.timestamp || post.published_at,
      instagram_id: post.externalId || post.id,
      media_type: isReel ? "REELS" : mediaType,
      permalink: post.permalink || post.link,
      hashtags: extractHashtags(caption),
      carousel_count: post.mediaUrls?.length || 1,
      extracted_via: discovery.graphApi ? "instagram_graph_api" : "og_tags",
      vision_on_image: connector.apiConfig.vision_on_image !== false,
    },
    content_kind: normalizeContentKind(connector.classifyPost(post)),
    published_at: post.timestamp || post.published_at || null,
  };
}

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

    const fetchLimit = this.apiConfig.fetch_limit || syncOptions.limit || 15;

    const discovery = await discoverInstagramSource(source, { limit: fetchLimit });
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

    let items = discovery.items.map((post) => mapPostToItem(post, this, handle, discovery));

    const skipMonthFilter = this.apiConfig.skip_month_filter === true;
    if (!skipMonthFilter) {
      items = filterCurrentMonthItems(items);
    }

    const lastSeen = this.apiConfig.last_seen_id || syncOptions.lastCursor;
    if (lastSeen) {
      const idx = items.findIndex((i) => i.raw_payload?.instagram_id === lastSeen);
      if (idx > 0) items = items.slice(0, idx);
      else if (idx === -1 && items.length) {
        /* all new since last seen */
      }
    }

    return items.slice(0, fetchLimit);
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
