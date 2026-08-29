/**
 * اختبارات مكتبة الأبحاث الشرعية
 * npx tsx src/lib/__tests__/researches-library.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  RESEARCH_CATEGORIES,
  RESEARCH_PUBLISHED_SEED,
  RESEARCH_DEMO_SEED,
  computeResearchStats,
  searchResearches,
  findDuplicateCandidates,
  formatCitation,
  submitResearch,
  listPublishedResearches,
  runDailyImportDry,
  THESIS_KINDS,
} from "../researches";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== تصنيفات وأنواع ===");
assert(RESEARCH_CATEGORIES.length >= 30, `عدد التصنيفات >= 30 (فعليًا ${RESEARCH_CATEGORIES.length})`);
assert(THESIS_KINDS.includes("masters_thesis") && THESIS_KINDS.includes("phd_dissertation"), "أنواع الرسائل معرّفة");

console.log("\n=== بيانات الإنتاج بلا وهم ===");
assert(RESEARCH_PUBLISHED_SEED.length >= 50, `بذرة الإنتاج مفهرسة وصفياً (>=50؛ فعلياً ${RESEARCH_PUBLISHED_SEED.length})`);
assert(
  RESEARCH_PUBLISHED_SEED.every((r) => r.isDemo !== true),
  "بذرة الإنتاج ليست تجريبية",
);
assert(
  RESEARCH_PUBLISHED_SEED.every((r) => r.accessType === "metadata_only" || r.accessType === "abstract_only"),
  "الإنتاج بلا ادّعاء نص كامل بلا إذن",
);
assert(
  RESEARCH_PUBLISHED_SEED.every((r) => r.reviewStatus === "published"),
  "كل سجل إنتاجي منشور للمراجعة الوصفية",
);
const prodStats = computeResearchStats(RESEARCH_PUBLISHED_SEED);
assert(prodStats.published === RESEARCH_PUBLISHED_SEED.length, "إحصاءات الإنتاج تطابق البذرة الوصفية");
assert(RESEARCH_DEMO_SEED.every((r) => r.isDemo === true), "كل عيّنات التطوير معلَّمة isDemo");
assert(RESEARCH_DEMO_SEED.every((r) => r.title.includes("تجريبي") || r.title.includes("DEMO")), "عناوين العيّنات توضّح أنها تجريبية");

console.log("\n=== بحث وتكرار وتوثيق ===");
const demoPublished = RESEARCH_DEMO_SEED.filter((r) => r.reviewStatus === "published");
const found = searchResearches(demoPublished, { q: "فقه" });
assert(found.length >= 1, "البحث العربي يجد نتيجة في العيّنة");
const dupes = findDuplicateCandidates([
  { ...demoPublished[0], id: "x1" },
  { ...demoPublished[0], id: "x2" },
], 60);
assert(dupes.length >= 1, "اكتشاف التكرار بالعنوان");
const cite = formatCitation(demoPublished[0], "arabic");
assert(cite.includes(demoPublished[0].authors[0].name), "التوثيق العربي يتضمن اسم الباحث");

console.log("\n=== منع النشر المباشر ===");
const bad = submitResearch({
  title: "بحث",
  kind: "undergraduate",
  categoryId: "fiqh",
  authorName: "أ",
  authorEmail: "bad",
  submitterRole: "author",
  language: "ar",
  abstract: "قصير",
  keywords: "",
  license: "all_rights_reserved",
  acceptTerms: false,
  attestOwnership: false,
});
assert(bad.ok === false, "رفض طلب بلا شروط");

console.log("\n=== استيراد يومي صادق ===");
const report = runDailyImportDry({ force: true });
assert(report.discovered === 0, "لا اكتشاف وهمي عند غياب مصادر نشطة");
assert(report.notes.length >= 1, "تقرير يوضح سبب الصفر");

console.log("\n=== ربط المسارات والواجهة ===");
{
  const app = readFileSync(resolve(appRoot, "src/App.tsx"), "utf8") + "\n" + readFileSync(resolve(appRoot, "src/AppRoutes.tsx"), "utf8");
  assert(app.includes("/academic-research/submit"), "مسار الإضافة مسجّل");
  assert(app.includes("ResearchDetailPage"), "صفحة التفاصيل مسجّلة");
  const sql = readFileSync(resolve(appRoot, "supabase/researches_v1.sql"), "utf8");
  assert(sql.includes("CREATE TABLE IF NOT EXISTS researches"), "جدول researches في SQL");
  assert(sql.includes("ENABLE ROW LEVEL SECURITY"), "RLS مفعّل");
  const dispatch = readFileSync(resolve(appRoot, "lib/api-dispatch.mjs"), "utf8");
  assert(dispatch.includes("/api/cron/researches-daily-import"), "كرون الاستيراد مسجّل");
  assert(dispatch.includes("/api/researches/submit"), "API الإضافة مسجّل");
  const published = listPublishedResearches();
  assert(Array.isArray(published), "listPublishedResearches يعيد مصفوفة");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
