/**
 * يحسب أعداد المحتوى المنشور فعليًا من السجلات، ويكتبها إلى src/data/content-counts.json.
 * يعمل ضمن سلسلة البناء قبل vite build.
 *
 * القاعدة: لا يُعرض في الواجهة أي رقم إلا من هذا الملف. أي رقم مكتوب يدويًا يتقادم ويكذب.
 * يحرسه scripts/test-no-fake-counts.mjs.
 *
 * التشغيل: npx tsx scripts/generate-content-counts.ts
 */
import { writeFile, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const { SCHOLARS } = await import("../src/lib/scholars-data.js");
const { SEED_FAWAID } = await import("../src/lib/fawaid-seed.js");
const { DEMO_QUIZ_QUESTIONS } = await import("../src/lib/quiz-seed.js");
const { MIND_MAPS } = await import("../src/lib/mind-maps-data.js");

const { LIBRARY_CATALOG } = await import("../src/lib/library-catalog.js");
// الموسوعة تُخدَّم من public/data/rulings-encyclopedia بأجزاء؛ الـseed المستورد
// جزء منها فقط، فالعدد الصحيح المعروض هو total في الـmanifest المولَّد معها.
const rulingsManifest = JSON.parse(
  await readFile(resolve(appRoot, "public/data/rulings-encyclopedia/manifest.json"), "utf8"),
) as { total: number };
const { ANNUAL_COURSES_SEED } = await import("../src/lib/annual-courses-seed.js");
const { MIRACLES_SEED } = await import("../src/lib/miracles-seed.js");
const { ADHKAR_ITEMS } = await import("../src/lib/adhkar-seed.js");
const { SEED_QA } = await import("../src/lib/qa-seed.js");
const { NATIONS } = await import("../src/lib/nations-seed.js");

const outPath = resolve(appRoot, "src/data/content-counts.json");
const checkOnly = process.argv.includes("--check");

const numbersOnly = {
  books: LIBRARY_CATALOG.length,
  scholars: SCHOLARS.length,
  fawaid: SEED_FAWAID.length,
  quizQuestions: DEMO_QUIZ_QUESTIONS.length,
  mindMaps: MIND_MAPS.length,
  rulings: rulingsManifest.total,
  courses: ANNUAL_COURSES_SEED.length,
  miracles: MIRACLES_SEED.filter((m) => m.status === "approved" && m.verification_status === "verified").length,
  adhkar: ADHKAR_ITEMS.length,
  qa: SEED_QA.length,
  nations: NATIONS.length,
};

let previousGeneratedAt = new Date().toISOString().slice(0, 10);
try {
  const prev = JSON.parse(await readFile(outPath, "utf8")) as Record<string, unknown>;
  const prevNumbers = { ...prev };
  delete prevNumbers.$comment;
  delete prevNumbers.generatedAt;
  const same =
    JSON.stringify(prevNumbers, Object.keys(prevNumbers).sort()) ===
    JSON.stringify(numbersOnly, Object.keys(numbersOnly).sort());
  if (same && typeof prev.generatedAt === "string") {
    previousGeneratedAt = prev.generatedAt;
  }
  if (checkOnly) {
    if (!same) {
      console.error("content-counts.json out of date — run: pnpm run generate:counts");
      process.exit(1);
    }
    console.log("✓ content-counts.json up to date (--check)");
    process.exit(0);
  }
  if (same) {
    console.log("✓ أعداد المحتوى دون تغيير — لا إعادة كتابة الملف");
    console.log("✓ أعداد المحتوى المحسوبة:", numbersOnly);
    process.exit(0);
  }
} catch {
  if (checkOnly) {
    console.error("content-counts.json missing");
    process.exit(1);
  }
}

const counts = {
  $comment:
    "مُولَّد آليًا من السجلات — لا تحرّره يدويًا. أعِد التوليد: npx tsx scripts/generate-content-counts.ts",
  generatedAt: previousGeneratedAt,
  ...numbersOnly,
};

await writeFile(outPath, JSON.stringify(counts, null, 2) + "\n", "utf8");

console.log("✓ أعداد المحتوى المحسوبة:", numbersOnly);
