/**
 * YouTube AKE Connector — metadata from channel/page (no fabricated transcripts).
 */
import { BaseConnector } from "../connector-base.mjs";
import { normalizeContentKind } from "../content-kind.mjs";
import { importFromUrl } from "../../cms/url-importer.mjs";

export class YoutubeConnector extends BaseConnector {
  async fetchItems(syncOptions = {}) {
    const channelUrl = this.officialUrl;
    const videoUrls = this.apiConfig.video_urls || [];

    if (!videoUrls.length && this.apiConfig.channel_id) {
      syncOptions._note = "YouTube Data API key required for channel feed — using page OG only";
    }

    const urls = videoUrls.length ? videoUrls : [channelUrl];
    const items = [];

    for (const url of urls.slice(0, syncOptions.limit || 8)) {
      try {
        const page = await importFromUrl(url);
        items.push({
          external_id: `${this.slug}:yt:${Buffer.from(url).toString("base64url").slice(0, 28)}`,
          source_slug: this.slug,
          source_attribution: this.name,
          source_url: channelUrl,
          raw_url: page.finalUrl || url,
          raw_title: page.title || "",
          raw_body: page.description || "",
          raw_payload: {
            imageUrl: page.imageUrl,
            thumbnail: page.imageUrl,
            platform: "youtube",
            has_transcript: false,
            extracted_via: "og_metadata",
          },
          content_kind: normalizeContentKind("lesson"),
          published_at: null,
        });
      } catch {
        /* skip */
      }
    }

    return items;
  }
}
