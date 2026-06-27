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
  rulings: {
    label: "حكم",
    required: ["title", "body", "category"],
  },
  categories: {
    label: "تصنيف",
    required: ["name", "slug"],
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

  if (type === "questions") {
    const text = `${row.question || ""} ${row.answer || ""}`;
    const cat = String(row.category_slug || row.category || row.category_name || "").toLowerCase();
    const prophetRe =
      /(?:من (?:أول|ال)?(?:رسل|نبي|أنبياء)|نوح|إبراهيم|موسى|عيسى|قصص? (?:الأنبياء|المرسلين)|عليه(?:ه)?\s*السلام)/i;
    if (prophetRe.test(text) && (cat.includes("aqeedah") || cat.includes("عقيدة"))) {
      errors.push(`السطر ${line}: سؤال عن الأنبياء لا ينتمي لتصنيف العقيدة — استخدم anbiya/الأنبياء`);
    }
  }

  return { ok: errors.length === 0, errors };
}

const MAX_FIELD_LENGTH = 50_000;

/**
 * File-level validation: empty rows, long text, row count.
 * @param {string} type
 * @param {Record<string, unknown>[]} rows
 */
export function validateFileRows(type, rows) {
  const errors = [];
  let validCount = 0;
  let invalidCount = 0;

  if (rows.length === 0) {
    errors.push("الملف لا يحتوي على صفوف بيانات");
    return { ok: false, errors, validCount: 0, invalidCount: 0 };
  }

  rows.forEach((row, index) => {
    const line = index + 1;
    let rowInvalid = false;

    for (const [k, v] of Object.entries(row)) {
      if (typeof v === "string" && v.length > MAX_FIELD_LENGTH) {
        errors.push(`السطر ${line}: الحقل «${k}» أطول من الحد المسموح (${MAX_FIELD_LENGTH})`);
        rowInvalid = true;
      }
    }

    const emptyRequired = Object.values(row).every((v) => v == null || String(v).trim() === "");
    if (emptyRequired) {
      errors.push(`السطر ${line}: صف فارغ`);
      rowInvalid = true;
    }

    const result = validateRow(type, row, index);
    if (!result.ok) {
      errors.push(...result.errors.slice(0, 3));
      rowInvalid = true;
    }

    if (rowInvalid) invalidCount++;
    else validCount++;
  });

  return { ok: errors.length === 0, errors: errors.slice(0, 200), validCount, invalidCount };
}
