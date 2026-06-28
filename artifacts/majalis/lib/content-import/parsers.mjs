import { readFileSync } from "node:fs";
export { parseCsvString } from "./csv-parse.mjs";
import { parseUniversalCsv, parseUniversalFile } from "./universal-csv-parser.mjs";

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
  return parseUniversalFile(content, filename).rows;
}

/** CLI-only: reads from local filesystem. */
export function parseJsonFile(filePath) {
  return parseJsonString(readFileSync(filePath, "utf8"));
}

/** CLI-only: reads from local filesystem. */
export function parseCsvFile(filePath) {
  return parseUniversalCsv(readFileSync(filePath)).rows;
}

/** CLI-only */
export function parseContentFile(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt")) {
    return parseCsvFile(filePath);
  }
  return parseJsonFile(filePath);
}

export { parseUniversalCsv, parseUniversalFile };
