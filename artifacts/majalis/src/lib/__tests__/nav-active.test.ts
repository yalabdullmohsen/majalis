/**
 * اختبار مطابقة المسار النشط — يمنع التباس البادئات في «المزيد» والشريط.
 * تشغيل: npx tsx src/lib/__tests__/nav-active.test.ts
 */
import assert from "node:assert/strict";
import { isNavHrefActive } from "../nav-active";

assert.equal(isNavHrefActive("/", "/"), true);
assert.equal(isNavHrefActive("/hadith", "/"), false);

assert.equal(isNavHrefActive("/hadith", "/hadith"), true);
assert.equal(isNavHrefActive("/hadith/sahih", "/hadith"), true);
assert.equal(isNavHrefActive("/hadith?tab=1", "/hadith"), true);
assert.equal(isNavHrefActive("/hadith-science", "/hadith"), false, "لا يفعّل /hadith على /hadith-science");
assert.equal(isNavHrefActive("/hadith-science", "/hadith-science"), true);

assert.equal(isNavHrefActive("/fiqh-council", "/fiqh"), false, "لا يفعّل /fiqh على /fiqh-council");
assert.equal(isNavHrefActive("/fiqh/chapter", "/fiqh"), true);
assert.equal(isNavHrefActive("/arkan-iman", "/arkan"), false);
assert.equal(isNavHrefActive("/quran-hub/tafsir", "/quran-hub"), true);
assert.equal(isNavHrefActive("/mushaf/page/1", "/mushaf"), true);

console.log("nav-active.test.ts: ok");
