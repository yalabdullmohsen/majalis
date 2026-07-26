#!/usr/bin/env node
/**
 * حارس الأرقام — يمنع كتابة أعداد محتوى يدويًا في نصوص الواجهة وnoscript.
 *
 * القاعدة: لا يُعرض رقم إلا محسوبًا آليًا من السجلات المنشورة عبر content-counts.json.
 */
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const WATCHED = [
  "src/lib/navigation.ts",
  "src/views/HomePage.tsx",
  "src/components/home/HomeAboutSection.tsx",
  "src/components/home/HomeQuizCard.tsx",
  "src/views/FeaturesInProgressPage.tsx",
];

const CONTENT_UNITS =
  "كتاب|كتابًا|كتاباً|فائدة|سؤال|سؤالًا|سؤالاً|عالم|عالِمًا|عالمًا|عالماً|فتوى|حكم|حكمًا|حكماً|خريطة|مصطلح|مصطلحًا|معجزة|حكمة|خلق|خلقًا|خلقاً|درس|درسًا|دورة|مسألة|ذكرًا|ذكراً";

const IMMUTABLE_FACTS = [
  /١١٤\s*سورة/,
  /99\s*اسم/,
  /٩٩\s*اسم/,
  /25\s*نبي/,
  /٢٥\s*نبي/,
  /٨\s*(فئات|أبواب)/,
];

const numberBeforeUnit = new RegExp(
  `["'\`][^"'\`]*[٠-٩0-9]+\\s*\\+?\\s*(${CONTENT_UNITS})`,
  "u",
);

const failures = [];

for (const rel of WATCHED) {
  const text = await readFile(resolve(appRoot, rel), "utf8");
  text.split("\n").forEach((line, i) => {
    if (!/description:|desc:|label:|title:/.test(line)) return;
    if (line.includes("${COUNTS.")) return;
    if (IMMUTABLE_FACTS.some((re) => re.test(line))) return;
    if (numberBeforeUnit.test(line)) {
      failures.push(`${rel}:${i + 1} — ${line.trim().slice(0, 100)}`);
    }
  });
}

const navText = await readFile(resolve(appRoot, "src/lib/navigation.ts"), "utf8");
navText.split("\n").forEach((line, i) => {
  if (/description:.*(موثقة|موثّقة|مُوثَّقة|معتمدة)\b/.test(line)) {
    failures.push(
      `src/lib/navigation.ts:${i + 1} — ادّعاء توثيق في نص التنقل: ${line.trim().slice(0, 80)}`,
    );
  }
});

// index.html noscript يجب أن يطابق content-counts.json حرفيًا
const counts = JSON.parse(
  await readFile(resolve(appRoot, "src/data/content-counts.json"), "utf8"),
);
const indexHtml = await readFile(resolve(appRoot, "index.html"), "utf8");
const noscriptMatch = indexHtml.match(/CONTENT_COUNTS_NOSCRIPT_BEGIN[\s\S]*?CONTENT_COUNTS_NOSCRIPT_END/);
if (!noscriptMatch) {
  failures.push("index.html — كتلة CONTENT_COUNTS_NOSCRIPT مفقودة؛ شغّل: node scripts/sync-index-noscript.mjs");
} else {
  const block = noscriptMatch[0];
  const expected = [
    [`${counts.books} كتابًا`, "books"],
    [`${counts.scholars} عالِمًا`, "scholars"],
    [`${counts.courses} دورة`, "courses"],
    [`${counts.rulings} مسألة`, "rulings"],
    [`${counts.quizQuestions} سؤالًا`, "quizQuestions"],
    [`${counts.qa} سؤالًا`, "qa"],
    [`${counts.adhkar} ذكرًا`, "adhkar"],
  ];
  for (const [needle, key] of expected) {
    if (!block.includes(needle)) {
      failures.push(`index.html noscript — الرقم ${key}=${counts[key]} غير متزامن («${needle}» مفقود)`);
    }
  }
  // محتوى ملغى/قديم
  if (/إذاعات|بث مباشر|فتوى موثقة|مكتبة المؤذنين/.test(block)) {
    failures.push("index.html noscript — عبارات أقسام ملغاة أو ادعاءات توثيق قديمة");
  }
  // أرقام يدوية شائعة متقادمة
  for (const stale of ["117 كتاب", "96 عالم", "108 فتوى", "950 سؤال", "49+ دورة"]) {
    if (block.includes(stale) || indexHtml.includes(stale)) {
      failures.push(`index.html — رقم متقادم يدوي: «${stale}»`);
    }
  }
}

// ممنوع العنوان العام «كتاب شرعي» في مصادر SEO
const seoTs = await readFile(resolve(appRoot, "src/lib/seo.ts"), "utf8");
if (seoTs.includes("كتاب شرعي")) {
  failures.push("src/lib/seo.ts — عنوان عام ممنوع: «كتاب شرعي»");
}

if (failures.length) {
  console.error(`✗ حارس الأرقام: ${failures.length} مشكلة\n`);
  failures.forEach((f) => console.error("  " + f));
  console.error("\nالحل: pnpm run generate:counts ثم راجع المصدر.");
  process.exit(1);
}

console.log("✓ حارس الأرقام: الواجهة وindex.html متزامنان مع content-counts.json.");
