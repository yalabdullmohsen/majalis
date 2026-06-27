/**
 * Client-side CSV/JSON parsing for admin import (mirrors server parsers.mjs).
 */

import { detectCsvDelimiter, splitCsvLine } from "../../lib/content-import/csv-parse.mjs";

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
    rows.push(row);
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
