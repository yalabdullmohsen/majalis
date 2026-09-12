/**
 * بوابة جودة دروس الفقه المنشورة: مصادر في الآخر، بلا placeholders، بلا إيموجي في الكتالوج.
 * node --import tsx src/lib/__tests__/fiqh-lesson-pedagogy-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getAllFiqhBooks,
  isPublishedLesson,
  listPublishedLessons,
} from "../fiqh-books";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const lessonView = readFileSync(resolve(root, "src/pages/fiqh/ui/FiqhLessonView.tsx"), "utf8");
const sourceLine = readFileSync(resolve(root, "src/components/fiqh/FiqhSourceLine.tsx"), "utf8");
const report = readFileSync(resolve(root, "src/components/fiqh/FiqhReportError.tsx"), "utf8");

assert.match(lessonView, /FiqhReportError/);
assert.match(lessonView, /أسئلة مراجعة/);
assert.match(lessonView, /أخطاء شائعة/);
assert.match(sourceLine, /المصادر والمراجع/);
assert.match(report, /info@ssunnah\.com/);
assert.doesNotMatch(lessonView, /يحتاج مراجعة/);
assert.doesNotMatch(lessonView, /بحاجة إلى استكمال/);

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const FORBIDDEN = [
  /TODO/i,
  /FIXME/i,
  /placeholder/i,
  /قريبًا/,
  /قيد الإضافة/,
  /يحتاج مراجعة/,
  /اعمل في باب .+ بالمعتمد الحنبلي بعد تصور المسألة/,
];

const books = getAllFiqhBooks();
assert.ok(books.some((b) => b.id === "adab"), "كتاب الآداب موجود");

const lessons = listPublishedLessons();
assert.ok(lessons.length >= 1100, `مسائل منشورة كافية (${lessons.length})`);

const ids = new Set<string>();
for (const hit of lessons) {
  const { lesson, book, chapter } = hit;
  assert.equal(isPublishedLesson(lesson), true, lesson.id);
  assert.ok(lesson.title.trim(), `عنوان: ${lesson.id}`);
  assert.equal(lesson.bookId, book.id, lesson.id);
  assert.equal(lesson.chapterId, chapter.id, lesson.id);
  assert.ok(lesson.sources?.length, `مصادر: ${lesson.id}`);
  const srcKeys = lesson.sources.map((s) => `${s.book}|${s.author}|${s.ref}`);
  assert.equal(new Set(srcKeys).size, srcKeys.length, `مصادر مكررة: ${lesson.id}`);
  assert.ok(!ids.has(lesson.id), `id مكرر: ${lesson.id}`);
  ids.add(lesson.id);

  const blob = [
    lesson.title,
    lesson.summary,
    lesson.evidence,
    lesson.preferred,
    lesson.definition,
    lesson.ruling,
    lesson.notes,
    lesson.practicalSummary,
    ...(lesson.commonMistakes ?? []),
    ...(lesson.examples ?? []),
    ...(lesson.reviewQuestions ?? []),
  ].join("\n");

  for (const re of FORBIDDEN) {
    assert.equal(re.test(blob), false, `${re} في ${lesson.id}`);
  }
  assert.equal(EMOJI_RE.test(blob), false, `إيموجي في ${lesson.id}`);
  assert.ok(lesson.reviewQuestions?.length, `أسئلة مراجعة: ${lesson.id}`);
}

const adab = lessons.filter((h) => h.book.id === "adab");
assert.ok(adab.length >= 20, `دروس الآداب (${adab.length})`);
assert.ok(adab.every((h) => (h.lesson.commonMistakes ?? []).length > 0));

console.log(`fiqh-lesson-pedagogy-gate.test.ts: ok (${lessons.length} lessons, ${books.length} books)`);
