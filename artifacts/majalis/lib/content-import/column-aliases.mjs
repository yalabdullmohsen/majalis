/**
 * Column alias system — maps CSV headers to canonical schema fields per content type.
 */

/** @type {Record<string, Record<string, string[]>>} */
export const FIELD_ALIASES = {
  benefits: {
    text: ["text", "benefit", "body", "content", "description", "summary", "النص", "الفائدة", "فائدة", "المحتوى"],
    author_name: ["author_name", "author", "source", "المصدر", "المؤلف"],
    status: ["status", "الحالة"],
  },
  adhkar: {
    text: ["text", "dhikr", "ذكر", "الذكر", "النص"],
    category: ["category", "categoryId", "category_id", "التصنيف", "الفئة"],
    count: ["count", "repeat_count", "التكرار", "عدد"],
    source: ["source", "source_name", "المصدر"],
    narrator: ["narrator", "الراوي"],
    grade: ["grade", "الدرجة"],
    reference: ["reference", "المرجع"],
  },
  questions: {
    question: ["question", "السؤال", "quiz", "title", "q"],
    answer: ["answer", "الجواب", "الإجابة", "a"],
    source: ["source", "reference", "المصدر", "المرجع"],
    category: ["category", "category_name", "category_id", "category_slug", "التصنيف"],
    ruling_type: ["ruling_type", "نوع_الحكم"],
    confidence: ["confidence", "الثقة"],
  },
  hadith: {
    text: ["text", "hadith", "matn", "المتن", "الحديث", "body"],
    narrator: ["narrator", "rawi", "الراوي"],
    source: ["source", "book", "المصدر", "الكتاب"],
    grade: ["grade", "الدرجة", "الحكم"],
    reference: ["reference", "ref", "المرجع"],
  },
  stories: {
    title: ["title", "name", "العنوان", "الاسم"],
    summary: ["summary", "description", "body", "content", "الملخص", "المحتوى"],
    category: ["category", "type", "التصنيف"],
    source: ["source", "reference", "المصدر"],
  },
  lessons: {
    title: ["title", "العنوان"],
    description: ["description", "desc", "الوصف"],
    category: ["category", "التصنيف"],
    source_url: ["source_url", "url", "website_url", "site_url", "الرابط"],
    sheikh_name: ["sheikh_name", "speaker_name", "sheikh", "الشيخ"],
    mosque: ["mosque", "location", "المسجد", "المكان"],
    city: ["city", "governorate", "المدينة"],
    day_of_week: ["day_of_week", "day", "اليوم"],
    lesson_time: ["lesson_time", "time", "الوقت"],
  },
  sheikhs: {
    name: ["name", "sheikh_name", "الاسم", "الشيخ"],
    bio: ["bio", "biography", "السيرة"],
    city: ["city", "المدينة"],
  },
  books: {
    title: ["title", "العنوان"],
    category: ["category", "التصنيف"],
    description: ["description", "الوصف"],
    external_url: ["external_url", "url", "source_url"],
  },
  articles: {
    title: ["title", "العنوان"],
    description: ["description", "summary", "الوصف"],
    category: ["category", "التصنيف"],
    source_url: ["source_url", "url", "external_url"],
  },
  courses: {
    title: ["title", "العنوان"],
    description: ["description", "الوصف"],
    category: ["category", "التصنيف"],
    source_url: ["source_url", "url"],
    sheikh_name: ["sheikh_name", "speaker_name"],
  },
  rulings: {
    title: ["title", "العنوان"],
    category: ["category", "التصنيف"],
    body: ["body", "summary", "text", "المحتوى"],
    summary: ["summary", "الملخص"],
  },
};

/**
 * Normalize header key for alias lookup.
 * @param {string} key
 */
function normKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * Build reverse map: alias -> canonical field
 * @param {string} type
 */
export function getAliasMap(type) {
  const fields = FIELD_ALIASES[type] || {};
  /** @type {Record<string, string>} */
  const map = {};
  for (const [canonical, aliases] of Object.entries(fields)) {
    map[normKey(canonical)] = canonical;
    for (const alias of aliases) {
      map[normKey(alias)] = canonical;
    }
  }
  return map;
}

/**
 * Apply column aliases to a raw CSV row.
 * @param {string} type
 * @param {Record<string, unknown>} row
 */
export function applyColumnAliases(type, row) {
  const aliasMap = getAliasMap(type);
  /** @type {Record<string, unknown>} */
  const out = {};

  for (const [key, value] of Object.entries(row)) {
    const canonical = aliasMap[normKey(key)] || key.trim();
    if (out[canonical] == null || out[canonical] === "") {
      out[canonical] = value;
    }
  }

  return out;
}

/**
 * Map detected CSV headers to canonical fields.
 * @param {string} type
 * @param {string[]} headers
 */
export function mapDetectedColumns(type, headers) {
  const aliasMap = getAliasMap(type);
  return headers.map((h) => ({
    original: h,
    canonical: aliasMap[normKey(h)] || null,
    recognized: Boolean(aliasMap[normKey(h)]),
  }));
}

/**
 * List missing required fields based on schema + detected columns.
 * @param {string} type
 * @param {string[]} headers
 * @param {import('./schema-loader.mjs').ContentSchema} schema
 */
export function findMissingRequiredFields(type, headers, schema) {
  if (!schema?.fields) return [];
  const aliasMap = getAliasMap(type);
  const present = new Set(headers.map((h) => aliasMap[normKey(h)] || normKey(h)));

  const missing = [];
  for (const [field, def] of Object.entries(schema.fields)) {
    if (def.required && !present.has(field)) {
      missing.push(field);
    }
  }
  for (const group of schema.oneOf || []) {
    if (!group.some((f) => present.has(f))) {
      missing.push(group.join(" | "));
    }
  }
  return missing;
}
