/**
 * يحسب أعداد المحتوى المنشور فعليًا من السجلات، ويكتبها إلى src/data/content-counts.json.
 * حتمي: بلا generatedAt. يدعم --check.
 *
 * التشغيل:
 *   npx tsx scripts/generate-content-counts.ts
 *   npx tsx scripts/generate-content-counts.ts --check
 */
import { writeFile, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = resolve(appRoot, "src/data/content-counts.json");
const checkOnly = process.argv.includes("--check");

const { SCHOLARS } = await import("../src/lib/scholars-data.js");
const { SEED_FAWAID } = await import("../src/lib/fawaid-seed.js");
const { DEMO_QUIZ_QUESTIONS } = await import("../src/lib/quiz-seed.js");
const { MIND_MAPS } = await import("../src/lib/mind-maps-data.js");

const { LIBRARY_CATALOG } = await import("../src/lib/library-catalog.js");
const rulingsArchiveManifest = resolve(appRoot, "content/archive/rulings-encyclopedia/data/manifest.json");
let rulingsTotal = 0;
try {
  const rulingsManifest = JSON.parse(await readFile(rulingsArchiveManifest, "utf8")) as { total: number };
  rulingsTotal = 0; // أُزيلت من الواجهة العامة — العدد المؤرشف لا يُعرض
} catch {
  rulingsTotal = 0;
}
const { ANNUAL_COURSES_SEED } = await import("../src/lib/annual-courses-seed.js");
const { MIRACLES_SEED } = await import("../src/lib/miracles-seed.js");
const { ADHKAR_ITEMS } = await import("../src/lib/adhkar-seed.js");
const { SEED_QA } = await import("../src/lib/qa-seed.js");
const { NATIONS } = await import("../src/lib/nations-seed.js");

const counts = {
  $comment:
    "مُولَّد آليًا من السجلات — لا تحرّره يدويًا. أعِد التوليد: npx tsx scripts/generate-content-counts.ts",
  books: LIBRARY_CATALOG.length,
  scholars: SCHOLARS.length,
  fawaid: SEED_FAWAID.length,
  quizQuestions: DEMO_QUIZ_QUESTIONS.length,
  mindMaps: MIND_MAPS.length,
  rulings: rulingsTotal,
  courses: ANNUAL_COURSES_SEED.length,
  miracles: MIRACLES_SEED.filter((m) => m.status === "approved" && m.verification_status === "verified")
    .length,
  adhkar: ADHKAR_ITEMS.length,
  qa: SEED_QA.length,
  nations: NATIONS.length,
};

const next = `${JSON.stringify(counts, null, 2)}\n`.replace(/\r\n/g, "\n");
let current: string | null = null;
try {
  current = (await readFile(outPath, "utf8")).replace(/\r\n/g, "\n");
} catch {
  current = null;
}

if (checkOnly) {
  if (current === next) {
    console.log("✓ content-counts.json مطابق (حتمي)");
    process.exit(0);
  }
  console.error("✗ content-counts.json مختلف عن التوليد الحتمي");
  process.exit(1);
}

if (current !== next) {
  await writeFile(outPath, next, "utf8");
  console.log("✓ كُتب src/data/content-counts.json");
} else {
  console.log("✓ لا تغيير — content-counts.json محدّث");
}

const { $comment: _c, ...numbers } = counts;
console.log("✓ أعداد المحتوى المحسوبة:", numbers);
