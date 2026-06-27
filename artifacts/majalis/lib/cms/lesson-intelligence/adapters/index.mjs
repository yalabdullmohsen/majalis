/**
 * Phase 6 — Platform adapters (extends Phase 5 connectors without replacing).
 */
import { createSourceConnector } from "../../connectors/index.mjs";
import { importFromUrl } from "../../url-importer.mjs";

const ADAPTER_MAP = {
  instagram: "instagram",
  x: "x",
  twitter: "x",
  facebook: "facebook",
  telegram: "telegram",
  whatsapp: "whatsapp",
  youtube: "youtube",
  youtube_live: "youtube",
  youtube_community: "youtube",
  rss: "rss",
  website: "website",
  wordpress: "website",
  ghost: "website",
  drupal: "website",
  blogger: "website",
  google_calendar: "website",
  ics: "rss",
  pdf: "website",
  image: "manual",
  png: "manual",
  jpg: "manual",
  jpeg: "manual",
  webp: "manual",
  manual: "manual",
};

export function resolveAdapterType(sourceType) {
  return ADAPTER_MAP[String(sourceType || "website").toLowerCase()] || "website";
}

export function lessonSourceToConnectorSource(source) {
  const adapterType = resolveAdapterType(source.source_type);
  const config = source.config || {};
  return {
    id: source.id,
    name: source.source_name,
    url: source.source_url,
    platform: source.platform || adapterType,
    source_type: adapterType,
    trust_level: source.trust_score >= 95 ? "official" : source.trust_score >= 80 ? "trusted" : "community",
    auto_publish_allowed: source.auto_publish,
    country: source.country,
    city: source.city,
    category: config.category || "دروس",
    active: source.active,
    feed_url: config.rss_url || config.feed_url || null,
    config: {
      ...config,
      handle: config.instagram_username || config.handle,
      website_url: config.website_url || config.website,
    },
  };
}

export async function discoverViaAdapter(source) {
  const connectorSource = lessonSourceToConnectorSource(source);
  const connector = createSourceConnector(connectorSource);
  const result = await connector.discover();

  if (source.source_type === "ics" || source.source_type === "google_calendar") {
    const calUrl = source.config?.ics_url || source.source_url;
    try {
      const cal = await importFromUrl(calUrl);
      const events = String(cal.rawText || "")
        .split("BEGIN:VEVENT")
        .slice(1, 15)
        .map((block) => {
          const summary = block.match(/SUMMARY:([^\r\n]+)/)?.[1];
          const dtstart = block.match(/DTSTART[^:]*:([^\r\n]+)/)?.[1];
          const location = block.match(/LOCATION:([^\r\n]+)/)?.[1];
          const desc = block.match(/DESCRIPTION:([^\r\n]+)/)?.[1];
          return {
            title: summary || source.source_name,
            link: calUrl,
            description: desc || "",
            startDate: dtstart,
            location,
            externalId: `${calUrl}:${summary}:${dtstart}`,
          };
        });
      if (events.length) {
        return {
          items: events.map((e) => ({
            title: e.title,
            link: e.link,
            description: e.description,
            location: e.location,
            startDate: e.startDate,
            externalId: e.externalId,
          })),
          adapter: "ics",
        };
      }
    } catch {
      /* fall through to connector */
    }
  }

  return { ...result, adapter: resolveAdapterType(source.source_type) };
}

export function listSupportedAdapters() {
  return [...new Set(Object.keys(ADAPTER_MAP))];
}

export { ADAPTER_MAP };
