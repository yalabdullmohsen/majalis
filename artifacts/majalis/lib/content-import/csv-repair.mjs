/**
 * Repair CSV rows mis-parsed when semicolon-delimited files are split on commas only.
 * Common when an older client bundle or Excel export uses `;` but the parser uses `,`.
 */

import { detectCsvDelimiter, splitCsvLine } from "./csv-parse.mjs";

function req(row, field) {
  const v = row?.[field];
  if (v == null) return false;
  if (typeof v === "string" && !v.trim()) return false;
  return true;
}

const BENEFITS_TEXT_ALIASES = ["text", "faidah", "fawaid", "benefit", "content", "body", "description", "summary", "النص", "الفائدة", "فائدة"];

function hasBenefitsText(row) {
  if (req(row, "text")) return true;
  return BENEFITS_TEXT_ALIASES.some((k) => k !== "text" && req(row, k));
}

function hasAdhkarText(row) {
  return req(row, "text");
}

/**
 * Re-parse a row stored as a single column whose header line contains `;`.
 * @param {Record<string, unknown>} row
 */
export function repairSemicolonSingleColumnRow(row) {
  const keys = Object.keys(row || {});
  if (keys.length !== 1) return null;

  const headerLine = keys[0];
  if (!headerLine.includes(";") && !headerLine.includes("\t")) return null;

  const delimiter = detectCsvDelimiter(headerLine);
  if (delimiter === ",") return null;

  const headers = splitCsvLine(headerLine, delimiter);
  const cells = splitCsvLine(String(row[headerLine] ?? ""), delimiter);
  /** @type {Record<string, string>} */
  const fixed = {};
  headers.forEach((h, idx) => {
    fixed[h.trim()] = (cells[idx] ?? "").trim();
  });
  return fixed;
}

/**
 * @param {string} type
 * @param {Record<string, unknown>} row
 */
export function repairMisParsedCsvRow(type, row) {
  if (!row || typeof row !== "object") return row;

  const hasText =
    type === "benefits" ? hasBenefitsText(row) : type === "adhkar" ? hasAdhkarText(row) : req(row, "text");
  if (hasText) return row;

  const fixed = repairSemicolonSingleColumnRow(row);
  return fixed || row;
}

/**
 * @param {string} type
 * @param {Record<string, unknown>} row
 */
export function describeMissingColumns(type, row) {
  const keys = Object.keys(row || {});
  if (type === "benefits") {
    return `الأعمدة المستلمة: [${keys.join(", ") || "فارغ"}] — المطلوب: text (أو faidah/fawaid/content)`;
  }
  if (type === "adhkar") {
    return `الأعمدة المستلمة: [${keys.join(", ") || "فارغ"}] — المطلوب: text, category, source, count|repeat_count`;
  }
  return `الأعمدة المستلمة: [${keys.join(", ") || "فارغ"}]`;
}
