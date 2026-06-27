/** Expected CSV/JSON columns per content type — used for validation & preview. */

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_ROWS = 100_000;
export const PREVIEW_ROWS = 20;
export const BATCH_SIZE = 100;
export const MAX_RETRIES = 3;

/** @type {Record<string, { required: string[], optional?: string[], label: string }>} */
export const COLUMN_SCHEMAS = {
  lessons: {
    label: "الدروس",
    required: ["title", "description", "category", "source_url"],
    optional: ["sheikh_name", "speaker_name", "mosque", "city", "day_of_week", "lesson_time", "schedule", "location", "external_key", "status"],
  },
  courses: {
    label: "الدورات",
    required: ["title", "description", "category", "source_url"],
    optional: ["sheikh_name", "speaker_name", "mosque", "city", "location", "status"],
  },
  sheikhs: {
    label: "المشايخ",
    required: ["name"],
    optional: ["bio", "city", "photo_url", "specialties", "ijazah", "years_experience"],
  },
  books: {
    label: "الكتب",
    required: ["title", "category"],
    optional: ["description", "external_url", "file_url", "type", "status"],
  },
  articles: {
    label: "المقالات",
    required: ["title", "description", "category", "source_url"],
    optional: ["status"],
  },
  questions: {
    label: "الأسئلة",
    required: ["question", "answer", "source"],
    optional: ["category", "category_name", "ruling_type", "evidence", "reference", "confidence", "status"],
  },
  benefits: {
    label: "الفوائد",
    required: ["text"],
    optional: ["author_name", "source", "author", "status"],
  },
  adhkar: {
    label: "الأذكار",
    required: ["text", "category", "count", "source"],
    optional: ["id", "narrator", "grade", "reference", "keywords"],
  },
  quran_surahs: {
    label: "سور القرآن",
    required: ["number", "name", "ayahs"],
    optional: ["englishName", "english_name", "revelation", "summary", "themes"],
  },
  quran_topics: {
    label: "موضوعات/قصص القرآن",
    required: ["title", "summary", "category"],
    optional: ["id", "surahRefs", "keywords"],
  },
  rulings: {
    label: "الأحكام الشرعية",
    required: ["title", "body", "category"],
    optional: ["summary", "subcategory", "keywords", "external_key", "importance_score", "status"],
  },
  categories: {
    label: "التصنيفات",
    required: ["name", "slug"],
    optional: ["description", "sort_order", "icon"],
  },
};

export function expectedColumns(type) {
  const s = COLUMN_SCHEMAS[type];
  if (!s) return { required: [], optional: [], all: [] };
  const all = [...s.required, ...(s.optional || [])];
  return { required: s.required, optional: s.optional || [], all };
}

export function validateColumns(type, headers) {
  const { required, optional, all } = expectedColumns(type);
  const normalized = headers.map((h) => String(h || "").trim()).filter(Boolean);
  const lower = new Set(normalized.map((h) => h.toLowerCase()));
  const missing = required.filter((r) => !lower.has(r.toLowerCase()) && !normalized.includes(r));
  const extra = normalized.filter((h) => !all.some((a) => a.toLowerCase() === h.toLowerCase()));
  return {
    ok: missing.length === 0,
    headers: normalized,
    missing,
    extra,
    required,
    optional,
  };
}
