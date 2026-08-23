import { fetchText, extractOg, stripTags, sleep } from "../http.mjs";

function parseRss(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
    const link = block.match(/<link>([^<]+)<\/link>/i)?.[1]?.trim();
    const pub = block.match(/<pubDate>([^<]+)<\/pubDate>/i)?.[1]?.trim();
    const desc = stripTags(
      block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] ?? "",
    );
    if (!link) continue;
    items.push({
      externalId: link,
      url: link,
      title: title || desc.slice(0, 80) || link,
      text: desc || title || "",
      publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
    });
  }
  return items;
}

function guessRssUrls(siteUrl) {
  const base = siteUrl.replace(/\/$/, "");
  return [`${base}/feed`, `${base}/rss`, `${base}/feed.xml`, `${base}/rss.xml`, `${base}/atom.xml`];
}

/** @type {import('../types.mjs')} */
export const webAdapter = {
  id: "web",
  async fetch(account, since) {
    const site = account.site || account.url;
    let collected = [];

    for (const rssUrl of guessRssUrls(site)) {
      try {
        const { text } = await fetchText(rssUrl);
        if (/<rss|<feed|<channel/i.test(text)) {
          collected = parseRss(text);
          break;
        }
      } catch {
        /* جرّب التالي */
      }
      await sleep(300);
    }

    if (collected.length === 0) {
      try {
        const { text } = await fetchText(site);
        const title = extractOg(text, "og:title") || stripTags(text.match(/<title>([^<]+)/i)?.[1] ?? site);
        const desc = extractOg(text, "og:description") || "";
        collected = [
          {
            externalId: site,
            url: site,
            title,
            text: desc,
            publishedAt: new Date().toISOString(),
          },
        ];
      } catch {
        return [];
      }
    }

    return collected
      .filter((p) => !since || new Date(p.publishedAt) >= since)
      .map((p) => ({
        sourceId: account.id,
        externalId: p.externalId,
        url: p.url,
        title: p.title,
        text: p.text,
        publishedAt: p.publishedAt,
        imageUrl: undefined,
      }));
  },
};
