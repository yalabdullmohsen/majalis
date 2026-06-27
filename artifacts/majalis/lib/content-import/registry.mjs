/** Content Import Engine — type registry (all targets: Supabase DB, no local files). */

export const CONTENT_TYPES = [
  "lessons",
  "sheikhs",
  "courses",
  "books",
  "questions",
  "benefits",
  "adhkar",
  "quran_surahs",
  "quran_topics",
  "articles",
  "rulings",
  "categories",
];

/** @typedef {"supabase"} ImportTarget */
/** @typedef {{ type: string, label: string, target: ImportTarget, table: string, aliases?: string[] }} ContentTypeDef */

/** @type {Record<string, ContentTypeDef>} */
export const TYPE_REGISTRY = {
  lessons: { type: "lessons", label: "الدروس", target: "supabase", table: "lessons", aliases: ["lesson"] },
  sheikhs: { type: "sheikhs", label: "المشايخ", target: "supabase", table: "sheikhs", aliases: ["sheikh"] },
  courses: { type: "courses", label: "الدورات", target: "supabase", table: "lessons", aliases: ["course"] },
  books: { type: "books", label: "الكتب", target: "supabase", table: "library_items", aliases: ["book", "library"] },
  questions: { type: "questions", label: "الأسئلة", target: "supabase", table: "qa_questions", aliases: ["question", "qa"] },
  benefits: { type: "benefits", label: "الفوائد", target: "supabase", table: "fawaid", aliases: ["benefit", "fawaid"] },
  adhkar: { type: "adhkar", label: "الأذكار", target: "supabase", table: "platform_adhkar_items", aliases: ["dhikr", "adhkars"] },
  quran_surahs: { type: "quran_surahs", label: "سور القرآن", target: "supabase", table: "platform_quran_surahs", aliases: ["surahs"] },
  quran_topics: { type: "quran_topics", label: "قصص/موضوعات القرآن", target: "supabase", table: "platform_quran_topics", aliases: ["quran-topics", "quran_stories"] },
  articles: { type: "articles", label: "المقالات", target: "supabase", table: "library_items", aliases: ["article"] },
  rulings: { type: "rulings", label: "الأحكام الشرعية", target: "supabase", table: "sharia_rulings", aliases: ["ruling", "fatwa"] },
  categories: { type: "categories", label: "التصنيفات", target: "supabase", table: "qa_categories", aliases: ["category", "qa_categories"] },
};

export function resolveContentType(raw) {
  const key = String(raw || "").trim().toLowerCase();
  if (TYPE_REGISTRY[key]) return TYPE_REGISTRY[key];
  for (const def of Object.values(TYPE_REGISTRY)) {
    if (def.aliases?.includes(key)) return def;
  }
  return null;
}

export function listContentTypesForApi() {
  return CONTENT_TYPES.map((t) => {
    const def = TYPE_REGISTRY[t];
    return { value: t, label: def.label, table: def.table };
  });
}
