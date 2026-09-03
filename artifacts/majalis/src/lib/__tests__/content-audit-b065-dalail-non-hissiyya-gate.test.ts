/**
 * بوابة b065: دلائل النبوة — الأقسام غير الحسّية بمتون موجزة فريدة،
 * مع تمييز دروس كتب الدلائل عن تكرار عناوين المعجزات الحسّية.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b065-dalail-non-hissiyya-gate.test.ts
 */
import assert from "node:assert/strict";
import { DALAIL_NUBUWWAH } from "../dalail-nubuwwah-data";

const FILLER = "يُؤخذ للعمل بضابط الدليل، دون توسع فيما لم يثبت";
const NON_HISSIYYA = [
  "muqaddimah-dalail",
  "dalail-qawliyya",
  "dalail-khuluqiyya",
  "bishara-kutub-sabiqa",
  "manhaj-dalail",
  "dalail-kutub",
] as const;

const hissiyya = DALAIL_NUBUWWAH.find((s) => s.id === "dalail-hissiyya");
assert.ok(hissiyya, "باب الدلائل الحسّية");
const hissiyyaTitles = new Set((hissiyya!.lessons || []).map((l) => l.title.trim()));

const targetLessons = NON_HISSIYYA.flatMap((id) => {
  const section = DALAIL_NUBUWWAH.find((s) => s.id === id);
  assert.ok(section, `قسم ${id}`);
  return section!.lessons || [];
});

assert.ok(targetLessons.length >= 30, `≥30 درسًا غير حسّي (الآن ${targetLessons.length})`);

for (const lesson of targetLessons) {
  assert.ok((lesson.summary || "").trim().length >= 15, `${lesson.id}: ملخص`);
  assert.ok((lesson.body || "").trim().length >= 30, `${lesson.id}: متن موجز`);
  assert.doesNotMatch(lesson.body || "", new RegExp(FILLER), `${lesson.id}: بلا حشو ممنوع`);
  // يمنع الاعتماد على منام/سند معدوم كدليل؛ ويسمح بذكر «الموضوع» نهيًا عنه في المنهج.
  assert.doesNotMatch(
    lesson.body || "",
    /منام|يثبت\s*بلا\s*سند|معجزة\s*موضوع/,
    `${lesson.id}: بلا صياغة ضعيفة`,
  );
}

const bodies = targetLessons.map((l) => (l.body || "").trim());
assert.equal(new Set(bodies).size, bodies.length, "متون غير حسّية فريدة بلا تكرار حرفي");

const kutub = DALAIL_NUBUWWAH.find((s) => s.id === "dalail-kutub");
assert.ok(kutub, "قسم كتب الدلائل");
for (const lesson of kutub!.lessons || []) {
  assert.ok(
    !hissiyyaTitles.has(lesson.title.trim()),
    `${lesson.id}: عنوان كتب الدلائل لا يكرر عنوانًا حسّيًا حرفيًا`,
  );
}

for (const section of DALAIL_NUBUWWAH) {
  for (const lesson of section.lessons || []) {
    assert.ok((lesson.summary || "").trim().length >= 15, `${lesson.id}: كل درس له ملخص`);
    assert.ok((lesson.body || "").trim().length >= 20, `${lesson.id}: كل درس له متن`);
  }
}

console.log("content-audit-b065-dalail-non-hissiyya-gate: ok");
