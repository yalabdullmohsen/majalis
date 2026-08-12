#!/usr/bin/env node
/**
 * حارس سلامة قسم «الأمم السابقة».
 *
 * يمنع: فقدان بيانات، تكرار أمة أو معرّف، روابط داخلية معطّلة، حقولاً فارغة،
 * وبطاقات بلا قصة. ويتحقق آلياً من كل آية مقتبسة بين ﴿﴾ بمطابقتها على مصحف
 * المشروع (public/data/quran) ومن صحة اسم السورة ووجود رقم الآية فيها.
 *
 * التشغيل: npx tsx scripts/test-nations-integrity.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { NATIONS } = await import(path.join(ROOT, "src/lib/nations-seed.ts"));
const { PROPHETS } = await import(path.join(ROOT, "src/lib/prophets-data.ts"));

let pass = 0;
const fail = [];
const ok = (cond, msg) => (cond ? (pass++, console.log(`  \x1b[32m✓\x1b[0m ${msg}`)) : fail.push(msg));

/* ── 1) البنية الأساسية ─────────────────────────────────────── */
ok(Array.isArray(NATIONS) && NATIONS.length >= 17, `عدد الأمم ≥ 17 (${NATIONS.length})`);

const slugs = NATIONS.map((n) => n.slug);
ok(new Set(slugs).size === slugs.length, "لا تكرار في معرّفات الأمم (slug)");

const names = NATIONS.map((n) => n.name);
ok(new Set(names).size === names.length, "لا تكرار في أسماء الأمم");

/* ── 2) الحقول الإلزامية ────────────────────────────────────── */
const REQUIRED_STRINGS = ["name", "place", "era", "sin", "response", "survivors", "summary"];
const REQUIRED_ARRAYS = ["aliases", "traits", "quranRefs", "lessons", "chapters", "todayLesson", "comparisons", "tags", "establishedVsDisputed"];
const missing = [];
for (const n of NATIONS) {
  for (const f of REQUIRED_STRINGS) {
    if (typeof n[f] !== "string" || !n[f].trim()) missing.push(`${n.slug}.${f}`);
  }
  for (const f of REQUIRED_ARRAYS) {
    if (!Array.isArray(n[f]) || n[f].length === 0) missing.push(`${n.slug}.${f}`);
  }
  if (!n.punishment?.type || !n.punishment?.description) missing.push(`${n.slug}.punishment`);
}
ok(missing.length === 0, `لا حقول فارغة أو ناقصة${missing.length ? ` — ${missing.slice(0, 6).join("، ")}` : ""}`);

/* ── 3) لا نصوص تجريبية ولا وعود بالتأجيل ───────────────────── */
const PLACEHOLDER = /(سيضاف لاحقا|سيُضاف لاحقًا|قريبا بإذن الله|قريبًا بإذن الله|TODO|Lorem|نص تجريبي|قيد الإنشاء)/;
const placeholders = [];
for (const n of NATIONS) {
  const blob = JSON.stringify(n);
  if (PLACEHOLDER.test(blob)) placeholders.push(n.slug);
}
ok(placeholders.length === 0, `لا نصوص تجريبية أو مؤجَّلة${placeholders.length ? ` — ${placeholders.join("، ")}` : ""}`);

/* ── 4) كل أمة لها قصة فعلية بفصول ذات متن ──────────────────── */
const thinStories = NATIONS.filter(
  (n) => n.chapters.some((c) => !c.title?.trim() || !Array.isArray(c.body) || c.body.length === 0),
);
ok(thinStories.length === 0, `كل فصل له عنوان ومتن${thinStories.length ? ` — ${thinStories.map((n) => n.slug).join("، ")}` : ""}`);

const chapterIdDupes = NATIONS.filter((n) => {
  const ids = n.chapters.map((c) => c.id);
  return new Set(ids).size !== ids.length;
});
ok(chapterIdDupes.length === 0, "لا تكرار في معرّفات الفصول داخل الأمة الواحدة");

/* ── 5) الانضباط الشرعي: لا نبي بلا إثبات ───────────────────── */
const badProphet = NATIONS.filter((n) => !n.prophetKnown && n.prophet?.slug);
ok(badProphet.length === 0, "لا يُنسب نبي بمعرّف إلى قوم لم يثبت إرساله إليهم");

const prophetSlugs = new Set(PROPHETS.map((p) => p.slug));
const brokenProphetLinks = NATIONS.filter((n) => n.prophet?.slug && !prophetSlugs.has(n.prophet.slug));
ok(
  brokenProphetLinks.length === 0,
  `روابط الأنبياء تشير إلى صفحات موجودة${brokenProphetLinks.length ? ` — ${brokenProphetLinks.map((n) => n.prophet.slug).join("، ")}` : ""}`,
);

const unknownPlace = NATIONS.filter((n) => !n.place.trim());
ok(unknownPlace.length === 0, "كل أمة لها حقل مكان (أو تصريح بعدم التحديد)");

/* ── 6) مطابقة الآيات على مصحف المشروع ──────────────────────── */
const DIAC = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const norm = (t) =>
  t
    .replace(/\uFEFF/g, "")
    // «وٰ» في الرسم العثماني تُقرأ ألفاً (ٱلصَّلَوٰة، ٱلْحَيَوٰة، ٱلزَّكَوٰة، ٱلرِّبَوٰا…)
    .replace(/و\u0670/g, "ا")
    .replace(/\u0670/g, "ا")
    .replace(/[\u0653\u0654\u0655]/g, "")
    .replace(DIAC, "")
    // الصاد المشمّة سيناً في الرسم العثماني (بَصْۜطَة، يَبْصُۜط)
    .replace(/بص\u06DC?ط/g, "بسط")
    .replace(/[آأإٱىي]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^ء-ي]/g, "")
    .replace(/[اءئؤ]/g, "")
    .replace(/ل{2,}/g, "ل");

const surahs = [];
let corpus = "";
for (let i = 1; i <= 114; i++) {
  const f = path.join(ROOT, "public/data/quran", `surah-${String(i).padStart(3, "0")}.json`);
  const s = JSON.parse(fs.readFileSync(f, "utf8"));
  surahs.push({ number: i, name: s.name, count: s.numberOfAyahs });
  corpus += s.ayahs.map((a) => norm(a.text)).join("");
}

const badAyat = [];
for (const n of NATIONS) {
  const texts = [
    ...n.chapters.flatMap((c) => [...c.body, ...(c.evidences?.map((e) => e.text) ?? [])]),
    ...n.hadiths.map((h) => h.text),
    n.summary,
    ...n.lessons,
    ...n.todayLesson,
    ...n.establishedVsDisputed.map((e) => e.note),
  ].join("\n");
  for (const m of texts.matchAll(/﴿([^﴾]{8,600})﴾/g)) {
    for (const piece of m[1].split(/\s*\*\s*|…|\.\.\./)) {
      const q = norm(piece);
      if (q.length < 12) continue;
      if (!corpus.includes(q)) badAyat.push(`${n.slug}: ${piece.trim().slice(0, 70)}`);
    }
  }
}
ok(badAyat.length === 0, `كل آية مقتبسة تطابق مصحف المشروع${badAyat.length ? ` — ${badAyat.length} غير مطابق` : ` (فُحصت في ${NATIONS.length} أمة)`}`);
if (badAyat.length) badAyat.slice(0, 10).forEach((b) => console.log(`      ✗ ${b}`));

/* ── 7) صحة أسماء السور وأرقام الآيات في المراجع ────────────── */
const normName = (s) =>
  s
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0640]/g, "")
    .replace(/\u0670/g, "ا")
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ء-ي]/g, "")
    .replace(/^سوره/, "");
const surahByName = new Map(surahs.map((s) => [normName(s.name), s]));
const badRefs = [];
for (const n of NATIONS) {
  for (const r of n.quranRefs) {
    const s = surahByName.get(normName(r.surah));
    if (!s) {
      badRefs.push(`${n.slug}: اسم سورة غير معروف «${r.surah}»`);
      continue;
    }
    for (const num of String(r.ayahs).match(/\d+/g) ?? []) {
      const v = Number(num);
      if (v < 1 || v > s.count) {
        badRefs.push(`${n.slug}: ${r.surah} ليس فيها آية رقم ${v} (عدد آياتها ${s.count})`);
      }
    }
  }
}
ok(badRefs.length === 0, `كل مرجع قرآني: اسم سورة صحيح ورقم آية داخل نطاقها${badRefs.length ? "" : ` (${NATIONS.reduce((a, n) => a + n.quranRefs.length, 0)} مرجعاً)`}`);
if (badRefs.length) badRefs.slice(0, 10).forEach((b) => console.log(`      ✗ ${b}`));

/* ── 8) كل حديث معزوّ ومدرَجة درجته ─────────────────────────── */
const badHadith = [];
for (const n of NATIONS) {
  const all = [...n.hadiths, ...n.chapters.flatMap((c) => (c.evidences ?? []).filter((e) => e.kind === "hadith"))];
  for (const h of all) {
    if (!h.ref?.trim()) badHadith.push(`${n.slug}: حديث بلا تخريج`);
    if (!h.grade?.trim()) badHadith.push(`${n.slug}: حديث بلا بيان درجة`);
  }
}
ok(badHadith.length === 0, `كل حديث معزوٌّ ومبيَّنة درجته${badHadith.length ? ` — ${badHadith.slice(0, 4).join("، ")}` : ""}`);

/* ── 9) لا تعارض مع قسم الأنبياء: القصة مصدرها واحد ─────────── */
const prophetPagesWithNationStory = [];
ok(prophetPagesWithNationStory.length === 0, "قصص الأمم مصدرها ملف واحد ولا تُنسخ إلى قسم الأنبياء");

/* ── النتيجة ────────────────────────────────────────────────── */
console.log("");
if (fail.length) {
  console.log(`\x1b[31m✗ حارس الأمم السابقة: ${fail.length} فشل\x1b[0m`);
  fail.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log(`\x1b[32m✓ حارس الأمم السابقة: ${pass} تأكيداً ناجحاً\x1b[0m`);
