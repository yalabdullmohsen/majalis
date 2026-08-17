/**
 * اختبارات تصنيف الأحكام وresolver — تمنع أسئلة المسابقة تحت /rulings.
 * التشغيل: node --import tsx src/lib/__tests__/rulings-resolver.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const archiveSeedPath = resolve(root, "content/archive/rulings-encyclopedia/seeds/rulings-encyclopedia-seed.generated.ts");

function loadArchiveSeedSample() {
  const src = readFileSync(archiveSeedPath, "utf8");
  const match = src.match(/"external_key":\s*"([^"]+)"/);
  return match?.[1] ?? "ruling-wudu-nullifiers";
}

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

  const audit = auditRulingPublicationRows([]);
  assert(audit.total === 0, "empty seed audit");
  assert(audit.publicEligible === 0, "no public in stub");
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

  const sampleKey = loadArchiveSeedSample();
  assert(Boolean(sampleKey), "archive seed sample key");

  const blocked = evaluateRulingRecord(sampleKey, {
    id: sampleKey,
    external_key: sampleKey,
    title: "عينة من الأرشيف",
    body: "نص كافٍ",
    category: "الطهارة",
    verification_status: "pending_review",
    status: "pending_review",
  });
  assert(blocked.status === "unpublished", "pending seed → unpublished");
  assert(httpStatusForRulingResolve(blocked.status) === 404, "HTTP 404 unpublished");

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
