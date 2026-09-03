/**
 * بوابة b071: متون فريدة لدروس السنة والإيمان + تنظيف بقايا «مكتبة» العلنية.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b071-sunnah-iman-bodies-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SUNNAH_STUDIES } from "../sunnah-studies-data";
import { IMAN_TOPICS } from "../iman-topics-data";
import type { DarsSection } from "../dars-types";

const FILLER = "يُؤخذ للعمل بضابط الدليل، دون توسع فيما لم يثبت";
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function assertLessonsHaveBodies(label: string, sections: DarsSection[], minLessons: number) {
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

assertLessonsHaveBodies("دروس السنة", SUNNAH_STUDIES, 51);
assertLessonsHaveBodies("موضوعات الإيمان", IMAN_TOPICS, 78);

const hub = readFileSync(resolve(appRoot, "src/views/learn/LearnHubPage.tsx"), "utf8");
assert.match(hub, /eyebrow="فهرس الدروس"/, "تعلّم: فهرس الدروس");
assert.doesNotMatch(hub, /مكتبة الدروس/, "تعلّم بلا مكتبة الدروس");

const search = readFileSync(resolve(appRoot, "src/components/GlobalSearchModal.tsx"), "utf8");
assert.match(search, /key:\s*"book",\s*label:\s*"مراجع"/, "بحث: شريحة مراجع");
assert.doesNotMatch(search, /label:\s*"مكتبة"/, "بحث بلا شريحة مكتبة");

const duas = readFileSync(resolve(appRoot, "src/pages/worship/ui/DuasView.tsx"), "utf8");
assert.match(duas, /فهرس الأدعية الشرعية/, "أدعية: فهرس");
assert.doesNotMatch(duas, /مكتبة الأدعية/, "أدعية بلا مكتبة الأدعية");

const research = readFileSync(resolve(appRoot, "src/views/ResearchDetailPage.tsx"), "utf8");
assert.match(research, /العودة إلى الأبحاث/, "أبحاث: عودة صحيحة");
assert.doesNotMatch(research, /العودة للمكتبة/, "أبحاث بلا العودة للمكتبة");

console.log("content-audit-b071-sunnah-iman-bodies-gate: ok");
