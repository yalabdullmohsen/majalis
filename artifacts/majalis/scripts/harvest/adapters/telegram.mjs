import { fetchText, stripTags } from "../http.mjs";

function parseTelegramPosts(html, channel) {
  const items = [];
  const re =
    /<div class="tgme_widget_message_wrap[^"]*"[\s\S]*?data-post="([^"]+)"[\s\S]*?<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let m;
  while ((m = re.exec(html))) {
    const postRef = m[1];
    const text = stripTags(m[2]);
    if (!text) continue;
    const externalId = postRef.split("/").pop() ?? postRef;
    items.push({
      externalId,
      url: `https://t.me/${channel}/${externalId}`,
      title: text.split("\n")[0].slice(0, 120) || text.slice(0, 120),
      text,
      publishedAt: new Date().toISOString(),
    });
  }
  return items;
}

/** @type {import('./types.mjs')} */
export const telegramAdapter = {
  id: "telegram",
  async fetch(account, since) {
    const channel = account.handle.replace(/^@/, "");
    const url = `https://t.me/s/${channel}`;
    const { text } = await fetchText(url);
    const posts = parseTelegramPosts(text, channel);
    return posts
      .filter((p) => !since || new Date(p.publishedAt) >= since)
      .map((p) => ({
        sourceId: account.id,
        externalId: p.externalId,
        url: p.url,
        title: p.title,
        text: p.text,
        publishedAt: p.publishedAt,
      }));
  },
};
