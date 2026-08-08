/**
 * تطبيع البحث المشترك + انتقال المصحف بالأرقام العربية/الإنجليزية.
 * تشغيل: node --import tsx src/features/search/__tests__/search-normalize-digits.test.ts
 */
import assert from "node:assert/strict";
import {
  clearNormalizeArabicCache,
  normalizeArabic,
  normalizeForSearch,
  toWesternDigits,
  normalizedIncludes,
} from "@/shared/arabic-normalize";
import { parseMushafJumpQuery } from "@/features/search/mushaf-jump";
import { parseQuickNav } from "@/features/search/quick-nav";

clearNormalizeArabicCache();

// ── أرقام ──────────────────────────────────────────────────────────────
assert.equal(toWesternDigits("٢٨٣"), "283");
assert.equal(toWesternDigits("۲۸۳"), "283"); // فارسية
assert.equal(toWesternDigits("283"), "283");
assert.equal(normalizeForSearch("صفحة ٢٨٣"), normalizeForSearch("صفحة 283"));
assert.equal(normalizeArabic("٢:٢٥٥"), "2:255");

// ── حروف ───────────────────────────────────────────────────────────────
assert.equal(normalizeArabic("أإآٱ"), "اااا");
assert.equal(normalizeArabic("القرآن"), "القران");
assert.equal(normalizeArabic("ى"), "ي");
assert.equal(normalizeArabic("الصلاة"), "الصلاه");
assert.equal(normalizeArabic("بِسْمِ"), "بسم");
assert.equal(normalizeArabic("مدّـ"), "مد"); // تطويل + تشكيل
assert.ok(normalizedIncludes("سورة البقرة", "بقره"));
assert.ok(normalizedIncludes("سورة البقرة", "البقرة"));

// محارف غير مرئية
assert.equal(normalizeArabic("الب\u200Bقرة"), normalizeArabic("البقرة"));

// ── انتقال مصحف ────────────────────────────────────────────────────────
assert.deepEqual(parseMushafJumpQuery("283"), { kind: "page", page: 283 });
assert.deepEqual(parseMushafJumpQuery("٢٨٣"), { kind: "page", page: 283 });
assert.deepEqual(parseMushafJumpQuery("۲۸۳"), { kind: "page", page: 283 });

const ayah = parseMushafJumpQuery("2:255");
assert.ok(ayah && ayah.kind === "ayah");
if (ayah?.kind === "ayah") {
  assert.equal(ayah.surah, 2);
  assert.equal(ayah.ayah, 255);
}

const ayahAr = parseMushafJumpQuery("٢:٢٥٥");
assert.ok(ayahAr && ayahAr.kind === "ayah" && ayahAr.surah === 2 && ayahAr.ayah === 255);

const baqara = parseMushafJumpQuery("البقرة");
assert.ok(baqara && baqara.kind === "page" && baqara.page === 2);

const baqaraShort = parseMushafJumpQuery("بقرة");
assert.ok(baqaraShort && baqaraShort.kind === "page" && baqaraShort.page === 2);

const en = parseMushafJumpQuery("al-baqarah");
assert.ok(en && en.kind === "page" && en.page === 2);

const en2 = parseMushafJumpQuery("baqara");
assert.ok(en2 && en2.kind === "page" && en2.page === 2);

const namedAyah = parseMushafJumpQuery("البقرة 255");
assert.ok(namedAyah && namedAyah.kind === "ayah" && namedAyah.surah === 2 && namedAyah.ayah === 255);

const namedAyahAr = parseMushafJumpQuery("البقرة ٢٥٥");
assert.ok(namedAyahAr && namedAyahAr.kind === "ayah" && namedAyahAr.ayah === 255);

assert.equal(parseMushafJumpQuery("0"), null);
assert.equal(parseMushafJumpQuery("999"), null);
assert.equal(parseMushafJumpQuery(""), null);

// quick-nav يمر بنفس المسار
const qNav = parseQuickNav("٢٨٣");
assert.ok(qNav?.href.includes("/mushaf/page/283"));
const qAyah = parseQuickNav("٢:٢٥٥");
assert.ok(qAyah?.href.includes("ayah=2:255") || qAyah?.titleAr.includes("2:255"));

console.log("search-normalize-digits.test.ts: ok");
