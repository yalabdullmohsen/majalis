/**
 * AKE v2 — Plugin registry for connector types.
 * Add new platform = register plugin + implement connector class.
 */

const PLUGIN_REGISTRY = new Map();

export function registerConnectorPlugin(id, factory, meta = {}) {
  PLUGIN_REGISTRY.set(id, { id, factory, ...meta });
}

export function getConnectorPlugin(id) {
  return PLUGIN_REGISTRY.get(id);
}

export function listConnectorPlugins() {
  return [...PLUGIN_REGISTRY.values()];
}

export function resolvePluginId(config) {
  return (
    config.plugin_id ||
    config.pluginId ||
    config.connector_type ||
    config.connectorType ||
    "rss"
  );
}

/** Bootstrap all v2 connector plugins */
export async function bootstrapConnectorPlugins() {
  if (PLUGIN_REGISTRY.size > 0) return;

  const { RssConnector, ManifestConnector, SeedConnector } = await import("../connectors/index.mjs");
  const { HtmlConnector } = await import("../connectors/html-connector.mjs");
  const { SitemapConnector } = await import("../connectors/sitemap-connector.mjs");
  const { WebsiteConnector } = await import("../connectors/website-connector.mjs");
  const { InstagramConnector } = await import("../connectors/instagram-connector.mjs");
  const { YoutubeConnector } = await import("../connectors/youtube-connector.mjs");
  const { TelegramConnector } = await import("../connectors/telegram-connector.mjs");
  const { SocialWebConnector } = await import("../connectors/social-web-connector.mjs");

  registerConnectorPlugin("rss", (c) => new RssConnector(c), { labelAr: "RSS" });
  registerConnectorPlugin("manifest", (c) => new ManifestConnector(c), { labelAr: "Manifest" });
  registerConnectorPlugin("seed", (c) => new SeedConnector(c), { labelAr: "Seed" });
  registerConnectorPlugin("html", (c) => new HtmlConnector(c), { labelAr: "HTML Parser" });
  registerConnectorPlugin("sitemap", (c) => new SitemapConnector(c), { labelAr: "Sitemap" });
  registerConnectorPlugin("website", (c) => new WebsiteConnector(c), { labelAr: "Website Hybrid" });
  registerConnectorPlugin("instagram", (c) => new InstagramConnector(c), { labelAr: "Instagram" });
  registerConnectorPlugin("youtube", (c) => new YoutubeConnector(c), { labelAr: "YouTube" });
  registerConnectorPlugin("telegram", (c) => new TelegramConnector(c), { labelAr: "Telegram" });
  registerConnectorPlugin("x", (c) => new SocialWebConnector({ ...c, connector_type: "x" }), { labelAr: "X" });
  registerConnectorPlugin("facebook", (c) => new SocialWebConnector({ ...c, connector_type: "facebook" }), { labelAr: "Facebook" });
  registerConnectorPlugin("whatsapp", (c) => new SocialWebConnector({ ...c, connector_type: "whatsapp" }), { labelAr: "WhatsApp" });
}

export const SOURCE_PRIORITY = {
  official_website: 1,
  scholar_official: 2,
  mosque_official: 3,
  course_official: 4,
  ministry: 5,
  association: 6,
  aggregator: 7,
  repost: 8,
};

export const CONTENT_CATEGORIES = [
  "تفسير", "حديث", "عقيدة", "فقه", "أصول فقه", "لغة عربية", "سيرة", "تزكية",
  "دعوة", "قرآن", "علوم القرآن", "إعجاز علمي", "فتاوى", "محاضرة", "ندوة",
  "دورة", "حلقة", "خطبة", "إعلان", "خبر",
];

export const PIPELINE_STAGES_V2 = [
  "fetch", "normalize", "duplicate_detection", "ai_extraction", "entity_linking",
  "quality_validation", "publishing", "search_index", "cache_refresh", "analytics",
];
