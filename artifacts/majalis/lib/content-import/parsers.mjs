import { readFileSync } from "node:fs";

/**
 * Parse JSON array or single object.
 * @param {string} filePath
 */
export function parseJsonFile(filePath) {
  const raw = readFileSync(filePath, "utf8").trim();
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * Minimal CSV parser (UTF-8, comma-separated, quoted fields).
 * @param {string} filePath
 */
export function parseCsvFile(filePath) {
  const raw = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    if (cells.every((c) => !c.trim())) continue;
    /** @type {Record<string, string>} */
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (cells[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * @param {string} filePath
 */
export function parseContentFile(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".csv")) return parseCsvFile(filePath);
  return parseJsonFile(filePath);
}
