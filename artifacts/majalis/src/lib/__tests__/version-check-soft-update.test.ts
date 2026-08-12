/**
 * بوابة: التحديث عبر شيت اختياري — لا ثابت إعادة تحميل قسرية.
 * تشغيل: npx tsx src/lib/__tests__/version-check-soft-update.test.ts
 */
import assert from "node:assert/strict";
import * as versionCheck from "../version-check";

assert.ok(versionCheck.VERSION_CHECK_INTERVAL_MS > 0);
assert.equal(
  "AUTO_RELOAD_GRACE_MS" in versionCheck,
  false,
  "AUTO_RELOAD_GRACE_MS يجب ألا يُصدَّر — التحديث عبر شيت فقط",
);
assert.equal(typeof versionCheck.isNewVersionAvailable, "function");
assert.equal(typeof versionCheck.getLoadedCommit, "function");
console.log("  ✓ version-check soft update (لا إعادة تحميل قسرية)");
