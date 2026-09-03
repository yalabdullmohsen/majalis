/**
 * بوابة b075: متون فريدة لدروس الفكر والواقع من الملخص المنقول بلا زيادة حكم.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b075-fikr-bodies-gate.test.ts
 */
import assert from "node:assert/strict";
import { FIKR_WAQIA } from "../fikr-waqia-data";

const FILLER = "يُؤخذ للعمل بضابط الدليل، دون توسع فيما لم يثبت";

const lessons = FIKR_WAQIA.flatMap((s) => s.lessons || []);
assert.ok(lessons.length >= 105, `فكر وواقع: ≥105 دروس (الآن ${lessons.length})`);
for (const lesson of lessons) {
  assert.ok((lesson.summary || "").trim().length >= 15, `${lesson.id}: ملخص`);
  assert.ok((lesson.body || "").trim().length >= 30, `${lesson.id}: متن موجز`);
  assert.doesNotMatch(lesson.body || "", new RegExp(FILLER), `${lesson.id}: بلا حشو ممنوع`);
}
const bodies = lessons.map((l) => (l.body || "").trim());
assert.equal(new Set(bodies).size, bodies.length, "فكر وواقع: متون فريدة بلا تكرار حرفي");

console.log("content-audit-b075-fikr-bodies-gate: ok");
