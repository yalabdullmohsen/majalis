/**
 * Telegram AKE Connector — Bot API, public t.me/s/ preview, or OG fallback.
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { fetchTelegramChannel } from "../../cms/telegram-channel-fetch.mjs";
import { filterCurrentMonthItems } from "../v2/extraction-service.mjs";

function mapTelegramPost(post, connector, channel) {
  const text = post.text || post.caption || "";
  const messageId = post.message_id || post.id;
  const link = post.link || post.permalink || `${connector.officialUrl}/${messageId}`;

  return {
    external_id: `${connector.slug}:tg:${messageId}`,
    source_slug: connector.slug,
    source_attribution: connector.name,
    source_url: connector.officialUrl,
    raw_url: link,
    raw_title: post.title || text.slice(0, 120) || connector.name,
    raw_body: text,
    raw_payload: {
      channel,
      platform: "telegram",
      telegram_message_id: messageId,
      imageUrl: post.imageUrl || null,
      media_urls: post.mediaUrls || [],
      media_type: post.media_type || "TEXT",
      file_url: post.mediaUrls?.find((u) => u?.includes(".pdf")) || null,
      video_url: post.mediaUrls?.find((u) => /video|\.mp4/i.test(u || "")) || null,
      extracted_via: post.fromTelegramWeb ? "telegram_web_preview" : "telegram_bot_api",
      vision_on_image: connector.apiConfig.vision_on_image !== false,
    },
    source_type: post.fromTelegramWeb ? "telegram_web_preview" : "telegram_bot_api",
    content_kind: normalizeContentKind(connector.classifyMessage(text)),
    published_at: post.timestamp || post.published_at || null,
  };
}

export class TelegramConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const channel = this.apiConfig.channel || this.handle || this.officialUrl.replace(/.*t\.me\//, "").replace(/\/$/, "");
    const channelUrl = this.officialUrl.includes("t.me") ? this.officialUrl : `https://t.me/${channel}`;
    const fetchLimit = this.apiConfig.fetch_limit || syncOptions.limit || 15;

    const chainResult = await fetchTelegramChannel({
      channel,
      bot_token: this.apiConfig.bot_token,
      channel_id: this.apiConfig.channel_id,
      rss_url: this.apiConfig.rss_url || this.feedUrl,
      official_url: channelUrl,
      limit: fetchLimit,
    }).catch((err) => ({
      ok: false,
      posts: [],
      method: "error",
      errors: [err.message],
    }));

    syncOptions._telegramStatus = {
      method: chainResult.method,
      ok: chainResult.ok,
      errors: chainResult.errors || [],
    };

    if (chainResult.posts?.length) {
      let items = chainResult.posts.map((post) => {
        const mapped = mapTelegramPost({
          message_id: post.message_id || post.external_id,
          id: post.message_id,
          text: post.text,
          title: post.title,
          link: post.url,
          permalink: post.url,
          imageUrl: post.media?.[0]?.url || null,
          mediaUrls: (post.media || []).map((m) => m.url).filter(Boolean),
          media_type: post.media?.[0]?.type === "image" ? "IMAGE" : "TEXT",
          timestamp: post.published_at,
          fromTelegramWeb: post.extracted_via === "telegram_preview",
        }, this, channel);
        mapped.raw_payload = {
          ...mapped.raw_payload,
          extracted_via: post.extracted_via || chainResult.method,
        };
        return mapped;
      });

      if (!this.apiConfig.skip_month_filter) {
        items = filterCurrentMonthItems(items);
      }
      return items;
    }

    if (this.apiConfig.bot_token && this.apiConfig.channel_id) {
      try {
        const botItems = await this.fetchViaBotApi(syncOptions);
        if (botItems.length) return botItems;
      } catch (err) {
        syncOptions._fetchStatus = `telegram_bot_api_failed: ${err.message}`;
      }
    }

    syncOptions._fetchStatus = (chainResult.errors || []).join("; ") || "telegram_all_methods_empty";
    return [];
  }

  classifyMessage(text) {
    if (/دورة|course/i.test(text)) return "course";
    if (/إعلان|announcement/i.test(text)) return "announcement";
    if (/درس|lesson|محاضرة/i.test(text)) return "lesson";
    return "announcement";
  }

  async fetchViaBotApi(syncOptions) {
    const token = this.apiConfig.bot_token;
    const channelId = this.apiConfig.channel_id;
    const url = `https://api.telegram.org/bot${token}/getUpdates?limit=${syncOptions.limit || 10}`;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) return [];
    const data = await res.json();
    const updates = (data.result || []).filter((u) => u.channel_post?.chat?.id === channelId);
    const channel = this.apiConfig.channel || this.handle || "channel";

    return updates.map((u) => {
      const post = u.channel_post;
      const text = post.text || post.caption || "";
      const photo = post.photo?.[post.photo.length - 1];
      return mapTelegramPost({
        message_id: post.message_id,
        text,
        link: `${this.officialUrl}/${post.message_id}`,
        imageUrl: photo ? `https://api.telegram.org/file/bot${token}/${photo.file_id}` : null,
        mediaUrls: [],
        media_type: photo ? "IMAGE" : "TEXT",
        timestamp: new Date(post.date * 1000).toISOString(),
      }, this, channel);
    });
  }
}
