/**
 * جذور كوربوسات الأقسام — مصدر واحد لبوابات تدقيق المحتوى الثلاث.
 * لا تُدرِج هنا مجلدات مولَّدة (dist / seo-prerender / node_modules).
 */
export const CONTENT_CORPORA_ROOTS = [
  "content",
  "public/data",
  "src/lib",
  "src/data",
  "src/views",
  "src/pages",
  "src/config",
] as const;

export const CONTENT_CORPORA_EXTENSIONS = new Set([
  ".json",
  ".jsonl",
  ".ts",
  ".tsx",
  ".mjs",
]);

/** مجلدات/ملفات تُستثنى من المسح الحرفي (اختبارات، تقارير، نُسخ احتياطية). */
export const CONTENT_CORPORA_SKIP_PARTS = new Set([
  "node_modules",
  "dist",
  "seo-prerender",
  "__tests__",
  ".backup",
  "backup",
  "deleted-",
  "needs-post-review",
]);

export const MAX_CORPUS_FILE_BYTES = 12_000_000;

/** حقول نصية تُدقَّق حرفًا حرفًا في JSON (عمق المحتوى). */
export const AUDITED_TEXT_FIELDS = new Set([
  "title",
  "name",
  "nameAr",
  "arabicName",
  "label",
  "subtitle",
  "description",
  "summary",
  "body",
  "text",
  "content",
  "content_ar",
  "full_content",
  "definition",
  "explanation",
  "evidence",
  "bio",
  "briefBio",
  "meaning",
  "benefit",
  "question",
  "answer",
  "short_answer",
  "narrator",
  "source_name",
  "chapter",
  "grade",
]);

/** حد أدنى لطول الحقول الأساسية (حروف بعد trim) — يمنع الفراغ الظاهر. */
export const MIN_FIELD_CHARS: Record<string, number> = {
  title: 2,
  name: 2,
  nameAr: 2,
  arabicName: 2,
  label: 2,
  subtitle: 4,
  description: 20,
  summary: 20,
  // body/text قد تكون أسئلة قصيرة أو متون حديث موجزة — الحد الأدنى يمنع الفراغ لا يفرض مقالات
  body: 8,
  text: 8,
  content: 20,
  content_ar: 20,
  full_content: 40,
  definition: 40,
  explanation: 12,
  evidence: 4,
  bio: 20,
  briefBio: 20,
  meaning: 10,
  benefit: 10,
  question: 8,
  answer: 8,
  short_answer: 8,
};

/** حد أعلى صرامة لمسارات المقالات/المعرفة (لا يُطبَّق على quiz/hadith). */
export const STRICT_BODY_MIN_BY_PATH: Array<{ match: RegExp; field: string; min: number }> = [
  { match: /\/knowledge\/history\//, field: "body", min: 200 },
  { match: /\/quran-people\//, field: "definition", min: 80 },
  { match: /\/stories\//, field: "full_content", min: 80 },
  { match: /content\/fiqh\//, field: "summary", min: 40 },
  { match: /content\/fiqh\//, field: "evidence", min: 20 },
];
