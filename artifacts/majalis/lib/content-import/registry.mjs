/** Content Import Engine — type registry (Vercel-safe: Supabase only, no filesystem). */

export const CONTENT_TYPES = [
  "lessons",
  "sheikhs",
  "courses",
  "books",
  "articles",
  "questions",
  "adhkar",
  "benefits",
  "rulings",
  "hadith",
  "stories",
  "permanent_committee_fatwas",
];

/** @typedef {{ type: string, label: string, table?: string, aliases?: string[] }} ContentTypeDef */

/** @type {Record<string, ContentTypeDef>} */
export const TYPE_REGISTRY = {
  lessons: {
    type: "lessons",
    label: "الدروس",
    table: "lessons",
    aliases: ["lesson"],
  },
  sheikhs: {
    type: "sheikhs",
    label: "المشايخ",
    table: "sheikhs",
    aliases: ["sheikh"],
  },
  courses: {
    type: "courses",
    label: "الدورات",
    table: "lessons",
    aliases: ["course"],
  },
  books: {
    type: "books",
    label: "الكتب",
    table: "library_items",
    aliases: ["book", "library"],
  },
  articles: {
    type: "articles",
    label: "المقالات",
    table: "library_items",
    aliases: ["article"],
  },
  questions: {
    type: "questions",
    label: "الأسئلة",
    table: "qa_questions",
    aliases: ["question", "qa"],
  },
  adhkar: {
    type: "adhkar",
    label: "الأذكار",
    table: "verified_adhkar_items",
    aliases: ["dhikr", "adhkars"],
  },
  benefits: {
    type: "benefits",
    label: "الفوائد",
    table: "fawaid",
    aliases: ["benefit", "fawaid", "fawaid"],
  },
  rulings: {
    type: "rulings",
    label: "الفتاوى",
    table: "sharia_rulings",
    aliases: ["ruling", "fatwa", "fatwas"],
  },
  hadith: {
    type: "hadith",
    label: "الأحاديث",
    table: "verified_hadith_items",
    aliases: ["hadiths", "sunnah"],
  },
  stories: {
    type: "stories",
    label: "القصص",
    table: "akp_stories",
    aliases: ["story", "qisas"],
  },
  permanent_committee_fatwas: {
    type: "permanent_committee_fatwas",
    label: "فتاوى اللجنة الدائمة",
    table: "permanent_committee_fatwas",
    aliases: ["permanent_committee_fatwa", "pc_fatwa", "lajna-daima"],
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
