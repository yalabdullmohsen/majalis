/**
 * Telegram AKE Connector — resilient multi-strategy fetch (Bot API → Preview → RSS → OG).
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { fetchTelegramChannel } from "../../cms/telegram-channel-fetch.mjs";

export class TelegramConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const channel = this.apiConfig.channel || this.handle || this.officialUrl.replace(/.*t\.me\//, "").replace(/^@/, "");
    const result = await fetchTelegramChannel({
      channel,
      bot_token: this.apiConfig.bot_token,
      channel_id: this.apiConfig.channel_id,
      rss_url: this.apiConfig.rss_url || this.apiConfig.feed_url,
      official_url: this.officialUrl,
      limit: syncOptions.limit || 20,
    });

    if (!result.ok && !result.posts?.length) {
      throw new Error(`Telegram fetch failed: ${(result.errors || []).join("; ") || "no posts"}`);
    }

    return result.posts.map((post) => ({
      external_id: `${this.slug}:tg:${post.external_id || post.message_id}`,
      source_slug: this.slug,
      source_attribution: this.name,
      source_url: post.url || this.officialUrl,
      raw_url: post.url || this.officialUrl,
      raw_title: (post.text || post.title || "").slice(0, 120),
      raw_body: post.text || post.title || "",
      raw_payload: {
        channel,
        platform: "telegram",
        extracted_via: post.extracted_via || result.method,
        telegram_message_id: post.message_id,
        media: post.media || [],
        hashtags: post.hashtags || [],
        links: post.links || [],
        imageUrl: post.media?.find((m) => m.type === "image")?.url || null,
        ...(post.raw_payload || {}),
      },
      source_type: post.extracted_via || result.method,
      content_kind: normalizeContentKind("announcement"),
      published_at: post.published_at || null,
    }));
  }
}
