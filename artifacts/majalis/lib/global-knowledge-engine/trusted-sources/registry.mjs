/**
 * GKE Trusted Source Registry — production sources only (no example.com).
 * Categories: government, awqaf, universities, sheikhs, centers, journals, RSS, YouTube, Telegram.
 */

export const SOURCE_CATEGORY_TYPES = {
  government: "جهات حكومية",
  awqaf_ministry: "وزارات الأوقاف",
  university: "جامعات",
  sheikh_official: "مواقع رسمية للمشايخ",
  islamic_center: "جمعيات ومراكز إسلامية",
  scientific_journal: "مجلات علمية",
  university_site: "مواقع الجامعات",
  rss: "مصادر RSS",
  youtube_official: "قنوات YouTube الرسمية",
  telegram_official: "قنوات Telegram الرسمية",
  website: "مواقع رسمية",
};

/** @typedef {import('../types.mjs').GkeTrustedSource} GkeTrustedSource */

/** Production trusted sources — real URLs only */
export const GKE_TRUSTED_SOURCES = [
  {
    slug: "iifa-oic",
    name: "المجمع الفقهي الإسلامي الدولي",
    category_type: "government",
    source_type: "rss",
    source_url: "https://www.iifa-aifi.org",
    feed_url: "https://www.iifa-aifi.org/ar/feed",
    country: "SA",
    language: "ar",
    trust_score: 95,
    content_types: ["fiqh_decision", "article"],
    refresh_interval_hours: 12,
    publish_policy: "shadow",
    is_active: true,
    is_official: true,
  },
  {
    slug: "alifta-gov",
    name: "اللجنة الدائمة للبحوث العلمية والإفتاء",
    category_type: "awqaf_ministry",
    source_type: "rss",
    source_url: "https://www.alifta.gov.sa",
    feed_url: "https://www.alifta.gov.sa/ar/rss",
    country: "SA",
    language: "ar",
    trust_score: 98,
    content_types: ["fatwa", "permanent_committee_fatwa", "article"],
    refresh_interval_hours: 24,
    publish_policy: "shadow",
    is_active: true,
    is_official: true,
  },
  {
    slug: "kfas-kw",
    name: "مؤسسة الكويت للتقدم العلمي — اللجنة الشرعية",
    category_type: "government",
    source_type: "website",
    source_url: "https://www.kfas.org.kw",
    country: "KW",
    language: "ar",
    trust_score: 92,
    content_types: ["fiqh_decision", "research"],
    refresh_interval_hours: 24,
    publish_policy: "shadow",
    is_active: true,
    is_official: true,
  },
  {
    slug: "islamweb-news",
    name: "IslamWeb — الأخبار والمقالات",
    category_type: "rss",
    source_type: "rss",
    source_url: "https://www.islamweb.net",
    feed_url: "https://www.islamweb.net/ar/rss/news",
    country: "SA",
    language: "ar",
    trust_score: 88,
    content_types: ["article", "fawaid"],
    refresh_interval_hours: 6,
    publish_policy: "shadow",
    is_active: true,
    is_official: true,
  },
  {
    slug: "alukah-articles",
    name: "الموقع الإسلامي — مقالات علمية",
    category_type: "scientific_journal",
    source_type: "rss",
    source_url: "https://www.alukah.net",
    feed_url: "https://www.alukah.net/rss",
    country: "SA",
    language: "ar",
    trust_score: 85,
    content_types: ["article", "fawaid"],
    refresh_interval_hours: 12,
    publish_policy: "shadow",
    is_active: true,
    is_official: true,
  },
  {
    slug: "kuwait-mosques-lessons",
    name: "دروس مساجد الكويت — المجلس العلمي",
    category_type: "islamic_center",
    source_type: "website",
    source_url: "https://majlisilm.com/lessons",
    country: "KW",
    language: "ar",
    trust_score: 90,
    content_types: ["lesson", "course"],
    refresh_interval_hours: 6,
    publish_policy: "shadow",
    is_active: true,
    is_official: true,
  },
  {
    slug: "salem-altaweel-official",
    name: "الشيخ سالم بن سعد الطويل — الموقع الرسمي",
    category_type: "sheikh_official",
    source_type: "website",
    source_url: "https://www.saltaweel.com",
    country: "KW",
    language: "ar",
    trust_score: 88,
    content_types: ["lesson"],
    refresh_interval_hours: 12,
    publish_policy: "shadow",
    is_active: true,
    is_official: true,
  },
  {
    slug: "othman-alkhamees-reach",
    name: "د. عثمان الخميس — Reach",
    category_type: "sheikh_official",
    source_type: "website",
    source_url: "https://reach.link/othmanalkhamees",
    country: "KW",
    language: "ar",
    trust_score: 86,
    content_types: ["lesson"],
    refresh_interval_hours: 12,
    publish_policy: "shadow",
    is_active: true,
    is_official: true,
  },
  {
    slug: "quran-kw-circles",
    name: "الحلقات القرآنية — الكويت",
    category_type: "islamic_center",
    source_type: "website",
    source_url: "https://majlisilm.com/quran-scientific-circles",
    country: "KW",
    language: "ar",
    trust_score: 88,
    content_types: ["circle"],
    refresh_interval_hours: 12,
    publish_policy: "shadow",
    is_active: false,
    is_official: true,
  },
  {
    slug: "dorar-encyclopedia",
    name: "الدرر السنية",
    category_type: "website",
    source_type: "website",
    source_url: "https://dorar.net",
    country: "SA",
    language: "ar",
    trust_score: 92,
    content_types: ["article", "fatwa"],
    refresh_interval_hours: 48,
    publish_policy: "shadow",
    is_active: false,
    is_official: true,
    metadata: { note: "No public RSS — manual/legal agreement required" },
  },
];

export function getTrustedSourcesSeed() {
  return GKE_TRUSTED_SOURCES.filter((s) => !s.source_url.includes("example.com"));
}

export function getSourcesByCategory(categoryType) {
  return getTrustedSourcesSeed().filter((s) => s.category_type === categoryType);
}

export function getActiveTrustedSources() {
  return getTrustedSourcesSeed().filter((s) => s.is_active);
}

export function findTrustedSourceBySlug(slug) {
  return getTrustedSourcesSeed().find((s) => s.slug === slug) || null;
}
