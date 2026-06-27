import { createHash } from "node:crypto";

export function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function hashKey(parts) {
  const joined = parts.map(normalizeKey).join("|");
  return createHash("sha1").update(joined).digest("hex").slice(0, 16);
}

/**
 * @param {string} type
 * @param {Record<string, unknown>} row
 */
export function dedupeKeyForRow(type, row) {
  switch (type) {
    case "lessons":
    case "courses":
      return hashKey([
        row.external_key,
        row.title,
        row.sheikh_name || row.speaker_name,
        row.mosque,
        row.day_of_week,
        row.lesson_time || row.schedule,
      ]);
    case "sheikhs":
      return hashKey([row.name]);
    case "books":
    case "articles":
      return hashKey([row.title, row.external_url || row.file_url]);
    case "questions":
      return hashKey([row.question]);
    case "benefits":
      return hashKey([row.text]);
    case "adhkar":
      return hashKey([row.text, row.category || row.categoryId || row.category_id]);
    case "rulings":
      return hashKey([row.external_key || row.title, row.category]);
    default:
      return hashKey([JSON.stringify(row)]);
  }
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} type
 */
export function dedupeRows(rows, type) {
  const seen = new Set();
  const unique = [];
  const duplicates = [];
  for (const row of rows) {
    const key = dedupeKeyForRow(type, row);
    if (seen.has(key)) {
      duplicates.push({ row, key });
      continue;
    }
    seen.add(key);
    unique.push(row);
  }
  return { unique, duplicates };
}
