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
const { FATWA_SEED } = await import("../src/lib/fatwa-seed.js");
const { DEMO_QUIZ_QUESTIONS } = await import("../src/lib/quiz-seed.js");
const { MIND_MAPS } = await import("../src/lib/mind-maps-data.js");

const { LIBRARY_CATALOG } = await import("../src/lib/library-catalog.js");

const counts = {
  $comment:
    "مُولَّد آليًا من السجلات — لا تحرّره يدويًا. أعِد التوليد: npx tsx scripts/generate-content-counts.ts",
  generatedAt: new Date().toISOString().slice(0, 10),
  books: LIBRARY_CATALOG.length,
  scholars: SCHOLARS.length,
  fawaid: SEED_FAWAID.length,
  fatwas: FATWA_SEED.length,
  quizQuestions: DEMO_QUIZ_QUESTIONS.length,
  mindMaps: MIND_MAPS.length,
};

await writeFile(
  resolve(appRoot, "src/data/content-counts.json"),
  JSON.stringify(counts, null, 2) + "\n",
  "utf8",
);

const { $comment, generatedAt, ...numbers } = counts;
console.log("✓ أعداد المحتوى المحسوبة:", numbers);
