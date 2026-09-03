/**
 * بوابة b073: متون فريدة لدروس الأسرة والمجتمع من الملخص المنقول بلا زيادة حكم.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b073-usra-bodies-gate.test.ts
 */
import assert from "node:assert/strict";
import { USRA_MUJTAMA } from "../usra-mujtama-data";

const FILLER = "يُؤخذ للعمل بضابط الدليل، دون توسع فيما لم يثبت";

const lessons = USRA_MUJTAMA.flatMap((s) => s.lessons || []);
assert.ok(lessons.length >= 72, `أسرة ومجتمع: ≥72 دروس (الآن ${lessons.length})`);
for (const lesson of lessons) {
  assert.ok((lesson.summary || "").trim().length >= 15, `${lesson.id}: ملخص`);
  assert.ok((lesson.body || "").trim().length >= 30, `${lesson.id}: متن موجز`);
  assert.doesNotMatch(lesson.body || "", new RegExp(FILLER), `${lesson.id}: بلا حشو ممنوع`);
}
const bodies = lessons.map((l) => (l.body || "").trim());
assert.equal(new Set(bodies).size, bodies.length, "أسرة ومجتمع: متون فريدة بلا تكرار حرفي");

console.log("content-audit-b073-usra-bodies-gate: ok");
