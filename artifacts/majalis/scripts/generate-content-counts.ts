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
const { MIND_MAPS } = await import("../src/lib/mind-maps-data.js");

const { LIBRARY_CATALOG } = await import("../src/lib/library-catalog.js");
// الموسوعة تُخدَّم من public/data/rulings-encyclopedia بأجزاء؛ الـseed المستورد
// جزء منها فقط، فالعدد الصحيح المعروض هو total في الـmanifest المولَّد معها.
const rulingsManifest = JSON.parse(
  await readFile(resolve(appRoot, "public/data/rulings-encyclopedia/manifest.json"), "utf8"),
) as { total: number };
const quizManifest = JSON.parse(
  await readFile(resolve(appRoot, "public/data/quiz/manifest.json"), "utf8"),
) as { total: number };
const qaManifest = JSON.parse(
  await readFile(resolve(appRoot, "public/data/qa/manifest.json"), "utf8"),
) as { total: number };
const { ANNUAL_COURSES_SEED } = await import("../src/lib/annual-courses-seed.js");
const { MIRACLES_SEED } = await import("../src/lib/miracles-seed.js");
const { ADHKAR_ITEMS } = await import("../src/lib/adhkar-seed.js");
const { NATIONS } = await import("../src/lib/nations-seed.js");

const counts = {
  $comment:
    "مُولَّد آليًا من السجلات — لا تحرّره يدويًا. أعِد التوليد: npx tsx scripts/generate-content-counts.ts",
  generatedAt: new Date().toISOString().slice(0, 10),
  books: LIBRARY_CATALOG.length,
  scholars: SCHOLARS.length,
  fawaid: SEED_FAWAID.length,
  quizQuestions: quizManifest.total,
  mindMaps: MIND_MAPS.length,
  rulings: rulingsManifest.total,
  courses: ANNUAL_COURSES_SEED.length,
  miracles: MIRACLES_SEED.filter((m) => m.status === "approved" && m.verification_status === "verified").length,
  adhkar: ADHKAR_ITEMS.length,
  qa: qaManifest.total,
  nations: NATIONS.length,
};

await writeFile(
  resolve(appRoot, "src/data/content-counts.json"),
  JSON.stringify(counts, null, 2) + "\n",
  "utf8",
);

const { $comment, generatedAt, ...numbers } = counts;
console.log("✓ أعداد المحتوى المحسوبة:", numbers);
