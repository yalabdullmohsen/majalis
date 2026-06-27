import { readFileSync } from "node:fs";

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
 * Parse CSV text entirely in memory (Vercel-safe).
 * @param {string} content
 */
export function parseCsvString(content) {
  const lines = String(content).replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
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

/**
 * Parse JSON array or single object from string.
 * @param {string} content
 */
export function parseJsonString(content) {
  const parsed = JSON.parse(String(content).trim());
  return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * Parse in-memory file content (for API uploads).
 * @param {string} content
 * @param {string} filename
 */
export function parseContentString(content, filename = "upload.json") {
  const lower = String(filename).toLowerCase();
  if (lower.endsWith(".csv")) return parseCsvString(content);
  return parseJsonString(content);
}

/** CLI-only: reads from local filesystem. */
export function parseJsonFile(filePath) {
  return parseJsonString(readFileSync(filePath, "utf8"));
}

/** CLI-only: reads from local filesystem. */
export function parseCsvFile(filePath) {
  return parseCsvString(readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

/** CLI-only */
export function parseContentFile(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".csv")) return parseCsvFile(filePath);
  return parseJsonFile(filePath);
}
