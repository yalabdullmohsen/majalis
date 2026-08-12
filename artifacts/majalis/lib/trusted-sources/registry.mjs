/**
 * Trusted Sources Registry — official Islamic scholarly sources only.
 * Unofficial sources require legal verified access method.
 */

export const TRUSTED_SOURCES = [
  {
    slug: "iifa",
    name: "المجمع الفقهي الإسلامي الدولي",
    source_type: "rss",
    url: "https://www.iifa-aifi.org/ar/feed",
    official_site: "https://www.iifa-aifi.org",
    category: "قرارات",
    trust_level: 95,
    is_active: true,
    is_official: true,
  },
  {
    slug: "alifta",
    name: "هيئة كبار العلماء",
    source_type: "rss",
    url: "https://www.alifta.com/rss.aspx",
    official_site: "https://www.alifta.com",
    category: "فتاوى",
    trust_level: 95,
    is_active: false,
    is_official: true,
    note: "Feed format pending verification",
  },
  {
    slug: "daemah",
    name: "اللجنة الدائمة للإفتاء",
    source_type: "rss",
    url: "https://www.alifta.gov.sa/ar/rss",
    official_site: "https://www.alifta.gov.sa",
    category: "فتاوى",
    trust_level: 95,
    is_active: false,
    is_official: true,
    note: "Feed unreachable from server",
  },
  {
    slug: "dorar",
    name: "الدرر السنية",
    source_type: "web",
    url: "https://dorar.net",
    official_site: "https://dorar.net",
    category: "موسوعة",
    trust_level: 92,
    is_active: false,
    is_official: true,
    note: "No public RSS — API/scrape requires legal agreement",
  },
  {
    slug: "islamqa",
    name: "الإسلام سؤال وجواب",
    source_type: "rss",
    url: "https://islamqa.info/ar/rss",
    official_site: "https://islamqa.info",
    category: "فتاوى",
    trust_level: 90,
    is_active: false,
    is_official: true,
    note: "Feed may block bots",
  },
  {
    slug: "binbaz",
    name: "موقع الشيخ ابن باز",
    source_type: "rss",
    url: "https://www.binbaz.org.sa/rss",
    official_site: "https://www.binbaz.org.sa",
    category: "فتاوى",
    trust_level: 95,
    is_active: false,
    is_official: true,
    note: "RSS returns 404",
  },
  {
    slug: "binothaimeen",
    name: "موقع الشيخ ابن عثيمين",
    source_type: "rss",
    url: "https://binothaimeen.net/rss",
    official_site: "https://binothaimeen.net",
    category: "فتاوى",
    trust_level: 95,
    is_active: false,
    is_official: true,
    note: "URL returns HTML not RSS",
  },
  {
    slug: "alfawzan",
    name: "موقع الشيخ صالح الفوزان",
    source_type: "rss",
    url: "https://alfawzan.af.org.sa/rss",
    official_site: "https://alfawzan.af.org.sa",
    category: "فتاوى",
    trust_level: 95,
    is_active: false,
    is_official: true,
    note: "Feed unreachable",
  },
  {
    slug: "albadar",
    name: "موقع الشيخ عبدالرزاق البدر",
    source_type: "rss",
    url: "https://abdulazizalbadar.com/feed",
    official_site: "https://abdulazizalbadar.com",
    category: "فوائد",
    trust_level: 90,
    is_active: false,
    is_official: true,
    note: "Feed unreachable",
  },
  {
    slug: "alsabt",
    name: "موقع الشيخ خالد السبت",
    source_type: "rss",
    url: "https://alsabt.com/feed",
    official_site: "https://alsabt.com",
    category: "دروس",
    trust_level: 90,
    is_active: false,
    is_official: true,
    note: "Feed unreachable",
  },
];

/** Backward-compatible export for auto-content seed */
export const OFFICIAL_TRUSTED_SOURCES = TRUSTED_SOURCES.map((s) => ({
  name: s.name,
  source_type: s.source_type,
  url: s.url,
  official_site: s.official_site,
  category: s.category,
  trust_level: s.trust_level,
  is_active: s.is_active,
  note: s.note,
}));

export const MIN_AUTO_PUBLISH_QUALITY = 65;
export const MIN_AUTO_PUBLISH_TRUST = 85;

export function getOfficialSourcesOnly() {
  return TRUSTED_SOURCES.filter((s) => s.is_official);
}

export function getActiveSources() {
  return TRUSTED_SOURCES.filter((s) => s.is_active && s.is_official);
}
