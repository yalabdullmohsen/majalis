#!/usr/bin/env node
/**
 * حارس الاستشهادات القرآنية في بذرة الاختبارات — `public/data/quiz/*.json`.
 *
 * أُنشئ في ج-٤٠٣ لسدّ ثغرة تغطيةٍ مرصودةٍ منذ ج-٣٤٢: حارسُ الاقتباسات العام
 * (`scripts/test-quran-quotes-guard.mjs`) يمشي على `src/**\/*.{ts,tsx}` وحدها،
 * وبعدَ فصلِ البذورِ إلى JSON (PR #629) خرجت منه ٤٩٢ اقتباسًا قرآنيًّا في
 * بذرة الاختبارات. وهذا الحارس يفحصها كلَّها ببعدَيها:
 *
 *   (١) الوجود واللفظ: كلُّ نصٍّ بين ﴿﴾ أو {} يجب أن يكون في مصحف المشروع
 *       (`public/data/quran`) إمّا مطابقةً حرفيّةً بعد التطبيع، وإمّا مطابقةً
 *       بهيكل الصوامت (تحمُّلًا لفرق الرسم: ٱلصَّلَوٰةَ/الصلاة، ءَامَنُوا۟/آمنوا).
 *       والفحصان معًا لا أحدهما — سَنَّةُ ج-٣٤٢: الحرفيُّ وحدَه يُعطي إنذارًا
 *       كاذبًا على رسم المصحف، والهيكليُّ وحدَه يُخفي زيادةَ ألفٍ أو واوٍ.
 *   (٢) الموضع: كلُّ استشهادٍ مقرونٍ بـ«سورة كذا: رقم» (داخل النص أو في حقل
 *       `reference`) يجب أن يقع لفظُه في الآية المُحال عليها بعينِها، وأن يكون
 *       رقمُ الآية داخلَ نطاق سورتِها.
 *
 * والمخالفاتُ المرصودةُ يومَ الإنشاء (١٣ صفًّا) مستثناةٌ صراحةً أدناه لأنَّ
 * إصلاحَها مسُّ نصٍّ قرآنيٍّ أو رقمِ آيةٍ ⇒ قرارُ مالكٍ (سَنَّةُ ج-٣٣٠)، وهي
 * موسومةٌ في `artifacts/majalis/data/needs-post-review.jsonl`. والحارسُ يَعَضُّ
 * في الاتجاهين: يَعَضُّ خرقًا جديدًا، ويَعَضُّ استثناءً بطلَ موجبُه.
 *
 * التشغيل: node scripts/test-quiz-quran-citations-guard.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const QUIZ_DIR = path.join(ROOT, "public/data/quiz");
const QURAN_DIR = path.join(ROOT, "public/data/quran");

/** استثناءاتٌ مرصودةٌ ومُوسَمةٌ — كلُّ إصلاحٍ لها مسُّ نصٍّ قرآنيٍّ أو رقمِ آيةٍ. */
const KNOWN = new Map([
  ["demo-quiz-655", "علامةُ رقمِ الآية ﴿١٩٣﴾ مطبوعةٌ داخلَ الاستشهاد"],
  ["demo-quiz-1113", "«إنه هو السميع العليم» معزوٌّ إلى البقرة ٢٥٦"],
  ["demo-quiz-1143", "«عزيز حكيم» معزوٌّ إلى آل عمران ٦"],
  ["demo-quiz-1144", "اقتباسان معزوّانِ إلى آل عمران ٦"],
  ["demo-quiz-1145", "«إنه سميع بصير» معزوٌّ إلى الإسراء ١"],
  ["demo-quiz-1146", "لفظٌ لا موضعَ له، وعزوٌ إلى القمر ٧–٨"],
  ["demo-quiz-1150", "لفظُ النساء ١١ ومرجعُه النساء ١٧٦"],
  ["demo-quiz-1176", "«وكان الله رزاقًا» لا موضعَ له في المصحف"],
  ["demo-quiz-1179", "«إن الله كان عليك وكيلًا» لا موضعَ له في المصحف"],
  ["demo-quiz-1195", "«إنه غفور رحيم» ومرجعُه البقرة ١٧٣"],
  ["demo-quiz-1220", "«إنه غفور رحيم» ومرجعُه البقرة ١٧٣"],
  ["demo-quiz-1255", "لفظُ الكهف ٤٩ ومرجعُه الانفطار ١٠"],
  ["demo-quiz-1262", "«وهو القهار العزيز» لا موضعَ له في المصحف"],
]);

const stripMarks = (s) => s.normalize("NFKD").replace(/\p{Mn}/gu, "");
const norm = (s) =>
  stripMarks(s)
    .replace(/ـ/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "")
    .replace(/[^ء-ي\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const skel = (s) => norm(s).replace(/[اوي]/g, "").replace(/ /g, "");
const toEn = (s) => s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

// ── مصحف المشروع ──────────────────────────────────────────────────────────
const surahs = [];
const byName = new Map();
for (let i = 1; i <= 114; i++) {
  const d = JSON.parse(fs.readFileSync(path.join(QURAN_DIR, `surah-${String(i).padStart(3, "0")}.json`), "utf8"));
  const ayat = new Map(d.ayahs.map((a) => [a.numberInSurah, a.text]));
  const s = {
    n: i,
    count: d.numberOfAyahs,
    ayat,
    joinedNorm: d.ayahs.map((a) => norm(a.text)).join(" "),
    joinedSkel: d.ayahs.map((a) => skel(a.text)).join(""),
  };
  surahs.push(s);
  byName.set(norm(d.name).replace(/^سوره\s*/, ""), s);
}
const inQuran = (q) => {
  const n = norm(q);
  const k = skel(q);
  if (!n) return true;
  return surahs.some((s) => n && s.joinedNorm.includes(n)) || surahs.some((s) => k && s.joinedSkel.includes(k));
};
const atLocation = (q, surah, from, to) => {
  let txt = "";
  for (let a = from; a <= to; a++) txt += " " + (surah.ayat.get(a) || "");
  const n = norm(q);
  const k = skel(q);
  return (n && norm(txt).includes(n)) || (k && skel(txt).includes(k));
};

// ── بذرة الاختبارات ───────────────────────────────────────────────────────
const rows = [];
for (const f of fs.readdirSync(QUIZ_DIR).sort()) {
  if (!f.endsWith(".json") || f === "manifest.json") continue;
  for (const r of JSON.parse(fs.readFileSync(path.join(QUIZ_DIR, f), "utf8"))) rows.push({ ...r, __f: f });
}

const FIELDS = ["question", "answer", "explanation"];
const QUOTE = /﴿([^﴿﴾]{2,})﴾|\{([^{}]{2,})\}/g;
const NUMMARK = /﴿\s*[\d٠-٩]+\s*﴾/g;
/** نصُّ الاستشهاد أيًّا كان قوساه. */
const quoteOf = (m) => (m[1] ?? m[2] ?? "").trim();
// «﴿…﴾ — سورة: رقم» أو «﴿…﴾ (سورة: رقم)» أو «[سورة: رقم]»
const INLINE = /(?:﴿([^﴿﴾]{4,})﴾|\{([^{}]{4,})\})\s*[—\-–:،.]?\s*[([]?\s*(?:سورة\s*)?([ء-ي\s]{3,20}?)\s*[:：]\s*([\d٠-٩]+)\s*[-–]?\s*([\d٠-٩]+)?\s*[)\]]?/g;
const REF = /سورة\s*([ء-ي\s]{3,20}?)\s*[:：]\s*([\d٠-٩]+)\s*[-–]?\s*([\d٠-٩]+)?/;
const RANGE = /(?:سورة\s*)?([ء-ي][ء-ي\s]{2,18}?)\s*[:：]\s*([\d٠-٩]{1,3})/g;

const offenders = new Map(); // id → [أسباب]
const add = (id, why) => offenders.set(id, [...(offenders.get(id) || []), why]);
let quotes = 0;
let located = 0;
let refs = 0;

for (const r of rows) {
  // (١) الوجود واللفظ + علامةُ رقمِ آيةٍ مطبوعةٌ داخلَ قوسَي الاستشهاد
  for (const fld of FIELDS) {
    const t = r[fld] || "";
    for (const m of t.matchAll(NUMMARK)) add(r.id, `علامةُ رقمِ آيةٍ مطبوعةٌ في النصِّ: ${m[0]} (${fld})`);
    for (const m of t.matchAll(QUOTE)) {
      const q = quoteOf(m);
      if (!/[ء-ي]/.test(q)) continue;
      quotes++;
      if (!inQuran(q)) add(r.id, `لا موضعَ له في مصحف المشروع: «${q.slice(0, 60)}» (${fld})`);
    }
  }
  // (٢أ) الموضع — إحالةٌ مرقَّمةٌ ملاصقةٌ للاقتباس
  for (const fld of FIELDS) {
    for (const m of (r[fld] || "").matchAll(INLINE)) {
      const surah = byName.get(norm(m[3]).replace(/^سوره\s*/, ""));
      if (!surah) continue;
      const q = quoteOf(m);
      const a1 = +toEn(m[4]);
      const a2 = m[5] ? +toEn(m[5]) : a1;
      if (a1 < 1 || a2 > surah.count) continue; // يُمسَك في (٣)
      located++;
      if (!atLocation(q, surah, a1, a2))
        add(r.id, `لفظٌ لا يقع في الموضع المُحال عليه (${m[3].trim()}: ${m[4]}): «${q.slice(0, 50)}» (${fld})`);
    }
  }
  // (٢ب) الموضع — حقلُ `reference` مقابلَ اقتباسات الصفِّ
  const rm = (r.reference || "").match(REF);
  if (rm) {
    const surah = byName.get(norm(rm[1]).replace(/^سوره\s*/, ""));
    const qs = FIELDS.flatMap((f) => [...(r[f] || "").matchAll(QUOTE)].map(quoteOf)).filter((q) => /[ء-ي]/.test(q));
    if (surah && qs.length) {
      const a1 = +toEn(rm[2]);
      const a2 = rm[3] ? +toEn(rm[3]) : a1;
      if (a1 >= 1 && a2 <= surah.count) {
        located++;
        if (!qs.some((q) => atLocation(q, surah, a1, a2)))
          add(r.id, `لا يقع شيءٌ من اقتباسات الصفِّ في مرجعِه «${r.reference}»`);
      }
    }
  }
  // (٣) رقمُ الآية داخلَ نطاق سورتِها
  for (const fld of [...FIELDS, "reference"]) {
    const t = r[fld] || "";
    if (!/[﴿{]|سورة/.test(t)) continue;
    for (const m of t.matchAll(RANGE)) {
      const surah = byName.get(norm(m[1]).replace(/^سوره\s*/, ""));
      if (!surah) continue;
      refs++;
      const a = +toEn(m[2]);
      if (a < 1 || a > surah.count) add(r.id, `«${m[1].trim()}» ليس فيها آية ${m[2]} (لها ${surah.count})`);
    }
  }
}

const unexpected = [...offenders].filter(([id]) => !KNOWN.has(id));
const stale = [...KNOWN.keys()].filter((id) => !offenders.has(id));

console.log(
  `صفوف: ${rows.length} | اقتباسات مفحوصة: ${quotes} | إحالات موضعيّة: ${located} | مراجع مرقَّمة: ${refs}`
);
console.log(`صفوفٌ مخالفةٌ: ${offenders.size} (منها ${KNOWN.size} مستثناةٌ ومُوسَمةٌ)\n`);

for (const [id, why] of unexpected) why.forEach((w) => console.log(`✗ ${id}: ${w}`));
for (const id of stale) console.log(`✗ ${id}: استثناءٌ بلا موجب — زالت المخالفة فيُحذف من KNOWN`);

if (unexpected.length || stale.length) {
  console.log(`\n\x1b[31m✗ حارس استشهادات بذرة الاختبارات: ${unexpected.length + stale.length} مخالفة\x1b[0m`);
  process.exit(1);
}
console.log("\x1b[32m✓ حارس استشهادات بذرة الاختبارات: كل استشهادٍ قرآنيٍّ مطابقٌ للمصحف لفظًا وموضعًا\x1b[0m");
