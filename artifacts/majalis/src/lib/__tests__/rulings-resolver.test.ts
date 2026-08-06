/**
 * اختبارات تصنيف الأحكام وresolver — تمنع أسئلة المسابقة تحت /rulings.
 * التشغيل: node --import tsx src/lib/__tests__/rulings-resolver.test.ts
 */
import {
  classifyRulingIdentifier,
  inferRulingContentType,
  isAllowedOnRulingsRoute,
} from "../rulings-content-type";
import { evaluateRulingRecord, httpStatusForRulingResolve } from "../rulings-resolver";
import { RULINGS_ENCYCLOPEDIA_SEED } from "../rulings-encyclopedia-seed.generated";

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

console.log("\n=== تصنيف المعرفات ===");
assert(classifyRulingIdentifier("ruling-wudu-nullifiers") === "slug", "slug");
assert(classifyRulingIdentifier("344d4442-a87f-4961-b9be-6f2df20c5933") === "uuid", "uuid");
assert(classifyRulingIdentifier("qa-ruling-seed-qa-1005") === "legacyId", "legacyId");
assert(classifyRulingIdentifier("") === "invalid", "invalid empty");

console.log("\n=== عزل أسئلة المسابقة عن /rulings ===");
assert(
  !isAllowedOnRulingsRoute({
    id: "qa-ruling-seed-qa-1005",
    external_key: "qa-ruling-seed-qa-1005",
    title: "النبي الذي كلمه الله تكليماً؟",
  }),
  "qa-ruling disallowed",
);
assert(
  inferRulingContentType({ external_key: "qa-ruling-x", title: "سؤال؟" }) === "quizQuestion",
  "infer quizQuestion",
);
assert(
  isAllowedOnRulingsRoute({
    id: "ruling-wudu-nullifiers",
    external_key: "ruling-wudu-nullifiers",
    title: "نواقض الوضوء",
  }),
  "real ruling allowed",
);

console.log("\n=== البذرة المولَّدة خالية من QA ===");
{
  const bad = RULINGS_ENCYCLOPEDIA_SEED.filter((r) => !isAllowedOnRulingsRoute(r));
  assert(bad.length === 0, `no QA in seed (bad=${bad.length})`);
  assert(RULINGS_ENCYCLOPEDIA_SEED.length > 0, `seed not empty (${RULINGS_ENCYCLOPEDIA_SEED.length})`);
}

console.log("\n=== نتائج الـ resolver ===");
{
  const wrong = evaluateRulingRecord("qa-ruling-seed-qa-1005", {
    id: "qa-ruling-seed-qa-1005",
    external_key: "qa-ruling-seed-qa-1005",
    title: "النبي الذي كلمه الله تكليماً؟",
    body: "موسى عليه السلام",
    category: "العقيدة",
  });
  assert(wrong.status === "wrongContentType", "wrongContentType for quiz");
  assert(httpStatusForRulingResolve(wrong.status) === 404, "HTTP 404 for wrong type");

  const sample = RULINGS_ENCYCLOPEDIA_SEED.find((r) => (r.external_key || r.id || "").startsWith("ruling-"));
  assert(Boolean(sample), "sample ruling exists");
  if (sample) {
    const found = evaluateRulingRecord(sample.external_key || sample.id, sample);
    assert(found.status === "found", "found real ruling");
    assert((found.data?.body?.length || 0) > 20, "body present");
  }

  const removed = evaluateRulingRecord("ruling-x", {
    id: "ruling-x",
    title: "حكم",
    body: "نص كافٍ للعرض",
    category: "الطهارة",
    verification_status: "archived",
  });
  assert(removed.status === "removed", "removed/archived");
  assert(httpStatusForRulingResolve(removed.status) === 410, "HTTP 410");
}

console.log(`\nالنتيجة: ${passed} نجاح / ${failed} فشل`);
if (failed) process.exit(1);
