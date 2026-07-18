/**
 * اختبارات confidence-scorer — src/lib/recitation-ai/confidence-scorer.ts
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/confidence-scorer.test.ts
 */
import { formatTajweedNoteMessage, confidenceBand, overallSessionConfidence, TAJWEED_CONFIDENCE_THRESHOLD } from "../confidence-scorer";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

console.log("═══ formatTajweedNoteMessage — قاعدة الصدق العلمي ═══");
{
  const high = formatTajweedNoteMessage("المدّ اللازم", "الضّالّين", 90);
  assert(!high.includes("قد توجد"), "ثقة عالية (90%) ← جزم مباشر بلا تحوّط");

  const low = formatTajweedNoteMessage("الغنة", "من ربهم", 60);
  assert(low.includes("قد توجد"), "ثقة منخفضة (60%) ← صيغة تحوّط \"قد توجد\"");

  const boundary = formatTajweedNoteMessage("الإدغام", "كلمة", TAJWEED_CONFIDENCE_THRESHOLD);
  assert(!boundary.includes("قد توجد"), "عند العتبة بالضبط (85%) ← لا تحوّط (>=)");
}

console.log("═══ confidenceBand ═══");
{
  assert(confidenceBand(95) === "high", "95% ← high");
  assert(confidenceBand(70) === "medium", "70% ← medium");
  assert(confidenceBand(30) === "low", "30% ← low");
}

console.log("═══ overallSessionConfidence ═══");
{
  assert(overallSessionConfidence([]) === 0, "مصفوفة فارغة ← 0");
  assert(overallSessionConfidence([90, 80, 100]) === 90, "متوسط [90,80,100] = 90");
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
