#!/usr/bin/env node
/**
 * حارس إسناد الخط الزمني للمسائل الفقهية (الفحص 18 — ج-٣٩٦، 2026-08-01).
 *
 * كل حدث في FIQH_ISSUE_TIMELINE_SEED يُعرض للزائر في صفحة تفصيل المسألة
 * تحت عنوان «الخط الزمني» على هيئة: تاريخ يوم + وسم نوع («أول قرار»/«بيان»)
 * + عنوان. فهو إخبارٌ بأن جهةً أصدرت قرارًا في يوم بعينه. ونوع
 * FiqhTimelineEvent لا يحمل حقل مصدر البتة ⇒ لا سبيل للتحقق من داخل السجل.
 *
 * كشف عند إنشائه (ج-٣٩٦) 31 حدثًا مولَّدًا بلا مصدر واحد — عشرة منها تبلغ
 * الزائر — وكُذِّب ثلاثة منها بالمصادر الرسمية (القرار 52 (3/6) جدة 1990،
 * والقرار 63 (1/7) جدة 1992، والقرار 237 (24/8) دبي 2019).
 *
 * الشرط: لا يُقبل حدث إلا إذا كان في FIQH_COUNCIL_SEED قرارٌ منشورٌ يُطابقه
 * سنةً (من event_date مقابل session_date/published_at) ويشترك معه في كلمة
 * موضوعية دالّة من عنوانه. وإلا فهو دعوى بلا مُدَّعٍ.
 *
 * التشغيل: node --import tsx scripts/test-fiqh-timeline-provenance-guard.mjs
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const imp = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

const { FIQH_ISSUE_TIMELINE_SEED } = await imp("src/lib/fiqh-issues-seed.ts");
const { FIQH_COUNCIL_SEED } = await imp("src/lib/fiqh-council-seed.ts");

/** كلمات إجرائية لا تصلح قرينةَ موضوع — يُطرح ما عداها */
const STOP = new Set([
  "قرار", "قرارات", "بيان", "توصية", "بحث", "دراسة", "فتوى", "حكم", "أحكام",
  "المجمع", "مجمع", "الفقه", "الفقهي", "الإسلامي", "الدولي", "في", "من", "عن",
  "على", "إلى", "بشأن", "حول", "مع", "الشرعي", "الشرعية", "المسلم", "المسلمين",
]);

const norm = (s) =>
  String(s || "")
    .replace(/[ً-ْٰ]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ء-يa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const keywords = (s) =>
  new Set(norm(s).split(" ").filter((w) => w.length >= 3 && !STOP.has(w)));

const yearOf = (d) => (String(d || "").match(/^(\d{4})/) || [])[1] || null;

const published = (FIQH_COUNCIL_SEED || []).filter((i) => i.status === "published");

const violations = [];
let total = 0;

for (const [slug, events] of Object.entries(FIQH_ISSUE_TIMELINE_SEED || {})) {
  for (const ev of events || []) {
    total++;
    const evYear = yearOf(ev.event_date);
    const evWords = keywords(ev.title);

    const match = published.find((item) => {
      const itemYear = yearOf(item.session_date) || yearOf(item.published_at);
      if (!evYear || !itemYear || evYear !== itemYear) return false;
      const itemWords = keywords(item.title);
      for (const w of evWords) if (itemWords.has(w)) return true;
      return false;
    });

    if (!match) {
      violations.push(
        `${slug} :: [${ev.event_type}] ${ev.event_date || "بلا تاريخ"} — ${ev.title}`,
      );
    }
  }
}

console.log(
  `أحداث الخط الزمني: ${total} | قرارات منشورة في FIQH_COUNCIL_SEED: ${published.length} | بلا قرار مُطابِق: ${violations.length}\n`,
);
violations.slice(0, 200).forEach((v) => console.log("✗ " + v));
if (violations.length > 200) console.log(`… و${violations.length - 200} أخرى`);

if (violations.length) {
  console.error(
    `\n✗ حارس إسناد الخط الزمني: ${violations.length} حدثًا يُثبت قرارًا لا مُدَّعِيَ له في FIQH_COUNCIL_SEED.` +
      `\n  الحدث يُعرض للزائر مؤرَّخًا وموسومًا بنوعه ⇒ لا يُضاف إلا بقرار قائم يطابقه سنةً وموضوعًا.`,
  );
  process.exit(1);
}
console.log("✓ حارس إسناد الخط الزمني: كل حدث معزوٌّ إلى قرار قائم.");
