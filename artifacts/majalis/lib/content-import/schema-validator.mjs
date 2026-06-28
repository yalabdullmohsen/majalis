/**
 * Schema-based validation for Universal Import Engine.
 */

import { applyColumnAliases } from "./column-aliases.mjs";
import { getContentSchema } from "./schema-loader.mjs";
import { formatValidationError } from "./error-reporter.mjs";
import { repairMisParsedCsvRow } from "./csv-repair.mjs";
import { normalizeBenefitsRow, normalizeAdhkarRow } from "./validators.mjs";

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

export function normalizeRow(type, row) {
  let out = applyColumnAliases(type, row);
  if (type === "benefits" || type === "adhkar") {
    out = repairMisParsedCsvRow(type, out) || out;
  }
  if (type === "benefits") out = normalizeBenefitsRow(out);
  if (type === "adhkar") out = normalizeAdhkarRow(out);
  return out;
}

export function validateRowWithSchema(type, row, index) {
  const schema = getContentSchema(type);
  if (!schema) {
    return {
      ok: false,
      errors: [formatValidationError({ line: index + 1, field: "type", reason: `نوع غير معروف: ${type}`, suggestion: "اختر نوع محتوى مدعوماً" }).message],
      structuredErrors: [],
    };
  }

  const normalized = normalizeRow(type, row);
  const structuredErrors = [];
  const line = index + 1;

  for (const [field, def] of Object.entries(schema.fields || {})) {
    if (def.required && !req(normalized, field)) {
      structuredErrors.push(
        formatValidationError({
          line,
          field,
          fieldLabel: def.label || field,
          value: normalized[field],
          reason: "القيمة فارغة أو ناقصة",
          suggestion: getFieldSuggestion(type, field),
        }),
      );
    }
  }

  for (const group of schema.oneOf || []) {
    if (!oneOf(normalized, group)) {
      structuredErrors.push(
        formatValidationError({
          line,
          field: group.join(" | "),
          reason: "يلزم أحد الحقول التالية",
          suggestion: `أضف أحد الأعمدة: ${group.join("، ")}`,
        }),
      );
    }
  }

  if (type === "adhkar") {
    const raw = normalized.count ?? normalized.repeat_count;
    const c = raw != null && raw !== "" ? Number(raw) : NaN;
    if (Number.isNaN(c) || c < 1) {
      structuredErrors.push(
        formatValidationError({
          line,
          field: "count",
          fieldLabel: "عدد التكرار",
          value: raw,
          reason: "يجب أن يكون رقماً موجباً",
          suggestion: "أضف count أو repeat_count بقيمة ≥ 1",
        }),
      );
    }
  }

  const errors = structuredErrors.map((e) => e.message);
  return { ok: structuredErrors.length === 0, errors, structuredErrors, row: normalized };
}

function getFieldSuggestion(type, field) {
  const hints = {
    benefits: { text: "أضف عمود text أو الفائدة أو benefit يحتوي نص الفائدة" },
    adhkar: {
      text: "أضف عمود text أو ذكر يحتوي نص الذكر",
      category: "أضف عمود category أو التصنيف",
      source: "أضف عمود source أو المصدر",
    },
    questions: {
      question: "أضف عمود question أو السؤال",
      answer: "أضف عمود answer أو الجواب",
    },
  };
  return hints[type]?.[field] || `أضف قيمة للحقل «${field}» ثم أعد المحاولة`;
}

export function validateAllRowsWithSchema(type, rows) {
  const validationErrors = [];
  const structuredErrors = [];
  const validRows = [];

  for (let index = 0; index < rows.length; index++) {
    const result = validateRowWithSchema(type, rows[index], index);
    if (result.ok) {
      validRows.push(result.row ?? rows[index]);
    } else {
      for (const err of result.errors) {
        if (validationErrors.length < MAX_VALIDATION_ERRORS) validationErrors.push(err);
      }
      for (const err of result.structuredErrors || []) {
        if (structuredErrors.length < MAX_VALIDATION_ERRORS) structuredErrors.push(err);
      }
    }
  }

  return { validRows, validationErrors, structuredErrors, allValid: validationErrors.length === 0 };
}
