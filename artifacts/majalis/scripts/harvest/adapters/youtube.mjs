import { fetchText } from "../http.mjs";

function parseYoutubeFeed(xml, channelId) {
  const items = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = entryRe.exec(xml))) {
    const block = m[1];
    const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i)?.[1];
    const title = block.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
    const published = block.match(/<published>([^<]+)<\/published>/i)?.[1];
    if (!id || !title) continue;
    items.push({
      externalId: id,
      url: `https://www.youtube.com/watch?v=${id}`,
      title,
      text: title,
      publishedAt: published ? new Date(published).toISOString() : new Date().toISOString(),
      imageUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    });
  }
  if (items.length === 0 && channelId) {
    const idRe = /<yt:videoId>([^<]+)<\/yt:videoId>/gi;
    let vid;
    while ((vid = idRe.exec(xml))) {
      const id = vid[1];
      items.push({
        externalId: id,
        url: `https://www.youtube.com/watch?v=${id}`,
        title: `فيديو ${id}`,
        text: "",
        publishedAt: new Date().toISOString(),
        imageUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      });
    }
  }
  return items;
}

/** @type {import('../types.mjs')} */
export const youtubeAdapter = {
  id: "youtube",
  async fetch(account, since) {
    const channelId = account.youtube_channel_id || account.handle;
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const { text } = await fetchText(feedUrl);
    const posts = parseYoutubeFeed(text, channelId);
    return posts
      .filter((p) => !since || new Date(p.publishedAt) >= since)
      .map((p) => ({
        sourceId: account.id,
        externalId: p.externalId,
        url: p.url,
        title: p.title,
        text: p.text,
        imageUrl: p.imageUrl,
        publishedAt: p.publishedAt,
      }));
  },
};
