/**
 * يدمج مقالات knowledge/quran-people في كتالوج واجهة /quran/people.
 * يحافظ على المداخل الحالية، ويضيف الناقص من طبقة المعرفة.
 * تشغيل: node scripts/merge-quran-people-from-knowledge.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const uiPath = resolve(root, "public/data/quran-people/people.json");
const knPath = resolve(root, "public/data/knowledge/quran-people/people.json");

const ui = JSON.parse(readFileSync(uiPath, "utf8"));
const kn = JSON.parse(readFileSync(knPath, "utf8"));

const CAT = {
  أنبياء: "prophet",
  صالحون: "righteous",
  طغاة: "tyrant",
  صحابة: "companion",
  أعلام: "figure",
  أماكن: "other",
  أقوام: "other",
  جن: "other",
  ملائكة: "other",
};

const PROPHET_SLUGS = new Set([
  "adam", "idris", "nuh", "hud", "salih", "ibrahim", "lut", "ismail", "ishaq",
  "yaqub", "yusuf", "ayyub", "shuaib", "musa", "harun", "dawud", "sulaiman",
  "ilyas", "alyasa", "yunus", "zakariya", "yahya", "isa", "muhammad", "dhul-kifl",
]);

function section(body, heading) {
  const re = new RegExp(`##\\s*${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`);
  return (body.match(re)?.[1] || "").trim();
}

function firstParagraph(text) {
  return (
    text
      .split(/\n+/)
      .map((l) => l.replace(/^[-*•]\s+/, "").trim())
      .filter(Boolean)
      .find((l) => !l.startsWith("#") && l.length > 20) || ""
  );
}

function lessonsFrom(body) {
  const block =
    section(body, "العبرة العملية") ||
    section(body, "الدروس المستفادة") ||
    section(body, "العبر والدروس");
  const bullets = block
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•]\s+/, "").trim())
    .filter((l) => l.length >= 8 && l.length <= 160);
  if (bullets.length) return [...new Set(bullets)].slice(0, 6);
  const prose = firstParagraph(block);
  return prose ? [prose.slice(0, 160)] : [];
}

function occurrencesFrom(item) {
  const seen = new Set();
  const out = [];
  for (const ev of item.evidences || []) {
    if (ev.type !== "ayah" || !ev.ref) continue;
    const m = String(ev.ref).match(/^(\d+)\s*[:：]\s*(\d+)$/);
    if (!m) continue;
    const key = `${m[1]}:${m[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ surah: Number(m[1]), ayah: Number(m[2]) });
  }
  return out.slice(0, 12);
}

function toPerson(item) {
  const slug = String(item.id || "").replace(/^person-/, "");
  if (!slug) return null;
  const body = String(item.body || "");
  const catAr = item.meta?.category || item.tags?.[0] || "أعلام";
  const category = CAT[catAr] || "other";
  const why =
    firstParagraph(section(body, "سبب الذكر والحكمة")) ||
    firstParagraph(section(body, "سبب الذكر")) ||
    "ذُكر في القرآن للعبرة والتوحيد وفق سياق الآيات.";
  const rawDef = firstParagraph(section(body, "التعريف")) || firstParagraph(body);
  const isBoilerplate = /من الذين ذُكروا في القرآن|منهج المجلس|لا تُبنى عقيدة/.test(rawDef);
  const title = String(item.title || "").trim();
  const definition = (isBoilerplate || !rawDef
    ? `${title} — ذُكر في القرآن؛ ${why}`
    : rawDef
  ).slice(0, 420);
  const occurrences = occurrencesFrom(item);
  if (!definition || occurrences.length === 0) return null;
  const nameAr = title
    .replace(/\s*عليه[ا]?\s+السلام\s*$/u, "")
    .replace(/\s*رضي الله عن.*$/u, "")
    .trim();
  const rs = String(item.review_status || "");
  const status =
    rs === "needs_review" || rs === "draft" || rs === "rejected"
      ? "needs_review"
      : "published";
  /** @type {Record<string, unknown>} */
  const person = {
    slug,
    nameAr: nameAr || slug,
    aliases: nameAr && nameAr !== title ? [title] : [],
    category,
    mentionType: "name",
    definition,
    whyMentioned: why.slice(0, 280),
    lessons: lessonsFrom(body).length
      ? lessonsFrom(body)
      : ["العبرة بما قصّه القرآن، لا بما زادته القصص الضعيفة."],
    occurrences,
    status,
  };
  if (PROPHET_SLUGS.has(slug) || category === "prophet") {
    person.prophetSlug = slug === "muhammad" ? "muhammad" : slug;
    person.category = "prophet";
  }
  return person;
}

const existing = new Map((ui.people || []).map((p) => [p.slug, p]));
let added = 0;
for (const item of kn.items || []) {
  const person = toPerson(item);
  if (!person || existing.has(person.slug)) continue;
  existing.set(person.slug, person);
  added++;
}

const people = [...existing.values()].sort((a, b) =>
  String(a.nameAr).localeCompare(String(b.nameAr), "ar"),
);

const next = {
  version: Number(ui.version || 1) + 1,
  updatedAt: new Date().toISOString().slice(0, 10),
  notes: "مدمج من طبقة المعرفة مع الإبقاء على المداخل المدقّقة سابقًا.",
  people,
};

writeFileSync(uiPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      before: (ui.people || []).length,
      after: people.length,
      added,
      published: people.filter((p) => p.status === "published").length,
    },
    null,
    2,
  ),
);
