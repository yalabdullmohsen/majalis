/**
 * Islamic Knowledge Reasoning Engine — constants
 */

export const REASONING_DISCLAIMER =
  "هذه إجابة مستندة إلى مواد منشورة في قاعدة معرفة المجلس العلمي، وليست فتوى شخصية. " +
  "يُرجى مراجعة المصادر الأصلية وسؤال أهل العلم في المسائل الخاصة.";

export const NO_EVIDENCE_MESSAGE =
  "لا توجد مادة موثقة كافية في قاعدة معرفة المجلس العلمي للإجابة عن هذا السؤال. " +
  "لم نُنشئ إجابة من المعرفة العامة حفاظاً على الدقة العلمية.";

/** Search priority tiers — lower tier = higher priority */
export const SEARCH_TIERS = [
  { tier: 1, label: "القرآن الكريم", kinds: ["quran", "ayah", "verse"] },
  { tier: 2, label: "السنة النبوية", kinds: ["hadith", "sunnah"] },
  { tier: 3, label: "الأحاديث الموثقة", kinds: ["verified_hadith"] },
  { tier: 4, label: "الأذكار", kinds: ["adhkar", "verified_adhkar"] },
  { tier: 5, label: "شروح العلماء", kinds: ["scholar", "sheikh", "tafseer", "explains"] },
  { tier: 6, label: "الكتب", kinds: ["book", "library"] },
  { tier: 7, label: "الفتاوى", kinds: ["fatwa", "fiqh_decision", "fiqh_council", "ruling"] },
  { tier: 8, label: "الدروس", kinds: ["lesson", "lecture", "course"] },
  { tier: 9, label: "المقالات والفوائد", kinds: ["article", "update", "fawaid", "qa", "miracle"] },
];

export const ENTITY_KINDS = [
  "ayah", "hadith", "adhkar", "scholar", "sheikh", "book", "author",
  "fatwa", "lesson", "course", "series", "mosque", "occasion",
  "category", "tag", "person", "place", "time", "topic",
];

export const INFERENCE_RELATIONS = [
  { from: "hadith", to: "quran", type: "quran", via: "keywords" },
  { from: "hadith", to: "topic", type: "topic", via: "keywords" },
  { from: "hadith", to: "scholar", type: "scholar", via: "narrator" },
  { from: "hadith", to: "source", type: "same_source", via: "source" },
  { from: "hadith", to: "lesson", type: "lesson", via: "keywords" },
  { from: "hadith", to: "book", type: "book", via: "keywords" },
  { from: "ayah", to: "tafseer", type: "tafseer", via: "keywords" },
  { from: "ayah", to: "hadith", type: "hadith", via: "keywords" },
  { from: "ayah", to: "ruling", type: "fatwa", via: "keywords" },
  { from: "sheikh", to: "lesson", type: "lesson", via: "author" },
  { from: "sheikh", to: "book", type: "book", via: "author" },
  { from: "book", to: "author", type: "scholar", via: "author" },
  { from: "book", to: "lesson", type: "lesson", via: "keywords" },
  { from: "fatwa", to: "hadith", type: "hadith", via: "keywords" },
  { from: "fatwa", to: "scholar", type: "scholar", via: "author" },
  { from: "fatwa", to: "topic", type: "topic", via: "keywords" },
];

export const MIN_CONFIDENCE_AUTO = 70;
export const MIN_SOURCES_FOR_ANSWER = 1;

export const ISLAMIC_QUERY_PATTERNS = [
  /ما (حكم|فضل|معنى|دليل|حكم)/,
  /هل (يجوز|يحرم|واجب|فرض|صحيح)/,
  /(حديث|آية|سورة|قرآن|سنة|فقه|تفسير|عقيدة|توحيد|صلاة|زكاة|صيام|حج|وضوء|ذكر|دعاء|أذكار)/,
  /(شيخ|عالم|مفتي|فقيه|محدث)/,
  /(فتوى|فتاوى|مسألة|حكم شرعي)/,
  /(كتاب|تفسير|صحيح|سنن|مسند)/,
];
