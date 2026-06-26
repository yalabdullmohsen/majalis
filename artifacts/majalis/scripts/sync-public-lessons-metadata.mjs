/**
 * Merges verified public lesson metadata (no copyrighted audio/video) into import JSON.
 * Sources: drooss_kw public announcements, official sheikh pages, verified Kuwait listings.
 *
 * Usage: node scripts/sync-public-lessons-metadata.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const importDir = join(root, "data", "import");
const verifiedPath = join(importDir, "04-verified-public-lessons.json");
const kuwaitPath = join(importDir, "02-kuwait-lessons.json");
const outPath = join(importDir, "05-merged-verified-lessons.json");

function slugify(title, sheikh) {
  const base = `${title}-${sheikh}`.replace(/\s+/g, "-").slice(0, 80);
  return base.replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "").toLowerCase();
}

function dedupeKey(row) {
  return [row.title, row.sheikh_name || row.speaker_name, row.mosque, row.day_of_week, row.lesson_time]
    .map((v) => String(v || "").trim().toLowerCase())
    .join("|");
}

function normalizeRow(row) {
  return {
    title: row.title,
    sheikh_name: row.sheikh_name || row.speaker_name,
    speaker_name: row.speaker_name || row.sheikh_name,
    category: row.category || "أخرى",
    city: row.city || "العاصمة",
    region: row.region || "",
    mosque: row.mosque || "",
    day_of_week: row.day_of_week || "",
    lesson_time: row.lesson_time || "",
    schedule: row.schedule || [row.day_of_week, row.lesson_time].filter(Boolean).join(" — "),
    description: row.description || "",
    source_url: row.source_url || "",
    source_name: row.source_name || "مصدر عام",
    status: row.status || "approved",
    activity_type: row.activity_type || (row.is_course ? "دورة" : "درس"),
    is_course: Boolean(row.is_course),
    external_key: row.external_key || `verified-${slugify(row.title, row.sheikh_name || "")}`,
  };
}

if (!existsSync(importDir)) mkdirSync(importDir, { recursive: true });

const verified = JSON.parse(readFileSync(verifiedPath, "utf8"));
const kuwait = existsSync(kuwaitPath) ? JSON.parse(readFileSync(kuwaitPath, "utf8")) : [];

const seen = new Set(kuwait.map(dedupeKey));
const merged = [...kuwait];

for (const row of verified) {
  const normalized = normalizeRow(row);
  const key = dedupeKey(normalized);
  if (seen.has(key)) continue;
  seen.add(key);
  merged.push(normalized);
}

writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf8");
console.log(`Merged ${merged.length} verified lesson rows → ${outPath}`);
console.log(`Added ${merged.length - kuwait.length} new metadata-only rows from public sources.`);
