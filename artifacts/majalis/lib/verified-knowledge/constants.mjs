/** Verified Knowledge Platform — thresholds and content kinds */

export const MIN_CONFIDENCE_TO_AUTO_PUBLISH = 90;
export const MIN_TRUST_TO_AUTO_PUBLISH = 90;
export const MIN_QUALITY_TO_AUTO_PUBLISH = 85;
export const MIN_COMPLETENESS_TO_AUTO_PUBLISH = 85;

export const VERIFICATION_STATUS = {
  VERIFIED: "verified",
  NEEDS_REVIEW: "needs_review",
  REJECTED: "rejected",
  DUPLICATE: "duplicate",
  ARCHIVED: "archived",
};

export const IMPORT_METHODS = ["rss", "api", "manifest", "seed", "manual", "connector"];

export const OFFICIAL_SOURCE_DEFAULTS = {
  hisn: {
    slug: "hisn-muslim",
    name: "حصn المسلم",
    entity_name: "سعيد بن علي بن وهف القحطاني",
    source_type: "book",
    url: "https://hisn.alim.net",
    trust_level: 95,
    licensing: "public_reference",
    import_method: "seed",
    source_language: "ar",
    is_official: true,
  },
  sunnah: {
    slug: "sunnah-com",
    name: "Sunnah.com",
    entity_name: "مشروع السنة",
    source_type: "database",
    url: "https://sunnah.com",
    trust_level: 92,
    licensing: "reference_only",
    import_method: "seed",
    source_language: "ar",
    is_official: true,
  },
  alquran: {
    slug: "alquran-cloud",
    name: "AlQuran Cloud",
    entity_name: "AlQuran Cloud API",
    source_type: "api",
    url: "https://alquran.cloud/api",
    trust_level: 95,
    licensing: "api_terms",
    import_method: "api",
    source_language: "ar",
    is_official: true,
  },
  majlis: {
    slug: "majlisilm",
    name: "المجلس العلمي",
    entity_name: "المجلس العلمي",
    source_type: "official",
    url: "https://majlisilm.com",
    trust_level: 88,
    licensing: "owned",
    import_method: "seed",
    source_language: "ar",
    is_official: true,
  },
};
