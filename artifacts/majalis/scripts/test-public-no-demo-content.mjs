#!/usr/bin/env node
/**
 * Tests — Production Guard + public content sanitization.
 */
import {
  isTestContent,
  collectTestContentSignals,
  guardPublishRecord,
  sanitizePublicText,
  filterPublicRecords,
} from "../lib/production-guard.mjs";

let failed = 0;
let passed = 0;

function assert(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`✓ ${name}`);
  } else {
    failed += 1;
    console.error(`✗ ${name}`);
  }
}

console.log("Public no-demo-content tests\n");

assert("detects Phase 2 trial lesson", isTestContent({
  title: "درس تجريبي — أصول الفقه (Phase 2)",
  mosque: "مسجد تجريبي Phase2",
}));
assert("detects e2e-test marker", isTestContent({ text: "e2e-test-1 sample content here" }));
assert("detects import marker in text", isTestContent({ text: "فائدة نافعة [import-3]" }));
assert("detects timestamp job id", isTestContent({ text: "content [1782605184864-0]" }));
assert("allows real lesson", isTestContent({
  title: "تفسير سورة النحل",
  mosque: "مسجد موضي",
  speaker_name: "د. عثمان بن محمد الخميس",
}) === false);

const guard = guardPublishRecord({ text: "demo content test" });
assert("guard rejects test content", guard.rejected === true && guard.allowed === false);

const cleaned = sanitizePublicText("فائدة: نوح — سؤال؟ [import-1]");
assert("sanitize strips [import-N]", !cleaned.includes("[import-1]") && cleaned.includes("نوح"));

const filtered = filterPublicRecords([
  { text: "فائدة حقيقية عن الصبر" },
  { text: "e2e-test-3" },
]);
assert("filterPublicRecords removes test rows", filtered.length === 1);

const signals = collectTestContentSignals({ created_by: "e2e-test", filename: "fawaid_500.csv" });
assert("detects e2e in metadata fields", signals.length > 0);

const BANNED_IN_PUBLIC = ["e2e-test-1", "[import-1]"];
for (const banned of BANNED_IN_PUBLIC) {
  assert(`sanitized text excludes «${banned}»`, !sanitizePublicText(`x ${banned} y`).includes(banned));
}

assert("Arabic trial content blocked at guard", isTestContent({ title: "مسجد تجريبي", mosque: "الكويت" }));
assert("Arabic trial lesson blocked at guard", isTestContent({ title: "درس تجريبي — أصول الفقه" }));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
