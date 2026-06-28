export const DAILY_TARGET = 50;
export const MIN_VERIFY_CONFIDENCE = 0.95;
export const AUTO_PUBLISH_CONFIDENCE = 0.99;
export const EMBEDDING_SIMILARITY_THRESHOLD = 0.93;
export const TIME_BUDGET_MS = 50_000;
export const BATCH_PARALLEL = 2;

export const REJECT_REASONS = {
  AI_ERROR: "ai_error",
  VALIDATION: "validation",
  DUPLICATE: "duplicate",
  LOW_CONFIDENCE: "low_confidence",
  QUALITY: "quality",
  MISSING_REFERENCE: "missing_reference",
  AMBIGUOUS: "ambiguous",
};

/** @type {readonly string[]} */
export const ROTATION_CATEGORIES = [
  "quran",
  "tafsir",
  "aqeedah",
  "hadith",
  "hadith-terms",
  "fiqh",
  "usul-fiqh",
  "seerah",
  "companions",
  "prophets",
  "names-attributes",
  "adab",
  "akhlaq",
  "dua",
  "adhkar",
  "islamic-history",
  "arabic",
  "tajweed",
  "quran-sciences",
  "islamic-culture",
];

/** @type {Record<string, string>} */
export const CATEGORY_LABELS = {
  quran: "القرآن الكريم",
  tafsir: "التفسير",
  aqeedah: "العقيدة",
  hadith: "الحديث",
  "hadith-terms": "مصطلح الحديث",
  fiqh: "الفقه",
  "usul-fiqh": "أصول الفقه",
  seerah: "السيرة",
  companions: "الصحابة",
  prophets: "الأنبياء",
  "names-attributes": "أسماء الله الحسنى",
  adab: "الآداب الإسلامية",
  akhlaq: "الأخلاق",
  dua: "الدعاء",
  adhkar: "الأذكار",
  "islamic-history": "التاريخ الإسلامي",
  arabic: "اللغة العربية",
  tajweed: "التجويد",
  "quran-sciences": "علوم القرآن",
  "islamic-culture": "الثقافة الإسلامية",
};

/** 40% easy, 40% medium, 20% hard for 50 daily slots */
export const DIFFICULTY_SLOTS = [
  ...Array(20).fill("سهل"),
  ...Array(20).fill("متوسط"),
  ...Array(10).fill("متقدم"),
];

/** @type {readonly string[]} */
export const TRUSTED_SOURCES = [
  "القرآن الكريم",
  "صحيح البخاري",
  "صحيح مسلم",
  "الكتب التسعة",
  "أقوال أهل السنة المعتمدة",
  "كتب العلماء الموثوقين",
];
