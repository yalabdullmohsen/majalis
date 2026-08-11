#!/usr/bin/env node
/**
 * يبني فهرس بحث موحّد وقت البناء → public/data/search/index.json
 * يغطي أقسام التطبيق كلها (عناوين/مؤلفون/كلمات مفتاحية — بلا نص قرآن).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

const { SCHOLARS } = await import("../src/lib/scholars-data.ts");
const { LIBRARY_CATALOG } = await import("../src/lib/library-catalog.ts");
const { getSurahList } = await import("../src/lib/quran-api.ts");
const { normalizeArabic } = await import("../src/shared/arabic-normalize.ts");
const { ADHKAR_CATEGORIES, getAllAdhkarItems } = await import("../src/lib/adhkar-seed.ts");
const { ARBAEEN_NAWAWI } = await import("../src/lib/arbaeen-nawawi-seed.ts");
const { NATIONS } = await import("../src/lib/nations-seed.ts");
const { getAllSurahStories } = await import("../src/lib/surah-stories.ts");
const { MUSHAF_TAFSIR_EDITIONS } = await import("../src/features/mushaf/tafsir-editions.ts");

/** @typedef {{ id: string, kind: string, titleAr: string, href: string, norm: string, meta?: string }} SearchDoc */

/** @type {SearchDoc[]} */
const docs = [];
const seen = new Set();

/** @param {SearchDoc} d */
function push(d) {
  if (!d.titleAr || seen.has(d.id)) return;
  seen.add(d.id);
  docs.push(d);
}

function pushDoc(id, kind, titleAr, href, parts = [], meta) {
  push({
    id,
    kind,
    titleAr,
    href,
    norm: normalizeArabic([titleAr, ...parts].filter(Boolean).join(" ")),
    meta,
  });
}

// ── علماء ──────────────────────────────────────────────────────────────────
for (const s of SCHOLARS) {
  pushDoc(
    `scholar:${s.id}`,
    "scholar",
    s.name,
    `/scholars/${s.id}`,
    [s.fullName, s.era, ...(s.specialty ?? [])],
    s.era,
  );
}

// ── المكتبة ────────────────────────────────────────────────────────────────
for (const b of LIBRARY_CATALOG) {
  pushDoc(
    `book:${b.id}`,
    "book",
    b.title,
    `/library/${b.id}`,
    [b.author, b.category, ...(b.keywords ?? [])],
    b.author,
  );
}

// ── سور القرآن (أسماء فقط — لا نص آيات) ────────────────────────────────────
for (const s of getSurahList()) {
  pushDoc(
    `surah:${s.number}`,
    "surah",
    `سورة ${s.name}`,
    `/mushaf/${s.number}`,
    [`سورة ${s.name}`, String(s.number), s.name],
    `${s.ayahs} آية`,
  );
}

// ── تفاسير معتمدة ──────────────────────────────────────────────────────────
for (const t of MUSHAF_TAFSIR_EDITIONS) {
  pushDoc(
    `tafsir:${t.id}`,
    "tafsir",
    t.label,
    "/tafsir",
    [t.author, "تفسير", "مختصر", "ميسّر"],
    t.author,
  );
}
pushDoc("tafsir:hub", "tafsir", "علم التفسير", "/tafsir", ["تفسير القرآن", "أصول التفسير"], "قسم");

// ── الأحاديث ───────────────────────────────────────────────────────────────
pushDoc("hadith:hub", "hadith", "الحديث وعلومه", "/hadith", ["صحيح البخاري", "صحيح مسلم", "أحاديث"], "قسم");
pushDoc("hadith:bukhari", "hadith", "صحيح البخاري", "/hadith#bukhari", ["البخاري", "صحيح"], "جمع");
pushDoc("hadith:muslim", "hadith", "صحيح مسلم", "/hadith#muslim", ["مسلم", "صحيح"], "جمع");
for (const h of ARBAEEN_NAWAWI) {
  pushDoc(
    `hadith:nawawi:${h.id}`,
    "hadith",
    h.title,
    "/arbaeen-nawawi",
    [h.source, "الأربعون النووية", "نووي"],
    h.source,
  );
}

// ── الأذكار ────────────────────────────────────────────────────────────────
for (const c of ADHKAR_CATEGORIES) {
  pushDoc(
    `adhkar:cat:${c.id}`,
    "adhkar",
    c.name,
    `/adhkar/${encodeURIComponent(c.id.startsWith("adh-") ? c.id.slice(4) : c.id)}`,
    ["أذكار", c.name],
    "تصنيف",
  );
}
for (const a of getAllAdhkarItems()) {
  const title = (a.text || "").slice(0, 72);
  if (!title) continue;
  pushDoc(
    `adhkar:${a.id}`,
    "adhkar",
    title,
    a.categoryId
      ? `/adhkar/${encodeURIComponent(
          a.categoryId.startsWith("adh-") ? a.categoryId.slice(4) : a.categoryId,
        )}`
      : "/adhkar",
    [a.source, a.categoryId],
    a.source || "ذكر",
  );
}

// ── الأمم السابقة ──────────────────────────────────────────────────────────
for (const n of NATIONS) {
  pushDoc(
    `nation:${n.slug}`,
    "nation",
    n.name,
    `/nations/${n.slug}`,
    [n.prophet?.name, n.punishment?.type, "أمم سابقة"],
    n.prophet?.name,
  );
}

// ── قصص السور ──────────────────────────────────────────────────────────────
for (const s of getAllSurahStories()) {
  pushDoc(
    `story:surah:${s.number}`,
    "story",
    `قصة سورة ${s.name}`,
    `/quran/surah-stories/${s.number}`,
    [s.name, s.namingReason?.slice(0, 80), "قصص السور"],
    "قصة سورة",
  );
}

// ── الدروس (من البذرة) ─────────────────────────────────────────────────────
const lessonsPath = path.join(appRoot, "public/data/lessons/chunk-000.json");
if (fs.existsSync(lessonsPath)) {
  const lessons = JSON.parse(fs.readFileSync(lessonsPath, "utf8"));
  const list = Array.isArray(lessons) ? lessons : lessons.items ?? [];
  for (const L of list) {
    pushDoc(
      `lesson:${L.id}`,
      "lesson",
      L.title,
      `/lessons/${L.id}`,
      [L.speaker_name, L.mosque, L.category, L.city, L.description?.slice(0, 120)],
      [L.speaker_name, L.mosque].filter(Boolean).join(" · ") || "درس",
    );
  }
}

// ── الأسئلة والفتاوى (عناوين فقط) ──────────────────────────────────────────
const qaDir = path.join(appRoot, "public/data/qa");
if (fs.existsSync(qaDir)) {
  for (const file of fs.readdirSync(qaDir)) {
    if (!file.startsWith("seed-cat-") || !file.endsWith(".json")) continue;
    const rows = JSON.parse(fs.readFileSync(path.join(qaDir, file), "utf8"));
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const q = row.question;
      if (!q) continue;
      pushDoc(
        `qa:${row.id}`,
        "qa",
        q,
        `/qa/${row.id}`,
        [row.qa_categories?.name, row.ruling_type, row.answer?.slice(0, 100)],
        row.qa_categories?.name || "فتوى",
      );
    }
  }
}

// ── صفحات التطبيق والإعدادات ───────────────────────────────────────────────
const APP_PAGES = [
  ["app:mushaf", "quran", "المصحف الشريف", "/mushaf", ["قرآن", "قراءة"]],
  ["app:quran-knowledge", "ulum", "القرآن وعلومه", "/quran-knowledge", ["علوم القرآن", "أسباب نزول"]],
  ["app:tafsir", "tafsir", "التفسير", "/tafsir", ["تفسير"]],
  ["app:tajweed", "tajweed", "علم التجويد", "/quran/tajweed", ["تجويد", "أحكام"]],
  ["app:memorization", "hifz", "الحفظ والمراجعة", "/memorization", ["حفظ", "مراجعة", "خطط الحفظ"]],
  ["app:hadith", "hadith", "الحديث", "/hadith", ["سنة"]],
  ["app:fiqh", "fiqh", "الفقه والأحكام", "/fiqh", ["فقه", "أحكام"]],
  ["app:library", "book", "المكتبة", "/library", ["كتب"]],
  ["app:scholars", "scholar", "أعلام الإسلام", "/scholars", ["علماء", "مشايخ"]],
  ["app:seerah", "seerah", "السيرة النبوية", "/seerah", ["سيرة"]],
  ["app:prophets", "prophet", "قصص الأنبياء", "/prophets", ["أنبياء", "ابتلاءات"]],
  ["app:quran-people", "person", "الذين ذكروا في القرآن", "/quran/people", ["أعلام", "شخصيات", "مذكورون", "فرعون", "مريم", "أشخاص القرآن"]],
  ["app:nations", "nation", "الأمم السابقة", "/nations", ["أمم"]],
  ["app:stories", "story", "القصص الإسلامية", "/stories", ["قصص"]],
  ["app:adhkar", "adhkar", "الأذكار والأدعية", "/adhkar", ["أذكار", "أدعية"]],
  ["app:duas-quran", "dua", "أدعية القرآن", "/duas-quran", ["دعاء", "قرآن"]],
  ["app:lessons", "lesson", "الدروس", "/lessons", ["دروس"]],
  ["app:courses", "course", "الدورات العلمية", "/courses", ["دورات"]],
  ["app:glossary", "app", "المصطلحات", "/glossary", ["مصطلحات", "glossary"]],
  ["app:reciters", "app", "القرّاء", "/reciters", ["قراء", "تلاوة"]],
  ["app:prayer", "app", "مواقيت الصلاة", "/prayer-times", ["صلاة", "أذان"]],
  ["app:adhan-settings", "settings", "إعدادات الأذان", "/adhan-settings", ["أذان", "مؤذن"]],
  ["app:settings", "settings", "الإعدادات", "/settings", ["حساب", "تفضيلات"]],
  ["app:notification-settings", "settings", "إعدادات الإشعارات", "/notification-settings", ["إشعارات"]],
  ["app:search", "app", "البحث الشامل", "/search", ["بحث"]],
  ["app:assistant", "app", "المساعد العلمي", "/assistant", ["مساعد"]],
  ["app:quiz", "app", "لعبة سين جيم", "/quiz", ["اختبار"]],
  ["app:ibtillaat", "prophet", "ابتلاءات الأنبياء", "/prophets", ["ابتلاء", "أنبياء"]],
  ["app:tafsir-audio", "tafsir-audio", "التفسير الصوتي", "/tafsir", ["تفسير صوتي", "استماع تفسير"]],
  ["app:quran-hub", "quran", "مركز القرآن", "/quran-hub", ["مركز", "قرآن"]],
];

for (const [id, kind, title, href, parts] of APP_PAGES) {
  pushDoc(id, kind, title, href, parts, "صفحة");
}

// ── الذين ذكروا في القرآن (دفعة الأسماء الصريحة) ─────────────────────────────
try {
  const peoplePath = path.join(appRoot, "public/data/quran-people/people.json");
  const peopleJson = JSON.parse(fs.readFileSync(peoplePath, "utf8"));
  for (const p of peopleJson.people ?? []) {
    if (p.status !== "published") continue;
    pushDoc(
      `person:${p.slug}`,
      "person",
      p.nameAr,
      `/quran/people/${p.slug}`,
      [...(p.aliases ?? []), p.category, "الذين ذكروا في القرآن", "أشخاص القرآن"],
      PERSON_META(p),
    );
  }
} catch (e) {
  console.warn("quran-people index skipped:", e.message);
}

function PERSON_META(p) {
  return `${(p.occurrences ?? []).length} موضع`;
}

// ── كتالوج التفسير الصوتي (إن وُجدت مقاطع مفعّلة) ──────────────────────────
try {
  const tafsirPath = path.join(appRoot, "public/data/tafsir-audio-catalog.json");
  const tafsirJson = JSON.parse(fs.readFileSync(tafsirPath, "utf8"));
  for (const c of tafsirJson.clips ?? []) {
    if (!c.enabled) continue;
    pushDoc(
      `tafsir-audio:${c.id}`,
      "tafsir-audio",
      c.titleAr || c.tafsir_name || "تفسير صوتي",
      `/tafsir`,
      [c.scholarLabelAr, c.scholar, c.tafsir_name, "تفسير صوتي"],
      c.scholarLabelAr,
    );
  }
} catch {
  /* optional */
}

const outDir = path.join(appRoot, "public/data/search");
fs.mkdirSync(outDir, { recursive: true });
const payload = {
  version: 2,
  generatedAt: new Date().toISOString().slice(0, 10),
  count: docs.length,
  docs,
};
fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(payload));

const byKind = {};
for (const d of docs) byKind[d.kind] = (byKind[d.kind] ?? 0) + 1;
console.log(`generate-unified-search-index: ${docs.length} docs`);
console.log(JSON.stringify(byKind, null, 0));
