/** Per-type validation schemas. Missing required fields → reject row. */

function req(row, field) {
  const v = row[field];
  if (v == null) return false;
  if (typeof v === "string" && !v.trim()) return false;
  return true;
}

function oneOf(row, fields) {
  return fields.some((f) => req(row, f));
}

/** @type {Record<string, { required: string[], oneOf?: string[][], label: string }>} */
export const SCHEMAS = {
  lessons: {
    label: "درس",
    required: ["title", "description", "category", "source_url"],
    oneOf: [["sheikh_name", "speaker_name"], ["date", "day_of_week", "schedule"], ["location", "mosque", "city"]],
  },
  courses: {
    label: "دورة",
    required: ["title", "description", "category", "source_url"],
    oneOf: [["sheikh_name", "speaker_name"], ["location", "mosque", "city"]],
  },
  sheikhs: {
    label: "شيخ",
    required: ["name"],
  },
  books: {
    label: "كتاب",
    required: ["title", "category"],
  },
  questions: {
    label: "سؤال",
    required: ["question", "answer", "source"],
    oneOf: [["category", "category_name", "category_id"]],
  },
  adhkar: {
    label: "ذكر",
    required: ["text", "category", "count", "source"],
  },
  quran_surahs: {
    label: "سورة",
    required: ["number", "name", "ayahs"],
  },
  quran_topics: {
    label: "موضوع قرآني",
    required: ["title", "summary", "category"],
  },
  articles: {
    label: "مقال",
    required: ["title", "description", "category", "source_url"],
  },
  benefits: {
    label: "فائدة",
    required: ["text"],
  },
};

/**
 * @param {string} type
 * @param {Record<string, unknown>} row
 * @param {number} index
 */
export function validateRow(type, row, index) {
  const schema = SCHEMAS[type];
  if (!schema) return { ok: false, errors: [`نوع غير معروف: ${type}`] };

  const errors = [];
  const line = index + 1;

  for (const field of schema.required) {
    if (!req(row, field)) {
      errors.push(`السطر ${line}: الحقل المطلوب «${field}» ناقص`);
    }
  }

  if (schema.oneOf?.length) {
    for (const group of schema.oneOf) {
      if (!oneOf(row, group)) {
        errors.push(`السطر ${line}: يلزم أحد الحقول: ${group.join(" | ")}`);
      }
    }
  }

  if (type === "questions" && req(row, "confidence")) {
    const c = Number(row.confidence);
    if (Number.isNaN(c) || c < 0 || c > 100) {
      errors.push(`السطر ${line}: confidence يجب أن يكون بين 0 و 100`);
    }
  }

  if (type === "adhkar" && row.count != null) {
    const c = Number(row.count);
    if (Number.isNaN(c) || c < 1) {
      errors.push(`السطر ${line}: count يجب أن يكون رقمًا موجبًا`);
    }
  }

  return { ok: errors.length === 0, errors };
}
