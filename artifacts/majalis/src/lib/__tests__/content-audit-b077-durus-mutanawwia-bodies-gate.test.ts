/**
 * بوابة b077: متون فريدة للدروس المتنوعة من الملخص المنقول بلا زيادة حكم.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b077-durus-mutanawwia-bodies-gate.test.ts
 */
import assert from "node:assert/strict";
import { DURUS_MUTANAWWIA } from "../durus-mutanawwia-data";

const FILLER = "يُؤخذ للعمل بضابط الدليل، دون توسع فيما لم يثبت";

const lessons = DURUS_MUTANAWWIA.flatMap((s) => s.lessons || []);
assert.ok(lessons.length >= 372, `دروس متنوعة: ≥372 دروس (الآن ${lessons.length})`);
for (const lesson of lessons) {
  assert.ok((lesson.summary || "").trim().length >= 15, `${lesson.id}: ملخص`);
  assert.ok((lesson.body || "").trim().length >= 30, `${lesson.id}: متن موجز`);
  assert.doesNotMatch(lesson.body || "", new RegExp(FILLER), `${lesson.id}: بلا حشو ممنوع`);
}
const bodies = lessons.map((l) => (l.body || "").trim());
assert.equal(new Set(bodies).size, bodies.length, "دروس متنوعة: متون فريدة بلا تكرار حرفي");

console.log("content-audit-b077-durus-mutanawwia-bodies-gate: ok");
