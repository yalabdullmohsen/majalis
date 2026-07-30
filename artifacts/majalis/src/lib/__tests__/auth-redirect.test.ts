/**
 * sanitizeAuthNext + روابط callback على majlisilm.com
 * تشغيل: npx tsx src/lib/__tests__/auth-redirect.test.ts
 */
import assert from "node:assert/strict";
import { getAuthCallbackUrl, getAuthEmailRedirectUrl, sanitizeAuthNext } from "../auth-redirect";

assert.equal(sanitizeAuthNext(null), "/");
assert.equal(sanitizeAuthNext(""), "/");
assert.equal(sanitizeAuthNext("/fiqh"), "/fiqh");
assert.equal(sanitizeAuthNext("/mushaf/page/1"), "/mushaf/page/1");
assert.equal(sanitizeAuthNext("//evil.com"), "/");
assert.equal(sanitizeAuthNext("https://evil.com"), "/");
assert.equal(sanitizeAuthNext("/path?x=1"), "/"); // query مرفوض بالنمط الحالي
assert.equal(sanitizeAuthNext("javascript:alert(1)"), "/");
assert.equal(sanitizeAuthNext("/ok-path_1."), "/ok-path_1.");

assert.equal(getAuthCallbackUrl(), "https://majlisilm.com/auth/callback");
assert.equal(
  getAuthCallbackUrl("/fiqh"),
  "https://majlisilm.com/auth/callback?next=%2Ffiqh",
);
assert.equal(getAuthEmailRedirectUrl("//evil"), "https://majlisilm.com/auth/callback");
assert.equal(
  getAuthCallbackUrl("https://phish.test"),
  "https://majlisilm.com/auth/callback",
);

console.log("auth-redirect.test.ts: ok");
