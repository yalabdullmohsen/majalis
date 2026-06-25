/**
 * Converts data/import/02-kuwait-lessons.json → CSV for Supabase public.lessons import.
 * Run: node scripts/json-to-lessons-csv.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const jsonPath = join(root, "data", "import", "02-kuwait-lessons.json");
const csvPath = join(root, "data", "import", "02-kuwait-lessons.csv");


const EXPECTED_TITLES = [
  "تفسير سورة النحل",
  "قراءة كتاب صحيح مسلم",
  "شرح كتاب تلخيص مختصر المقنع",
  "الدورة العلمية التأصيلية — بلوغ المرام من أدلة الأحكام",
  "الدورة العلمية التأصيلية — القواعد المثلى في صفات الله وأسمائه الحسنى",
  "الدورة العلمية التأصيلية — قراءة في كتاب دعوى تعارض السنة النبوية مع العلم التجريبي",
  "قراءة كتب متنوعة والتفسير الواضح",
  "شرح كتاب الصلاة من إعانة الطالب",
];

/** Matches lessons-seed external_key order (same source data, no extra rows). */
const EXTERNAL_KEYS = [
  "kw-othman-tafsir-nahl-0",
  "kw-othman-sahih-muslim-0",
  "kw-othman-talkhis-mukhtasar-almuqni-0",
  "kw-rashed-fundamental-course-0",
  "kw-rashed-fundamental-course-1",
  "kw-rashed-fundamental-course-2",
  "kw-mansour-altafsir-alwadih-0",
  "kw-osama-shatti-prayer-book-0",
];

const CSV_COLUMNS = [
  "title",
  "speaker_name",
  "mosque",
  "city",
  "region",
  "category",
  "audience",
  "delivery",
  "schedule",
  "lesson_time",
  "description",
  "status",
  "day_of_week",
  "external_key",
  "is_recurring",
  "has_women_place",
  "activity_type",
  "is_course",
  "course_id",
  "session_count",
  "linked_titles",
  "keywords",
  "start_date",
];

function normalizeRegion(region) {
  return String(region || "")
    .replace(/^منطقة\s+/u, "")
    .trim();
}

function dedupeKey(row) {
  return [row.title, row.mosque, row.day_of_week].join("|");
}

function escapeCsv(value) {
  if (value == null || value === "") return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function pgTextArray(items) {
  if (!items?.length) return "";
  const inner = items.map((item) => `"${String(item).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
  return `{${inner}}`;
}

function extractStartDate(description) {
  const match = String(description || "").match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (!match) return "";
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function rowToCsvRecord(row, externalKey, courseLinkedTitles) {
  const isCourse = String(row.title || "").includes("الدورة العلمية التأصيلية");
  const hasWomen = /نساء/u.test(String(row.description || ""));
  const coursePrefix = isCourse ? String(row.title).split(" — ")[0]?.trim() : "";

  return {
    title: row.title,
    speaker_name: row.speaker_name || row.sheikh_name,
    mosque: row.mosque,
    city: row.city,
    region: normalizeRegion(row.region),
    category: row.category,
    audience: row.audience,
    delivery: row.delivery,
    schedule: row.schedule,
    lesson_time: row.lesson_time,
    description: row.description,
    status: row.status || "approved",
    day_of_week: row.day_of_week,
    external_key: externalKey,
    is_recurring: "true",
    has_women_place: hasWomen ? "true" : "false",
    activity_type: isCourse ? "دورة" : "درس",
    is_course: isCourse ? "true" : "false",
    course_id: isCourse ? coursePrefix : "",
    session_count: isCourse ? String(courseLinkedTitles.length) : "",
    linked_titles: isCourse ? pgTextArray(courseLinkedTitles) : "",
    keywords: row.category ? pgTextArray([row.category]) : "",
    start_date: extractStartDate(row.description),
  };
}

const raw = JSON.parse(readFileSync(jsonPath, "utf8"));
if (!Array.isArray(raw)) throw new Error("JSON root must be an array");

const COURSE_LINKED_TITLES = raw
  .filter((row) => String(row.title || "").includes("الدورة العلمية التأصيلية"))
  .map((row) => String(row.title).split(" — ")[1]?.trim())
  .filter(Boolean);

for (let i = 0; i < raw.length; i += 1) {
  if (raw[i].title !== EXPECTED_TITLES[i]) {
    throw new Error(`Row ${i + 1} title mismatch: expected "${EXPECTED_TITLES[i]}", got "${raw[i].title}"`);
  }
}

const seen = new Set();
const rows = [];

for (let i = 0; i < raw.length; i += 1) {
  const item = raw[i];
  const key = dedupeKey(item);
  if (seen.has(key)) {
    console.warn(`Skipped duplicate: ${key}`);
    continue;
  }
  seen.add(key);

  const externalKey = EXTERNAL_KEYS[i];
  if (!externalKey) throw new Error(`No external_key mapping for row ${i + 1}`);

  rows.push(rowToCsvRecord(item, externalKey, COURSE_LINKED_TITLES));
}

if (rows.length !== EXTERNAL_KEYS.length) {
  throw new Error(`Expected ${EXTERNAL_KEYS.length} unique lessons, got ${rows.length}`);
}

const header = CSV_COLUMNS.join(",");
const body = rows
  .map((record) => CSV_COLUMNS.map((col) => escapeCsv(record[col])).join(","))
  .join("\n");

writeFileSync(csvPath, `${header}\n${body}\n`, "utf8");

console.log(`Wrote ${csvPath}`);
console.log(`Lessons converted: ${rows.length}`);
console.log(`Columns: ${CSV_COLUMNS.join(", ")}`);
