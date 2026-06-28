/**
 * Telegram fetch with resilient fallback chain:
 * Bot API → channel HTML preview → RSS (if configured) → OpenGraph → web parser
 */

import { importFromUrl } from "./url-importer.mjs";

async function fetchJson(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(t);
  }
}

function parseTelegramPreviewHtml(html, channel) {
  const posts = [];
  const re = /data-post="([^"]+)"[\s\S]*?tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/gi;
  let m;
  while ((m = re.exec(html)) && posts.length < 25) {
    const postRef = m[1];
    const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const [ch, msgId] = postRef.split("/");
    const imgMatch = html.slice(Math.max(0, m.index - 500), m.index + 500).match(/background-image:\s*url\(['"]?([^'")\s]+)/);
    const media = imgMatch ? [{ type: "image", url: imgMatch[1] }] : [];
    posts.push({
      external_id: `${channel}:${msgId}`,
      message_id: Number(msgId),
      channel: ch || channel,
      text,
      url: `https://t.me/${ch || channel}/${msgId}`,
      extracted_via: "telegram_preview",
      media,
      hashtags: (text.match(/#[\u0600-\u06FF\w]+/g) || []),
      links: (text.match(/https?:\/\/[^\s]+/g) || []),
    });
  }
  return posts;
}

function extractMediaFromPost(post) {
  const media = [];
  if (post.photo) media.push({ type: "image", url: post.photo });
  if (post.video) media.push({ type: "video", url: post.video });
  if (post.document) media.push({ type: "document", url: post.document, filename: post.document?.file_name });
  if (post.audio) media.push({ type: "audio", url: post.audio });
  if (post.voice) media.push({ type: "voice", url: post.voice });
  return media;
}

async function fetchViaBotApi(token, channelId, limit = 20) {
  const url = `https://api.telegram.org/bot${token}/getUpdates?limit=${Math.min(limit, 100)}`;
  const data = await fetchJson(url);
  if (!data.ok) throw new Error(data.description || "Telegram Bot API error");
  return (data.result || [])
    .filter((u) => u.channel_post?.chat?.id === channelId || u.channel_post?.chat?.username)
    .map((u) => {
      const post = u.channel_post;
      const text = post.text || post.caption || "";
      const media = extractMediaFromPost(post);
      return {
        external_id: `tg:${post.chat?.username || channelId}:${post.message_id}`,
        message_id: post.message_id,
        channel: post.chat?.username || String(channelId),
        text,
        url: post.chat?.username ? `https://t.me/${post.chat.username}/${post.message_id}` : null,
        published_at: new Date(post.date * 1000).toISOString(),
        extracted_via: "telegram_bot_api",
        media,
        hashtags: (text.match(/#[\u0600-\u06FF\w]+/g) || []),
        links: (text.match(/https?:\/\/[^\s]+/g) || []),
        raw_payload: { telegram: post, media },
      };
    });
}

async function fetchViaPreview(channel) {
  const url = channel.startsWith("http") ? channel : `https://t.me/s/${channel.replace(/^@/, "")}`;
  const res = await fetch(url, { headers: { "User-Agent": "MajalisBot/1.0" } });
  if (!res.ok) throw new Error(`Preview HTTP ${res.status}`);
  const html = await res.text();
  return parseTelegramPreviewHtml(html, channel.replace(/^@/, "").replace(/.*\//, ""));
}

async function fetchViaRss(rssUrl) {
  const page = await importFromUrl(rssUrl);
  if (!page?.description) return [];
  return [{
    external_id: `rss:${rssUrl}`,
    text: page.description,
    url: page.finalUrl || rssUrl,
    title: page.title,
    extracted_via: "telegram_rss",
  }];
}

/**
 * @param {object} config
 * @param {string} config.channel
 * @param {string} [config.bot_token]
 * @param {number|string} [config.channel_id]
 * @param {string} [config.rss_url]
 * @param {string} [config.official_url]
 */
export async function fetchTelegramChannel(config = {}) {
  const channel = String(config.channel || config.handle || "").replace(/^@/, "");
  const errors = [];

  if (config.bot_token && config.channel_id) {
    try {
      const posts = await fetchViaBotApi(config.bot_token, config.channel_id, config.limit || 20);
      if (posts.length) return { ok: true, posts, method: "bot_api" };
    } catch (err) {
      errors.push(`bot_api: ${err.message}`);
    }
  }

  try {
    const posts = await fetchViaPreview(config.official_url || channel);
    if (posts.length) return { ok: true, posts, method: "preview", errors };
  } catch (err) {
    errors.push(`preview: ${err.message}`);
  }

  if (config.rss_url) {
    try {
      const posts = await fetchViaRss(config.rss_url);
      if (posts.length) return { ok: true, posts, method: "rss", errors };
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
          posts: [{
            external_id: `og:${channel}`,
            text: page.description || page.title,
            title: page.title,
            url: page.finalUrl || ogUrl,
            extracted_via: "opengraph",
          }],
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

export { parseTelegramPreviewHtml };
