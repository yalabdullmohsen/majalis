#!/usr/bin/env node
/**
 * يمنع ادّعاءات توثيق مطلقة في صفحات التسويق/التعريف الظاهرة للمستخدم
 * دون سياق مراجعة. لا يفحص بذور الحديث/الفقه (قد تنقل عبارات العلماء).
 */
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const WATCHED = [
  "src/views/AboutPage.tsx",
  "src/views/FeaturesInProgressPage.tsx",
  "src/views/FiqhCouncilFatwasPage.tsx",
  "src/views/FawaidPage.tsx",
  "src/lib/navigation.ts",
  "src/components/home/HomeAboutSection.tsx",
  "index.html",
];

/** ادّعاءات ممنوعة في نصوص التسويق */
const FORBIDDEN = [
  /فتاوى\s*موثقة/,
  /حكماً?\s*شرعياً?\s*موث[ّق]ق/,
  /معجزة\s*علمية\s*موث/,
  /صحابة\s*موثق/,
  /موثّقة?\s*بأسانيدها/,
  /مرجع(?:اً|ًا)?\s*علمياً?\s*موثوقاً/,
];

const failures = [];

for (const rel of WATCHED) {
  const text = await readFile(resolve(appRoot, rel), "utf8");
  text.split("\n").forEach((line, i) => {
    for (const re of FORBIDDEN) {
      if (re.test(line)) {
        failures.push(`${rel}:${i + 1} — ${line.trim().slice(0, 100)}`);
      }
    }
    // أرقام محتوى يدوية شائعة متقادمة في About
    if (rel.includes("AboutPage") && /125 كتاب|76\+|53 حكم|780\+|49\+ دورة/.test(line)) {
      failures.push(`${rel}:${i + 1} — رقم متقادم: ${line.trim().slice(0, 80)}`);
    }
  });
}

if (failures.length) {
  console.error(`✗ ادّعاءات تسويقية/توثيق مطلقة: ${failures.length}\n`);
  failures.forEach((f) => console.error("  " + f));
  process.exit(1);
}
console.log("✓ لا ادّعاءات توثيق مطلقة ممنوعة في صفحات التسويق المفحوصة.");
