/**
 * Murtaqaa Instagram + DrosQ8 Telegram — official AKE / Content Engine sources.
 */

export const MURTaqaa_DROSQ8_SOURCES = {
  instagram: {
    slug: "instagram-murtaqaa",
    name: "مرتقى — دروس الكويت (Instagram)",
    platform: "instagram",
    url: "https://www.instagram.com/murtaqaa_kw",
    handle: "murtaqaa_kw",
    source_type: "instagram",
    trust_level: "trusted",
    auto_publish_allowed: true,
    country: "الكويت",
    city: "العاصمة",
    category: "دروس",
    poll_interval_minutes: 10,
    config: {
      handle: "murtaqaa_kw",
      source_subtype: "lesson_aggregator",
      connector: "instagram_graph_api",
      skip_month_filter: true,
      fetch_limit: 25,
      vision_on_image: true,
      confidence_tiers: { auto_publish: 90, review: 70 },
      allowed_media: ["IMAGE", "VIDEO", "CAROUSEL_ALBUM", "REELS"],
    },
  },
  telegram: {
    slug: "telegram-drosq8",
    name: "دروس الكويت — Telegram",
    platform: "telegram",
    url: "https://t.me/DrosQ8",
    handle: "DrosQ8",
    source_type: "telegram",
    trust_level: "trusted",
    auto_publish_allowed: true,
    country: "الكويت",
    city: "العاصمة",
    category: "دروس",
    poll_interval_minutes: 5,
    config: {
      channel: "DrosQ8",
      public_web_preview: true,
      skip_month_filter: true,
      fetch_limit: 20,
      vision_on_image: true,
      confidence_tiers: { auto_publish: 90, review: 70 },
    },
  },
};

export const MURTaqaa_DROSQ8_SLUGS = [
  MURTaqaa_DROSQ8_SOURCES.instagram.slug,
  MURTaqaa_DROSQ8_SOURCES.telegram.slug,
];

export function isMurtaqaaDrosq8Slug(slug) {
  return MURTaqaa_DROSQ8_SLUGS.includes(slug);
}
