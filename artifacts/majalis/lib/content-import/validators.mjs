/** Per-type validation — delegates to JSON schema validator. */

import { repairMisParsedCsvRow, describeMissingColumns } from "./csv-repair.mjs";
import { validateRowWithSchema, MAX_VALIDATION_ERRORS } from "./schema-validator.mjs";
import { getContentSchema, schemaToLegacyFormat } from "./schema-loader.mjs";
import { listContentSchemas } from "./schema-loader.mjs";

export { MAX_VALIDATION_ERRORS };

function req(row, field) {
  const v = row[field];
  if (v == null) return false;
  if (typeof v === "string" && !v.trim()) return false;
  return true;
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

/** @type {Record<string, { required: string[], oneOf?: string[][], label: string }>} */
export const SCHEMAS = Object.fromEntries(
  listContentSchemas()
    .map((type) => {
      const legacy = schemaToLegacyFormat(getContentSchema(type));
      return legacy ? [type, legacy] : null;
    })
    .filter(Boolean),
);

/**
 * @param {string} type
 * @param {Record<string, unknown>} row
 * @param {number} index
 */
export function validateRow(type, row, index) {
  const result = validateRowWithSchema(type, row, index);
  const errors = [...result.errors];
  if (errors.length && (type === "benefits" || type === "adhkar") && index === 0) {
    errors.push(describeMissingColumns(type, row));
  }
  return { ok: result.ok, errors, structuredErrors: result.structuredErrors, row: result.row };
}
