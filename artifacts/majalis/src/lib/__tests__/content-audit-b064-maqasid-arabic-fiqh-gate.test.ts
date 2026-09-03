/**
 * بوابة b064: إثراء متون مقاصد الشريعة واللغة العربية + أبواب الفقه الداعمة غير فارغة.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b064-maqasid-arabic-fiqh-gate.test.ts
 */
import assert from "node:assert/strict";
import { MAQASID_SHARIA } from "../maqasid-sharia-data";
import { ARABIC_LANGUAGE } from "../arabic-language-data";
import { buildFiqhDoorSummaries } from "../fiqh/fiqhNormalize";

const FILLER = "يُؤخذ للعمل بضابط الدليل، دون توسع فيما لم يثبت";

function assertLessonsHaveBodies(
  label: string,
  sections: typeof MAQASID_SHARIA,
  minLessons: number,
) {
  const lessons = sections.flatMap((s) => s.lessons || []);
  assert.ok(lessons.length >= minLessons, `${label}: ≥${minLessons} دروس (الآن ${lessons.length})`);
  for (const lesson of lessons) {
    assert.ok((lesson.summary || "").trim().length >= 15, `${lesson.id}: ملخص`);
    assert.ok((lesson.body || "").trim().length >= 30, `${lesson.id}: متن موجز`);
    assert.doesNotMatch(lesson.body || "", new RegExp(FILLER), `${lesson.id}: بلا حشو ممنوع`);
  }
  const bodies = lessons.map((l) => (l.body || "").trim());
  assert.equal(new Set(bodies).size, bodies.length, `${label}: متون فريدة بلا تكرار حرفي`);
}

assertLessonsHaveBodies("مقاصد", MAQASID_SHARIA, 40);
assertLessonsHaveBodies("لغة عربية", ARABIC_LANGUAGE, 70);

const doors = buildFiqhDoorSummaries();
for (const id of ["usul", "qawaid", "nawazil"] as const) {
  const door = doors.find((d) => d.id === id);
  assert.ok(door, `باب ${id}`);
  assert.ok(door!.hasVerifiedIssueCount, `${id}: عدّاد موثّق`);
  assert.ok(door!.issueCount > 0, `${id}: محتوى محسوب > 0`);
  assert.equal(door!.status, "complete", `${id}: حالة مكتملة للباب الداعم`);
}

console.log("content-audit-b064-maqasid-arabic-fiqh-gate: ok");
