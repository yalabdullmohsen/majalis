import { readFileSync } from "node:fs";
export { parseCsvString } from "./csv-parse.mjs";
import { parseCsvString } from "./csv-parse.mjs";

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
