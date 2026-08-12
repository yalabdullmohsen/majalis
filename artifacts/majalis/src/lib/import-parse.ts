/**
 * Client-side CSV/JSON parsing for admin import (mirrors server parsers.mjs).
 */

import { detectCsvDelimiter, splitCsvLine } from "../../lib/content-import/csv-parse.mjs";
import { repairSemicolonSingleColumnRow } from "../../lib/content-import/csv-repair.mjs";

export function parseCsvString(content: string): Record<string, unknown>[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter);
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
    if (cells.every((c) => !c.trim())) continue;
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (cells[idx] ?? "").trim();
    });
    rows.push(repairSemicolonSingleColumnRow(row) || row);
  }
  return rows;
}

export function parseJsonString(content: string): Record<string, unknown>[] {
  const parsed = JSON.parse(content.trim()) as unknown;
  return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [parsed as Record<string, unknown>];
}

export function parseImportFile(content: string, filename: string): Record<string, unknown>[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return parseCsvString(content);
  return parseJsonString(content);
}

export const UPLOAD_BATCH_SIZE = 2000;

export function chunkRows<T>(rows: T[], size = UPLOAD_BATCH_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

type ImportErrorBody = {
  error?: string;
  detail?: string;
  code?: string;
  userMessageAr?: string;
  message?: string;
  validationErrors?: string[];
  importErrors?: string[];
  validation_errors?: string[];
  import_errors?: string[];
  report?: {
    validationErrors?: string[];
    importErrors?: string[];
    validation_errors?: string[];
    import_errors?: string[];
  };
};

/** Surface the real server error (never a generic fallback when detail exists). */
export function formatImportApiError(res: Response, json: unknown, fallback: string): string {
  const body = (json && typeof json === "object" ? json : {}) as ImportErrorBody;
  const report = body.report && typeof body.report === "object" ? body.report : {};

  const validationMsg =
    body.validationErrors?.[0] ||
    report.validationErrors?.[0] ||
    body.validation_errors?.[0] ||
    report.validation_errors?.[0] ||
    null;
  const importMsg =
    body.importErrors?.[0] ||
    report.importErrors?.[0] ||
    body.import_errors?.[0] ||
    report.import_errors?.[0] ||
    null;

  const detail =
    body.userMessageAr ||
    body.error ||
    body.detail ||
    validationMsg ||
    importMsg ||
    body.message ||
    null;

  if (detail) {
    const prefix = !res.ok ? `[HTTP ${res.status}] ` : "";
    const codeSuffix = body.code ? ` (${body.code})` : "";
    return `${prefix}${detail}${codeSuffix}`;
  }

  if (!res.ok) {
    return `[HTTP ${res.status}] ${fallback}`;
  }

  return fallback;
}
