/**
 * اختبارات تصنيف الأحكام وresolver — تمنع أسئلة المسابقة تحت /rulings.
 * التشغيل: node --import tsx src/lib/__tests__/rulings-resolver.test.ts
 */
import {
  classifyRulingIdentifier,
  inferRulingContentType,
  isAllowedOnRulingsRoute,
} from "../rulings-content-type";
import {
  auditRulingPublicationRows,
  isPubliclyPublishedRuling,
} from "../rulings-publication-gate";
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

console.log("\n=== بوابة النشر العامة ===");
{
  assert(
    !isPubliclyPublishedRuling({
      title: "حضانة",
      body: "نص طويل بما يكفي",
      verification_status: "pending_review" as never,
      status: "approved",
    }),
    "pending_review not public",
  );
  assert(
    isPubliclyPublishedRuling({
      title: "حكم معتمد",
      body: "نص الحكم المعتمد بما يكفي للعرض",
      verification_status: "approved",
      status: "approved",
    }),
    "approved+approved public",
  );

  const audit = auditRulingPublicationRows(RULINGS_ENCYCLOPEDIA_SEED);
  assert(audit.total === RULINGS_ENCYCLOPEDIA_SEED.length, "audit total");
  assert(audit.publicEligible === 0, `seed publicEligible=0 (actual ${audit.publicEligible})`);
  assert(audit.needs_review > 0, "seed needs_review > 0");
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
    const visible = evaluateRulingRecord(sample.external_key || sample.id, sample);
    assert(visible.status === "found", "pending seed → found (مرئي مع تنبيه)");
    assert(httpStatusForRulingResolve(visible.status) === 200, "HTTP 200 pending visible");
  }

  const draft = evaluateRulingRecord("ruling-draft-sample", {
    id: "ruling-draft-sample",
    external_key: "ruling-draft-sample",
    title: "مسودة",
    body: "نص مسودة",
    category: "الطهارة",
    verification_status: "draft",
    status: "draft",
  });
  assert(draft.status === "unpublished", "draft → unpublished");
  assert(httpStatusForRulingResolve(draft.status) === 404, "HTTP 404 draft");

  const published = evaluateRulingRecord("ruling-approved-sample", {
    id: "ruling-approved-sample",
    external_key: "ruling-approved-sample",
    title: "حكم معتمد للاختبار",
    body: "نص حكم معتمد بما يكفي للتحقق من البوابة",
    category: "الطهارة",
    verification_status: "approved",
    status: "approved",
  });
  assert(published.status === "found", "approved found");
  assert(httpStatusForRulingResolve(published.status) === 200, "HTTP 200 approved");

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
