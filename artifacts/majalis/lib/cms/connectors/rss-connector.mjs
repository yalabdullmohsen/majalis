import { BaseSourceConnector } from "./base-connector.mjs";
import { importFromUrl } from "../url-importer.mjs";

async function parseRssItems(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks.slice(0, 20)) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim();
    const desc = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const img = block.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1];
    if (link) items.push({ title: title || "", link, description: desc || "", imageUrl: img || "", externalId: link });
  }
  return items;
}

export class RssConnector extends BaseSourceConnector {
  async discover() {
    const feedUrl = this.source.feed_url || this.source.rss_url || this.source.url;
    const imported = await importFromUrl(feedUrl);
    const items = await parseRssItems(imported.rawText || imported.description || "");
    if (items.length) return { items, connectorHint: null };
    return {
      items: [{ title: imported.title, link: this.source.url, description: imported.description, imageUrl: imported.imageUrl, externalId: this.source.url }],
      connectorHint: null,
    };
  }

  get label() {
    return "RSS";
  }
}
