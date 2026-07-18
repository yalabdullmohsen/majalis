/**
 * Official sources registry — metadata only, no generated religious content.
 */

export const OFFICIAL_SOURCES = [
  {
    slug: "islamweb-news",
    name: "IslamWeb — الأخبار والمقالات",
    country: "SA",
    entity_type: "islamic_org",
    official_url: "https://www.islamweb.net",
    rss_url: "https://www.islamweb.net/ar/rss/news",
    trust_level: 4,
    allowed_kinds: ["news", "article"],
    crawl_interval_h: 6,
  },
  {
    slug: "iifa-oic",
    name: "الأكاديمية الإسلامية للفقه (OIC-IIFA)",
    country: "SA",
    entity_type: "islamic_org",
    official_url: "https://www.iifa-aifi.org",
    rss_url: "https://www.iifa-aifi.org/ar/rss",
    trust_level: 5,
    allowed_kinds: ["fiqh_decision", "news"],
    crawl_interval_h: 12,
    manifest_file: "fiqh-official-manifest.json",
  },
  {
    slug: "kfas-sharia",
    name: "KFAS — اللجنة الشرعية",
    country: "KW",
    entity_type: "research_center",
    official_url: "https://www.kfas.org.kw",
    trust_level: 4,
    allowed_kinds: ["fiqh_decision", "article"],
    crawl_interval_h: 24,
    manifest_file: "fiqh-kfas-manifest.json",
  },
  {
    slug: "alukah-articles",
    name: "الموقع الإسلامي — مقالات علمية",
    country: "SA",
    entity_type: "islamic_org",
    official_url: "https://www.alukah.net",
    rss_url: "https://www.alukah.net/rss",
    trust_level: 3,
    allowed_kinds: ["article", "fawaid"],
    crawl_interval_h: 12,
  },
  {
    slug: "majlis-seed",
    name: "بذور المجلس العلمي",
    country: "KW",
    entity_type: "publisher",
    official_url: "https://www.majlisilm.com",
    trust_level: 5,
    allowed_kinds: ["lesson", "fawaid", "book", "miracle", "qa", "article"],
    crawl_interval_h: 24,
    seed_only: true,
  },
  {
    slug: "kuwait-lessons",
    name: "دروس الكويت — مصادر محلية",
    country: "KW",
    entity_type: "government",
    official_url: "https://www.majlisilm.com",
    trust_level: 4,
    allowed_kinds: ["lesson", "lecture", "course"],
    crawl_interval_h: 6,
    seed_only: true,
  },
];

export const FORBIDDEN_AI_GENERATION = [
  "hadith_text",
  "fatwa_ruling",
  "legal_verdict",
  "consensus_claim",
  "scholar_attribution",
  "religious_decision",
];

// خُفِّفت العتبات لقبول بيانات ناقصة أو جزئية
export const MIN_QUALITY_TO_PUBLISH = 30;
export const MIN_TRUST_TO_PUBLISH = 20;
export const DUPLICATE_THRESHOLD = 0.88;

export function isAllowedKind(source, kind) {
  return (source.allowed_kinds || []).includes(kind);
}

export function sourceTrustScore(source) {
  return Math.min(100, (source.trust_level || 3) * 20);
}
