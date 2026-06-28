/**
 * Telegram AKE Connector — public channel preview via OG (Bot API optional in api_config).
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { importFromUrl } from "../../cms/url-importer.mjs";

export class TelegramConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const channel = this.apiConfig.channel || this.handle || this.officialUrl.replace(/.*t\.me\//, "");
    const channelUrl = this.officialUrl.includes("t.me") ? this.officialUrl : `https://t.me/${channel}`;

    if (this.apiConfig.bot_token && this.apiConfig.channel_id) {
      return this.fetchViaBotApi(syncOptions);
    }

    try {
      const page = await importFromUrl(channelUrl);
      if (!page?.title && !page?.description) return [];

      return [{
        external_id: `${this.slug}:tg:${channel}`,
        source_slug: this.slug,
        source_attribution: this.name,
        source_url: channelUrl,
        raw_url: page.finalUrl || channelUrl,
        raw_title: page.title || this.name,
        raw_body: page.description || "",
        raw_payload: { channel, platform: "telegram", extracted_via: "og_preview" },
        content_kind: normalizeContentKind("announcement"),
        published_at: null,
      }];
    } catch (err) {
      throw new Error(`Telegram fetch failed: ${err.message}`);
    }
  }

  async fetchViaBotApi(syncOptions) {
    const token = this.apiConfig.bot_token;
    const channelId = this.apiConfig.channel_id;
    const url = `https://api.telegram.org/bot${token}/getUpdates?limit=${syncOptions.limit || 10}`;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Telegram API: ${res.status}`);
    const data = await res.json();
    const updates = (data.result || []).filter((u) => u.channel_post?.chat?.id === channelId);

    return updates.map((u, idx) => {
      const post = u.channel_post;
      const text = post.text || post.caption || "";
      return {
        external_id: `${this.slug}:tg:${post.message_id}`,
        source_slug: this.slug,
        source_attribution: this.name,
        source_url: this.officialUrl,
        raw_url: `${this.officialUrl}/${post.message_id}`,
        raw_title: text.slice(0, 120),
        raw_body: text,
        raw_payload: { telegram_message_id: post.message_id, platform: "telegram" },
        content_kind: normalizeContentKind("announcement"),
        published_at: new Date(post.date * 1000).toISOString(),
      };
    });
  }
}
