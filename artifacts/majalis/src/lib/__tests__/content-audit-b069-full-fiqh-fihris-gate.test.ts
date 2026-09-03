/**
 * بوابة b069: لا كتاب فقهي دون 4 مسائل؛ الفهرس منشور بلا طابور مراجعة بشرية.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b069-full-fiqh-fihris-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getAllFiqhBooks, listPublishedLessons } from "../fiqh-books";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const thin = [];
for (const book of getAllFiqhBooks()) {
  const lessons = book.chapters.reduce((n, c) => n + c.lessons.length, 0);
  if (book.chapters.length < 4 || lessons < 4) {
    thin.push(`${book.id}:${book.chapters.length}/${lessons}`);
  }
}
assert.equal(thin.length, 0, `لا كتاب دون 4 أبواب/مسائل: ${thin.join(", ")}`);

const fihris = listPublishedLessons().filter((h) => h.lesson.id.endsWith("-fihris"));
assert.ok(fihris.length >= 80, `فهرس منشور كافٍ (الآن ${fihris.length})`);
for (const { lesson } of fihris) {
  assert.match(lesson.summary, /فهرس هيكلي/, `${lesson.id}: ملخص فهرسي`);
  assert.match(lesson.evidence, /إحالة فهرسية/, `${lesson.id}: إحالة`);
  assert.match(lesson.preferred, /بطاقة فهرس/, `${lesson.id}: بلا راجح مخترع`);
  assert.doesNotMatch(lesson.preferred, /حتى يُحرَّر|مراجعة بشرية/, `${lesson.id}: بلا تعليق على مراجعة`);
  assert.doesNotMatch(lesson.summary, /مدخل إلى|يتناول هذا المبحث/, `${lesson.id}: بلا stub`);
}

const queue = readFileSync(resolve(appRoot, "docs/FIQH_REVIEW_QUEUE.md"), "utf8");
assert.doesNotMatch(queue, /بانتظار تحرير بشري/, "طابور الفقه بلا انتظار بشري");
assert.doesNotMatch(queue, /^- \[ \]/m, "لا بنود مفتوحة في طابور الفقه");

const progress = readFileSync(resolve(appRoot, "../../docs/content-audit/progress.md"), "utf8");
assert.doesNotMatch(progress, /مراجعة بشرية/, "progress بلا مراجعة بشرية معلّقة");

console.log("content-audit-b069-full-fiqh-fihris-gate: ok");
