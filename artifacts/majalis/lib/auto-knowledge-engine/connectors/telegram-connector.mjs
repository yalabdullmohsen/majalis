/**
 * Telegram AKE Connector — Bot API, public t.me/s/ preview, or OG fallback.
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { fetchTelegramChannel, fetchTelegramChannelMessages } from "../../cms/telegram-channel-fetch.mjs";
import { filterCurrentMonthItems } from "../v2/extraction-service.mjs";
import { enqueueReview } from "../../content-engines/review-queue.mjs";

function mapTelegramPost(post, connector, channel) {
  const text = post.text || post.caption || "";
  const messageId = post.message_id || post.id;
  const link = post.link || post.url || post.permalink || `${connector.officialUrl}/${messageId}`;
  const confidence = post.confidence ?? (text.length >= 15 ? 0.8 : 0.4);

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
      media_urls: post.mediaUrls || post.media?.map((m) => m.url) || [],
      media_type: post.media_type || "TEXT",
      extracted_via: post.extracted_via || "telegram_web_preview",
      confidence,
      vision_on_image: connector.apiConfig.vision_on_image !== false,
    },
    source_type: post.extracted_via || "telegram_web_preview",
    content_kind: normalizeContentKind(connector.classifyMessage(text)),
    published_at: post.timestamp || post.published_at || null,
    _confidence: confidence,
  };
}

export class TelegramConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const channel = this.apiConfig.channel || this.handle || this.officialUrl.replace(/.*t\.me\//, "").replace(/\/$/, "");
    const fetchLimit = this.apiConfig.fetch_limit || syncOptions.limit || 15;
    const minConfidence = this.apiConfig.min_confidence ?? 0.45;

    if (this.apiConfig.public_web_preview !== false) {
      try {
        const result = await fetchTelegramChannelMessages(channel, { limit: fetchLimit });
        if (result.items?.length) {
          let items = result.items
            .map((post) => mapTelegramPost(post, this, channel))
            .filter((item) => (item._confidence ?? 0) >= minConfidence);
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

    const chain = await fetchTelegramChannel({
      channel,
      handle: channel,
      bot_token: this.apiConfig.bot_token,
      channel_id: this.apiConfig.channel_id,
      rss_url: this.apiConfig.rss_url,
      official_url: this.officialUrl,
      limit: fetchLimit,
      min_confidence: minConfidence,
    });

    syncOptions._telegramChain = chain;

    if (!chain.ok || !chain.posts?.length) {
      syncOptions._fetchStatus = chain.errors?.join("; ") || syncOptions._fetchStatus || "telegram_fetch_empty";
      return [];
    }

    let items = chain.posts.map((post) => mapTelegramPost(post, this, channel));

    for (const item of items) {
      if ((item._confidence ?? 0) < minConfidence) {
        await enqueueReview({
          engineId: "telegram-connector",
          item: { title: item.raw_title, body: item.raw_body, url: item.raw_url },
          reason: "low_quality",
          reasonDetail: `telegram low confidence ${item._confidence}`,
          sourceType: "telegram",
        }).catch(() => {});
      }
    }

    items = items.filter((item) => (item._confidence ?? 0) >= minConfidence);

    if (!this.apiConfig.skip_month_filter) {
      items = filterCurrentMonthItems(items);
    }

    syncOptions._telegramStatus = { mode: chain.method, count: items.length };
    return items;
  }

  classifyMessage(text) {
    if (/دورة|course/i.test(text)) return "course";
    if (/إعلان|announcement/i.test(text)) return "announcement";
    if (/درس|lesson|محاضرة/i.test(text)) return "lesson";
    return "announcement";
  }

  async fetchViaBotApi(syncOptions) {
    try {
      const channel = this.apiConfig.channel || this.handle || "channel";
      const chain = await fetchTelegramChannel({
        channel,
        bot_token: this.apiConfig.bot_token,
        channel_id: this.apiConfig.channel_id,
        limit: syncOptions.limit || 10,
      });
      return (chain.posts || []).map((post) => mapTelegramPost(post, this, channel));
    } catch {
      return [];
    }
  }
}
