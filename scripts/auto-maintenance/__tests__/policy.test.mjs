/**
 * اختبارات سياسة الصيانة التلقائية.
 * تشغيل: node --test scripts/auto-maintenance/__tests__/policy.test.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAutoApply,
  classifyFinding,
  isShariaSensitivePath,
  RISK,
  AUTOMATION_CONTRACT,
} from "../policy.mjs";

test("مسارات شرعية تُكتشف", () => {
  assert.equal(isShariaSensitivePath("artifacts/majalis/public/data/hadith/foo.json"), true);
  assert.equal(isShariaSensitivePath("artifacts/majalis/src/features/mushaf-madinah/x.ts"), true);
  assert.equal(isShariaSensitivePath("artifacts/majalis/public/data/sources/instagram-quota.json"), false);
});

test("لا إصلاح تلقائي لنص شرعي", () => {
  assert.equal(
    canAutoApply({ kind: "empty-optional-url", path: "artifacts/majalis/data/hadith/x.json" }),
    false,
  );
  assert.equal(
    classifyFinding({ kind: "sharia-text-change", path: "a.json" }),
    RISK.NEEDS_CONTENT_REVIEW,
  );
});

test("إصلاح كاش آمن مسموح", () => {
  assert.equal(
    canAutoApply({ kind: "cache-header-contract", path: "artifacts/majalis/vercel.json" }),
    true,
  );
  assert.equal(
    classifyFinding({ kind: "cache-header-contract", path: "artifacts/majalis/vercel.json" }),
    RISK.SAFE_AUTO,
  );
});

test("major dependency و auth محظوران", () => {
  assert.equal(classifyFinding({ kind: "dependency-major" }), RISK.BLOCKED);
  assert.equal(classifyFinding({ kind: "auth-change" }), RISK.BLOCKED);
  assert.equal(canAutoApply({ kind: "dependency-major" }), false);
});

test("عقد الأتمتة موثّق", () => {
  assert.ok(AUTOMATION_CONTRACT.automatic.length >= 3);
  assert.ok(AUTOMATION_CONTRACT.neverAutomatic.length >= 3);
  assert.ok(AUTOMATION_CONTRACT.humanApproval.length >= 2);
});

console.log("auto-maintenance policy.test.mjs: ok");
