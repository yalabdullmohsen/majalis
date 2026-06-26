/** Content Import Engine — type registry and table mapping. */

export const CONTENT_TYPES = [
  "lessons",
  "sheikhs",
  "courses",
  "books",
  "questions",
  "adhkar",
  "quran_surahs",
  "quran_topics",
  "articles",
  "benefits",
];

/** @typedef {"supabase"|"staged"} ImportTarget */
/** @typedef {{ type: string, label: string, target: ImportTarget, table?: string, aliases?: string[] }} ContentTypeDef */

/** @type {Record<string, ContentTypeDef>} */
export const TYPE_REGISTRY = {
  lessons: {
    type: "lessons",
    label: "الدروس",
    target: "supabase",
    table: "lessons",
    aliases: ["lesson"],
  },
  sheikhs: {
    type: "sheikhs",
    label: "المشايخ",
    target: "supabase",
    table: "sheikhs",
    aliases: ["sheikh"],
  },
  courses: {
    type: "courses",
    label: "الدورات",
    target: "supabase",
    table: "lessons",
    aliases: ["course"],
  },
  books: {
    type: "books",
    label: "الكتب",
    target: "supabase",
    table: "library_items",
    aliases: ["book", "library"],
  },
  questions: {
    type: "questions",
    label: "الأسئلة",
    target: "supabase",
    table: "qa_questions",
    aliases: ["question", "qa"],
  },
  adhkar: {
    type: "adhkar",
    label: "الأذكار",
    target: "staged",
    aliases: ["dhikr", "adhkars"],
  },
  quran_surahs: {
    type: "quran_surahs",
    label: "سور القرآن",
    target: "staged",
    aliases: ["surahs", "quran-surahs"],
  },
  quran_topics: {
    type: "quran_topics",
    label: "موضوعات القرآن",
    target: "staged",
    aliases: ["quran-topics"],
  },
  articles: {
    type: "articles",
    label: "المقالات",
    target: "supabase",
    table: "library_items",
    aliases: ["article"],
  },
  benefits: {
    type: "benefits",
    label: "الفوائد",
    target: "supabase",
    table: "fawaid",
    aliases: ["benefit", "fawaid", "fawaid"],
  },
};

export function resolveContentType(raw) {
  const key = String(raw || "").trim().toLowerCase();
  if (TYPE_REGISTRY[key]) return TYPE_REGISTRY[key];
  for (const def of Object.values(TYPE_REGISTRY)) {
    if (def.aliases?.includes(key)) return def;
  }
  return null;
}
