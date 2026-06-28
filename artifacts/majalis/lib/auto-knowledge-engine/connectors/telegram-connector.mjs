/**
 * Telegram AKE Connector — Bot API, public t.me/s/ preview, or OG fallback.
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { importFromUrl } from "../../cms/url-importer.mjs";
import { fetchTelegramChannelMessages } from "../../cms/telegram-channel-fetch.mjs";
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

    if (this.apiConfig.bot_token && this.apiConfig.channel_id) {
      return this.fetchViaBotApi(syncOptions);
    }

    if (this.apiConfig.public_web_preview !== false) {
      try {
        const result = await fetchTelegramChannelMessages(channel, { limit: fetchLimit });
        if (result.items?.length) {
          let items = result.items.map((post) => mapTelegramPost(post, this, channel));
          if (!this.apiConfig.skip_month_filter) {
            items = filterCurrentMonthItems(items);
          }
          syncOptions._telegramStatus = { mode: "web_preview", count: items.length };
          return items;
        }
        syncOptions._fetchStatus = result.error || "telegram_web_preview_empty";
      } catch (err) {
        syncOptions._fetchStatus = `telegram_web_preview_failed: ${err.message}`;
      }
    }

    try {
      const page = await importFromUrl(channelUrl);
      if (!page?.title && !page?.description) return [];

      return [mapTelegramPost({
        id: channel,
        message_id: channel,
        text: page.description || page.title,
        title: page.title,
        link: page.finalUrl || channelUrl,
        imageUrl: page.imageUrl,
        mediaUrls: page.imageUrl ? [page.imageUrl] : [],
        media_type: page.imageUrl ? "IMAGE" : "TEXT",
        timestamp: null,
      }, this, channel)];
    } catch (err) {
      syncOptions._fetchStatus = `telegram_og_fallback_failed: ${err.message}`;
      return [];
    }
  }

  classifyMessage(text) {
    if (/حلقة|حفظ|تجويد|مراجعة|إجازة/i.test(text)) return "quran_circle";
    if (/متن|ألفية|آجرومية|نخبة/i.test(text)) return "mutoon";
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
    if (!res.ok) throw new Error(`Telegram API: ${res.status}`);
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
