#!/usr/bin/env node
/**
 * Content inventory audit — counts seed sections for admin reporting.
 *
 * يستورد الوحدات فعلياً بدل مطابقة نصية بـregex على الملف الخام — الطريقة
 * السابقة كانت تُنتج أرقاماً خاطئة بصمت (بلا خطأ ظاهر) لأن أنماط id تختلف
 * بين ملفات seed (بعضها بمفاتيح مقتبسة "id": وبعضها بلا اقتباس id:، وبعضها
 * بادئات id متعددة غير موحّدة كـsheikhs-seed.ts، وqa-seed.ts فيه أيضاً مصفوفة
 * تصنيفات منفصلة تُطابق نفس نمط "id": فتُضخّم العدد). الاستيراد الفعلي يعكس
 * ما يُعرض للمستخدم فعلياً بدقة، لا تخمين نصي.
 *
 * التشغيل: npx tsx scripts/content-audit.mjs [--json]
 * (لا "node" مباشرة — راجع ملاحظة الاستيراد الديناميكي في hadith-takhrij-check.mjs)
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

async function main() {
  const { ADHKAR_ITEMS, ADHKAR_CATEGORIES } = await import(path.join(ROOT, "src/lib/adhkar-seed.ts"));
  const { MIRACLES_SEED } = await import(path.join(ROOT, "src/lib/miracles-seed.ts"));
  const { FAWAID_CURATED_SEED } = await import(path.join(ROOT, "src/lib/fawaid-curated-seed.ts"));
  const { SEED_FAWAID } = await import(path.join(ROOT, "src/lib/fawaid-seed.ts"));
  const { LIBRARY_CATALOG } = await import(path.join(ROOT, "src/lib/library-catalog.ts"));
  const { SHEIKHS_SEED } = await import(path.join(ROOT, "src/lib/sheikhs-seed.ts"));
  const { LESSONS_SEED } = await import(path.join(ROOT, "src/lib/lessons-seed.ts"));
  const { SEED_QA, QA_CATEGORIES } = await import(path.join(ROOT, "src/lib/qa-seed.ts"));
  const { SCHOLARS } = await import(path.join(ROOT, "src/lib/scholars-data.ts"));
  const { DEMO_QUIZ_QUESTIONS } = await import(path.join(ROOT, "src/lib/quiz-seed.ts"));
  const { ARBAEEN_NAWAWI } = await import(path.join(ROOT, "src/lib/arbaeen-nawawi-seed.ts"));

  const inventory = {
    adhkar: ADHKAR_ITEMS.length,
    adhkarCategories: ADHKAR_CATEGORIES.length,
    miracles: MIRACLES_SEED.length,
    fawaidCurated: FAWAID_CURATED_SEED.length,
    fawaidSeed: SEED_FAWAID.length,
    library: LIBRARY_CATALOG.length,
    sheikhs: SHEIKHS_SEED.length,
    lessons: LESSONS_SEED.length,
    qa: SEED_QA.length,
    qaCategories: QA_CATEGORIES.length,
    scholars: SCHOLARS.length,
    quizQuestions: DEMO_QUIZ_QUESTIONS.length,
    arbaeenNawawi: ARBAEEN_NAWAWI.length,
  };

  const report = { generatedAt: new Date().toISOString(), inventory };

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(JSON.stringify(report, null, 2));
  console.log("\n(هذه الأعداد مصدرها استيراد الوحدات فعلياً — راجع src/data/content-counts.json للأعداد الرسمية المُصدَّرة للواجهة.)");
}

main();
