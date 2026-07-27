/**
 * اختبار فهرس الحرف/الرقم للأحاديث.
 * تشغيل: pnpm exec tsx src/lib/__tests__/hadith-access.test.ts
 */
import assert from "node:assert/strict";
import {
  hadithIndexLetter,
  hadithMatchesLetter,
  hadithNumberMatches,
  normalizeHadithDigits,
} from "../hadith-access";

assert.equal(normalizeHadithDigits("١٢٣"), "123");
assert.equal(normalizeHadithDigits("حديث #٤٢"), "42");
assert.equal(hadithNumberMatches("7563", "٧٥٦٣"), true);
assert.equal(hadithNumberMatches("100", "10"), true);
assert.equal(hadithNumberMatches("100", "101"), false);

assert.equal(hadithIndexLetter("حب الوطن من الإيمان", null), "ح");
assert.equal(hadithIndexLetter("اطلبوا العلم ولو بالصين", "نص"), "ا");
assert.equal(
  hadithIndexLetter(null, 'قال رسول الله صلى الله عليه وسلم: "إنما الأعمال بالنيات"'),
  "ا",
);
assert.equal(hadithMatchesLetter("الصلاة عماد الدين", null, "ص"), true);
assert.equal(hadithMatchesLetter("نية المؤمن", "نص عن الإيمان", "ز"), false);

console.log("hadith-access.test.ts: ok");
