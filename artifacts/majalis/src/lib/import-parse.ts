/**
 * Client-side CSV/JSON/Excel/ZIP parsing for admin import (mirrors server parsers.mjs).
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

export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<Record<string, unknown>[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

export async function parseZipBuffer(buffer: ArrayBuffer): Promise<{ filename: string; rows: Record<string, unknown>[] }[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const results: { filename: string; rows: Record<string, unknown>[] }[] = [];

  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const lower = name.toLowerCase();
    if (!/\.(csv|json|xlsx|xls)$/i.test(lower)) continue;

    if (/\.xlsx?$/.test(lower)) {
      const buf = await entry.async("arraybuffer");
      const rows = await parseExcelBuffer(buf);
      if (rows.length) results.push({ filename: name, rows });
      continue;
    }

    const text = await entry.async("string");
    const rows = lower.endsWith(".csv") ? parseCsvString(text) : parseJsonString(text);
    if (rows.length) results.push({ filename: name, rows });
  }

  return results;
}

export function parseImportFile(content: string, filename: string): Record<string, unknown>[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return parseCsvString(content);
  return parseJsonString(content);
}

export async function parseImportFileAsync(file: File): Promise<{ rows: Record<string, unknown>[]; zipFiles?: string[] }> {
  const lower = file.name.toLowerCase();

  if (/\.xlsx?$/.test(lower)) {
    const buf = await file.arrayBuffer();
    return { rows: await parseExcelBuffer(buf) };
  }

  if (lower.endsWith(".zip")) {
    const buf = await file.arrayBuffer();
    const parts = await parseZipBuffer(buf);
    if (!parts.length) {
      throw new Error("ملف ZIP لا يحتوي على CSV أو JSON أو Excel صالح");
    }
    const merged = parts.flatMap((p) => p.rows);
    return { rows: merged, zipFiles: parts.map((p) => p.filename) };
  }

  const content = await file.text();
  return { rows: parseImportFile(content, file.name) };
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
