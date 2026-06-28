/**
 * Public Telegram channel fetch — t.me/s/{channel} web preview (no Bot API required).
 * Also exposes fetchTelegramChannel fallback chain for connectors that need it.
 */
import { fetchResource } from "../http/fetch-layer.mjs";
import { importFromUrl } from "./url-importer.mjs";

function decodeHtml(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractBackgroundUrl(style) {
  const m = String(style || "").match(/background-image:\s*url\(['"]?([^'")]+)/i);
  return m ? m[1].replace(/\\"/g, '"') : null;
}

/**
 * Parse public channel HTML from https://t.me/s/{channel}
 */
export function parseTelegramChannelHtml(html, channel) {
  const items = [];
  const postRe = /data-post="([^"]+)"/g;
  let match;

  while ((match = postRe.exec(html)) !== null) {
    const postRef = match[1];
    const postId = postRef.split("/").pop();
    if (!postId) continue;

    const start = Math.max(0, match.index - 200);
    const end = Math.min(html.length, match.index + 4000);
    const chunk = html.slice(start, end);

    const textMatch = chunk.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const text = decodeHtml(textMatch?.[1] || "");

    const timeMatch = chunk.match(/<time[^>]+datetime="([^"]+)"/i);
    const publishedAt = timeMatch?.[1] || null;

    const photoStyle = chunk.match(/class="tgme_widget_message_photo[^"]*"[^>]*style="([^"]+)"/i);
    const imageUrl = extractBackgroundUrl(photoStyle?.[1]);

    const videoMatch = chunk.match(/class="tgme_widget_message_video[^"]*"[\s\S]*?href="([^"]+)"/i);
    const videoUrl = videoMatch?.[1] || null;

    const docMatch = chunk.match(/class="tgme_widget_message_document[^"]*"[\s\S]*?href="([^"]+)"/i);
    const fileUrl = docMatch?.[1] || null;

    const link = `https://t.me/${channel}/${postId}`;

    items.push({
      id: postId,
      message_id: Number(postId) || postId,
      channel,
      text,
      caption: text,
      title: text.slice(0, 120) || `رسالة ${postId}`,
      description: text,
      link,
      permalink: link,
      imageUrl: imageUrl || null,
      mediaUrls: [imageUrl, videoUrl, fileUrl].filter(Boolean),
      media_type: videoUrl ? "VIDEO" : imageUrl ? "IMAGE" : fileUrl ? "DOCUMENT" : "TEXT",
      timestamp: publishedAt,
      published_at: publishedAt,
      fromTelegramWeb: true,
    });
  }

  const seen = new Set();
  return items
    .filter((item) => {
      const key = String(item.message_id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(b.message_id) - Number(a.message_id));
}

export async function fetchTelegramChannelMessages(channel, { limit = 20, before } = {}) {
  const slug = String(channel || "").replace(/^@/, "").replace(/.*t\.me\//, "");
  if (!slug) return { items: [], channel: null, error: "channel_missing" };

  let url = `https://t.me/s/${slug}`;
  if (before) url += `?before=${before}`;

  const res = await fetchResource(url, {
    label: `telegram:web:${slug}`,
    timeoutMs: 20_000,
    maxRetries: 2,
    useCache: false,
    headers: {
      "User-Agent": "MajlisIlmBot/2.0 (+https://www.majlisilm.com)",
      Accept: "text/html",
    },
  });

  const html = await res.text();
  if (!res.ok) {
    return { items: [], channel: slug, error: `http_${res.status}` };
  }

  let items = parseTelegramChannelHtml(html, slug);
  if (limit > 0) items = items.slice(0, limit);

  return { items, channel: slug, ok: true };
}

/** Alias used by verification scripts — delegates to web preview fetch. */
export const parseTelegramPreviewHtml = parseTelegramChannelHtml;

/**
 * Resilient fallback chain: Bot API → preview → RSS → OpenGraph.
 */
export async function fetchTelegramChannel(config = {}) {
  const channel = String(config.channel || config.handle || "").replace(/^@/, "").replace(/.*t\.me\//, "");
  const errors = [];

  if (config.bot_token && config.channel_id) {
    try {
      const url = `https://api.telegram.org/bot${config.bot_token}/getUpdates?limit=${Math.min(config.limit || 20, 100)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (data.ok) {
        const posts = (data.result || [])
          .filter((u) => u.channel_post?.chat?.id === config.channel_id)
          .map((u) => {
            const post = u.channel_post;
            const text = post.text || post.caption || "";
            return {
              external_id: `tg:${channel}:${post.message_id}`,
              message_id: post.message_id,
              text,
              url: `https://t.me/${channel}/${post.message_id}`,
              published_at: new Date(post.date * 1000).toISOString(),
              extracted_via: "telegram_bot_api",
            };
          });
        if (posts.length) return { ok: true, posts, method: "bot_api" };
      }
    } catch (err) {
      errors.push(`bot_api: ${err.message}`);
    }
  }

  try {
    const result = await fetchTelegramChannelMessages(channel, { limit: config.limit || 20 });
    if (result.items?.length) {
      const posts = result.items.map((item) => ({
        external_id: `${channel}:${item.message_id}`,
        message_id: item.message_id,
        text: item.text,
        url: item.link,
        published_at: item.published_at,
        extracted_via: "telegram_preview",
        media: item.mediaUrls?.map((url) => ({ type: "image", url })) || [],
      }));
      return { ok: true, posts, method: "preview", errors };
    }
    errors.push(`preview: ${result.error || "empty"}`);
  } catch (err) {
    errors.push(`preview: ${err.message}`);
  }

  if (config.rss_url) {
    try {
      const page = await importFromUrl(config.rss_url);
      if (page?.description) {
        return {
          ok: true,
          posts: [{ external_id: `rss:${config.rss_url}`, text: page.description, url: page.finalUrl, extracted_via: "telegram_rss" }],
          method: "rss",
          errors,
        };
      }
    } catch (err) {
      errors.push(`rss: ${err.message}`);
    }
  }

  const ogUrl = config.official_url || (channel ? `https://t.me/${channel}` : null);
  if (ogUrl) {
    try {
      const page = await importFromUrl(ogUrl);
      if (page?.title || page?.description) {
        return {
          ok: true,
          posts: [{ external_id: `og:${channel}`, text: page.description || page.title, title: page.title, url: page.finalUrl || ogUrl, extracted_via: "opengraph" }],
          method: "opengraph",
          errors,
        };
      }
    } catch (err) {
      errors.push(`opengraph: ${err.message}`);
    }
  }

  return { ok: false, posts: [], method: "none", errors };
}
