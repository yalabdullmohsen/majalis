/**
 * يحرس إصلاحات PR #602 الحرجة:
 * 1) qa-to-quiz.ts يحوّل SEED_QA دون أخطاء نوع، وينتج صفوفًا صالحة.
 * 2) recent-pages.ts لا يكرّر مفتاح "/quiz".
 *
 * تشغيل: npx tsx src/lib/__tests__/pr602-critical-fixes.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { qaSeedToQuizQuestions } from "../qa-to-quiz";
import { QA_CATEGORIES } from "../qa-seed";

const __dirname = dirname(fileURLToPath(import.meta.url));
const libRoot = resolve(__dirname, "..");

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== qa-to-quiz — تحويل آمن typed ===");
{
  const rows = await qaSeedToQuizQuestions();
  assert(rows.length > 0, `يُنتج أسئلة (الفعلي: ${rows.length})`);
  assert(rows.every((r) => Boolean(r.question && r.answer && r.section)), "كل صف له سؤال وإجابة وقسم");
  assert(rows.every((r) => String(r.id || "").startsWith("qa-")), "معرّفات الصفوف مسبوقة بـ qa-");

  const knownSlugs = new Set(QA_CATEGORIES.map((c) => c.slug));
  assert(knownSlugs.has("sahabah"), "تصنيف الصحابة موجود في QA_CATEGORIES");

  const sample = rows.find((r) => r.id === "qa-seed-qa-1");
  assert(Boolean(sample), "السؤال الأول من البذرة موجود بعد التحويل");
  if (sample) {
    assert(sample.section.length > 0, "القسم المحلول غير فارغ");
    assert(!/^الجواب\s*[:：]/u.test(sample.answer), "بادئة «الجواب:» أُزيلت من الإجابة");
  }

  const ids = rows.map((r) => r.id || "");
  assert(new Set(ids).size === ids.length, "لا تكرار في معرّفات الأسئلة المحوّلة");
}

console.log("\n=== recent-pages — /qa و /quiz منفصلان ===");
{
  const src = readFileSync(resolve(libRoot, "recent-pages.ts"), "utf8");
  const quizKeys = [...src.matchAll(/^\s*"(\/quiz)"\s*:/gm)].map((m) => m[1]);
  const qaKeys = [...src.matchAll(/^\s*"(\/qa)"\s*:/gm)].map((m) => m[1]);
  assert(quizKeys.length === 1, `مفتاح "/quiz" يظهر مرة واحدة فقط (الفعلي: ${quizKeys.length})`);
  assert(qaKeys.length === 1, `مفتاح "/qa" يظهر مرة واحدة فقط (الفعلي: ${qaKeys.length})`);
  assert(/"\/quiz"\s*:\s*"لعبة سين جيم"/.test(src), 'تسمية "/quiz" هي «لعبة سين جيم»');
  assert(/"\/qa"\s*:\s*"الأسئلة والأجوبة"/.test(src), 'تسمية "/qa" هي «الأسئلة والأجوبة»');
}

console.log(`\n=== النتيجة: ${passed} نجاح، ${failed} فشل ===`);
if (failed > 0) process.exit(1);
