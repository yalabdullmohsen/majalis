/**
 * بوابة b063: دلائل النبوة — باب الحسّيات بملخص ومتن، بلا تكرار عنوان استجابة الدعاء.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b063-dalail-gate.test.ts
 */
import assert from "node:assert/strict";
import { DALAIL_NUBUWWAH } from "../dalail-nubuwwah-data";

const hissiyya = DALAIL_NUBUWWAH.find((s) => s.id === "dalail-hissiyya");
assert.ok(hissiyya, "باب الدلائل الحسّية");
assert.ok((hissiyya!.lessons?.length || 0) >= 10, "≥10 دروس حسّية");

const titles = (hissiyya!.lessons || []).map((l) => l.title);
assert.equal(new Set(titles).size, titles.length, "عناوين حسّية فريدة");
assert.ok(!titles.some((t) => t === "استجابة دعائه ﷺ"), "لا عنوان مكرر لاستجابة الدعاء");

for (const lesson of hissiyya!.lessons || []) {
  assert.ok((lesson.summary || "").trim().length >= 20, `${lesson.id}: ملخص`);
  assert.ok((lesson.body || "").trim().length >= 20, `${lesson.id}: متن موجز`);
  assert.doesNotMatch(lesson.body || "", /موضوع|بلا سند|منام/, `${lesson.id}: بلا صياغة ضعيفة`);
}

for (const section of DALAIL_NUBUWWAH) {
  for (const lesson of section.lessons || []) {
    assert.ok((lesson.summary || "").trim().length >= 15, `${lesson.id}: كل درس له ملخص`);
  }
}

console.log("content-audit-b063-dalail-gate: ok");
