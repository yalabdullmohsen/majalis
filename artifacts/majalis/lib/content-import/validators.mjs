/** Per-type validation schemas. Missing required fields → reject row. */

import { repairMisParsedCsvRow, describeMissingColumns } from "./csv-repair.mjs";
import { isQuizLikeFawaidText } from "./fawaid-quality.mjs";

export const MAX_VALIDATION_ERRORS = 200;

function req(row, field) {
  const v = row[field];
  if (v == null) return false;
  if (typeof v === "string" && !v.trim()) return false;
  return true;
}

function oneOf(row, fields) {
  return fields.some((f) => req(row, f));
}

const BENEFITS_TEXT_ALIASES = [
  "text",
  "faidah",
  "fawaid",
  "benefit",
  "content",
  "body",
  "description",
  "summary",
  "النص",
  "الفائدة",
  "فائدة",
];

/** Normalize benefits/fawaid row aliases before validation (common CSV export headers). */
export function normalizeBenefitsRow(row) {
  const out = { ...row };
  if (!req(out, "text")) {
    for (const key of BENEFITS_TEXT_ALIASES) {
      if (key !== "text" && req(out, key)) {
        out.text = out[key];
        break;
      }
    }
  }
  if (!req(out, "author_name") && req(out, "author")) out.author_name = out.author;
  if (!req(out, "author_name") && req(out, "source")) out.author_name = out.source;
  if (!req(out, "author_name") && req(out, "المصدر")) out.author_name = out["المصدر"];
  return out;
}

/** Normalize adhkar row aliases before validation (repeat_count → count, source_name → source). */
export function normalizeAdhkarRow(row) {
  const out = { ...row };
  if (out.count == null && out.repeat_count != null) out.count = out.repeat_count;
  if (!req(out, "source") && req(out, "source_name")) out.source = out.source_name;
  if (!req(out, "category") && req(out, "categoryId")) out.category = out.categoryId;
  if (!req(out, "category") && req(out, "category_id")) out.category = out.category_id;
  return out;
}

function adhkarCountValue(row) {
  const raw = row.count ?? row.repeat_count;
  if (raw == null || raw === "") return null;
  return Number(raw);
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
    required: ["text", "category", "source"],
    oneOf: [["count", "repeat_count"]],
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
    label: "فتوى",
    required: ["title", "category"],
    oneOf: [["body", "summary"]],
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

  const repaired = type === "benefits" || type === "adhkar" ? repairMisParsedCsvRow(type, row) : row;
  const normalized =
    type === "adhkar" ? normalizeAdhkarRow(repaired) : type === "benefits" ? normalizeBenefitsRow(repaired) : repaired;
  const errors = [];
  const line = index + 1;

  for (const field of schema.required) {
    if (!req(normalized, field)) {
      errors.push(`السطر ${line}: الحقل المطلوب «${field}» ناقص`);
    }
  }

  if (errors.length && (type === "benefits" || type === "adhkar") && index === 0) {
    errors.push(describeMissingColumns(type, row));
  }

  if (schema.oneOf?.length) {
    for (const group of schema.oneOf) {
      if (!oneOf(normalized, group)) {
        errors.push(`السطر ${line}: يلزم أحد الحقول: ${group.join(" | ")}`);
      }
    }
  }

  if (type === "questions" && req(normalized, "confidence")) {
    const c = Number(normalized.confidence);
    if (Number.isNaN(c) || c < 0 || c > 100) {
      errors.push(`السطر ${line}: confidence يجب أن يكون بين 0 و 100`);
    }
  }

  if (type === "adhkar") {
    const c = adhkarCountValue(normalized);
    if (c == null || Number.isNaN(c) || c < 1) {
      errors.push(`السطر ${line}: count (أو repeat_count) يجب أن يكون رقمًا موجبًا`);
    }
  }

  if (type === "questions") {
    const text = `${normalized.question || ""} ${normalized.answer || ""}`;
    const cat = String(normalized.category_slug || normalized.category || normalized.category_name || "").toLowerCase();
    const prophetRe =
      /(?:من (?:أول|ال)?(?:رسل|نبي|أنبياء)|نوح|إبراهيم|موسى|عيسى|قصص? (?:الأنبياء|المرسلين)|عليه(?:ه)?\s*السلام)/i;
    if (prophetRe.test(text) && (cat.includes("aqeedah") || cat.includes("عقيدة"))) {
      errors.push(`السطر ${line}: سؤال عن الأنبياء لا ينتمي لتصنيف العقيدة — استخدم anbiya/الأنبياء`);
    }
  }

  if (type === "benefits" && req(normalized, "text") && isQuizLikeFawaidText(normalized.text)) {
    errors.push(`السطر ${line}: النص يشبه سؤالاً/اختباراً وليس فائدة — استخدم questions أو qa`);
  }

  return { ok: errors.length === 0, errors, row: normalized };
}
