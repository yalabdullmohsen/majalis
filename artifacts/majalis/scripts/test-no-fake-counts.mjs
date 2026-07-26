#!/usr/bin/env node
/**
 * حارس الأرقام — يمنع كتابة أعداد محتوى يدويًا في نصوص الواجهة.
 *
 * القاعدة (من مالك المنصة): لا يُعرض رقم إلا محسوبًا آليًا من السجلات المنشورة.
 * الأرقام المسموحة: الحقائق الثابتة (١١٤ سورة، ٩٩ اسمًا، ٢٥ نبيًا، ٥ أركان…)،
 * والقيم المحسوبة من src/data/content-counts.json عبر قوالب `${COUNTS.x}`.
 */
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** الملفات التي تُعرض نصوصها في القوائم والرئيسية. */
const WATCHED = [
  "src/lib/navigation.ts",
  "src/views/HomePage.tsx",
  "src/components/home/HomeAboutSection.tsx",
  "src/components/home/HomeQuizCard.tsx",
];

/** وحدات تدل على «عدد محتوى» — أي رقم قبلها كذبة تتقادم. */
const CONTENT_UNITS =
  "كتاب|كتابًا|كتاباً|فائدة|سؤال|سؤالًا|سؤالاً|عالم|عالمًا|عالماً|فتوى|حكم|حكمًا|حكماً|خريطة|مصطلح|مصطلحًا|معجزة|حكمة|خلق|خلقًا|خلقاً|درس|درسًا|دورة";

/** حقائق ثابتة لا تتقادم — رقمها جزء من المعلومة نفسها. */
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
    if (line.includes("${COUNTS.")) return; // رقم محسوب — مسموح
    if (IMMUTABLE_FACTS.some((re) => re.test(line))) return;
    if (numberBeforeUnit.test(line)) {
      failures.push(`${rel}:${i + 1} — ${line.trim().slice(0, 100)}`);
    }
  });
}

// حالة المراجعة: لا يُدَّعى التوثيق في نصوص التنقل
const navText = await readFile(resolve(appRoot, "src/lib/navigation.ts"), "utf8");
navText.split("\n").forEach((line, i) => {
  if (/description:.*(موثقة|موثّقة|مُوثَّقة|معتمدة)\b/.test(line)) {
    failures.push(
      `src/lib/navigation.ts:${i + 1} — ادّعاء توثيق في نص التنقل: ${line.trim().slice(0, 80)}`,
    );
  }
});

if (failures.length) {
  console.error(`✗ حارس الأرقام: ${failures.length} رقم/ادّعاء مكتوب يدويًا\n`);
  failures.forEach((f) => console.error("  " + f));
  console.error("\nالحل: احسبه في scripts/generate-content-counts.ts واستعمل ${COUNTS.x}، أو احذف الرقم.");
  process.exit(1);
}

console.log("✓ حارس الأرقام: لا عدد محتوى مكتوب يدويًا في نصوص الواجهة.");
