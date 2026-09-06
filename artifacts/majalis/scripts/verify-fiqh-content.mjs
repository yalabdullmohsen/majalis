#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const booksPath = resolve(root, "content/fiqh/books.json");
const deferredPath = resolve(root, "content/fiqh/deferred-nawazil.json");
const auditPath = resolve(root, "fiqh-content-audit.md");
const errors = [];
const fail = (m) => errors.push(m);

function sourcesOk(sources) {
  return Array.isArray(sources) && sources.length > 0 &&
    sources.every((s) => s?.book?.trim() && s?.author?.trim() && s?.ref?.trim());
}
function isPublishedLesson(lesson) {
  return lesson.status === "published" && lesson.needsReview !== true &&
    Boolean(lesson.bookId) && Boolean(lesson.chapterId) &&
    Boolean(lesson.summary?.trim()) && Boolean(lesson.evidence?.trim()) &&
    Boolean(lesson.preferred?.trim()) && sourcesOk(lesson.sources);
}

const books = JSON.parse(readFileSync(booksPath, "utf8")).books || [];
const lessonIds = new Set();
const chapterKeys = new Set();
const bookIds = new Set();
let publishedCount = 0;
let needsReviewCount = 0;

for (const book of books) {
  if (!book.id?.trim()) fail("كتاب بلا id");
  if (bookIds.has(book.id)) fail(`slug كتاب مكرر: ${book.id}`);
  bookIds.add(book.id);
  if (!book.title?.trim()) fail(`كتاب بلا عنوان: ${book.id}`);
  if (!sourcesOk(book.sources)) fail(`مصادر كتاب ناقصة: ${book.id}`);
  const chapters = book.chapters || [];
  if (!chapters.length) fail(`كتاب بلا أبواب: ${book.id}`);
  for (const chapter of chapters) {
    const ck = `${book.id}/${chapter.id}`;
    if (!chapter.id?.trim()) fail(`باب بلا id في ${book.id}`);
    if (chapterKeys.has(ck)) fail(`slug باب مكرر: ${ck}`);
    chapterKeys.add(ck);
    if ((chapter.order ?? 0) < 1) fail(`ترتيب باب غير صالح: ${ck}`);
    const lessons = chapter.lessons || [];
    if (!lessons.length) fail(`باب بلا مسائل: ${ck}`);
    for (const lesson of lessons) {
      if (!lesson.id?.trim()) fail(`مسألة بلا id في ${ck}`);
      if (lessonIds.has(lesson.id)) fail(`slug مسألة مكرر: ${lesson.id}`);
      lessonIds.add(lesson.id);
      if (!lesson.title?.trim()) fail(`مسألة بلا عنوان: ${lesson.id}`);
      const hasSummary = Boolean(lesson.practicalSummary?.trim() || lesson.preferred?.trim() || lesson.summary?.trim());
      if (!hasSummary) fail(`مسألة بلا خلاصة: ${lesson.id}`);
      if (!sourcesOk(lesson.sources)) fail(`مصادر فارغة/ناقصة: ${lesson.id}`);
      if (lesson.bookId !== book.id) fail(`bookId غير مطابق: ${lesson.id}`);
      if (lesson.chapterId !== chapter.id) fail(`chapterId غير مطابق: ${lesson.id}`);
      if (lesson.needsReview === true || lesson.status === "draft") {
        needsReviewCount += 1;
        if (isPublishedLesson(lesson)) fail(`needsReview يظهر كمنشور: ${lesson.id}`);
      }
      if (lesson.needsReview === true && lesson.status === "published") {
        fail(`needsReview بحالة published في الكتالوج العام: ${lesson.id}`);
      }
      if (isPublishedLesson(lesson)) publishedCount += 1;
    }
  }
}
if (!existsSync(auditPath)) fail("ملف fiqh-content-audit.md غير موجود");

let deferredCount = 0;
if (!existsSync(deferredPath)) {
  fail("ملف content/fiqh/deferred-nawazil.json غير موجود");
} else {
  const deferred = JSON.parse(readFileSync(deferredPath, "utf8"));
  if (deferred.visibility !== "internal_review_only") {
    fail("deferred-nawazil يجب أن يكون visibility=internal_review_only");
  }
  if (deferred.method?.publicCatalog !== false) {
    fail("deferred-nawazil يجب أن يصرّح publicCatalog=false");
  }
  const topics = deferred.topics || [];
  if (topics.length < 4) fail(`deferred-nawazil ينقص موضوعات (الفعلي ${topics.length})`);
  const booksRaw = readFileSync(booksPath, "utf8");
  for (const topic of topics) {
    deferredCount += 1;
    if (!topic.id?.trim()) fail("موضوع مؤجّل بلا id");
    if (!topic.title?.trim()) fail(`موضوع مؤجّل بلا عنوان: ${topic.id}`);
    if (topic.status !== "draft") fail(`موضوع مؤجّل يجب أن يكون draft: ${topic.id}`);
    if (topic.needsReview !== true) fail(`موضوع مؤجّل يجب needsReview=true: ${topic.id}`);
    if (!topic.summary?.trim() || topic.summary.trim().length < 80) {
      fail(`خلاصة مؤجّلة قصيرة/فارغة: ${topic.id}`);
    }
    if (!sourcesOk(topic.sources)) fail(`مصادر مؤجّلة ناقصة: ${topic.id}`);
    if (lessonIds.has(topic.id)) fail(`موضوع مؤجّل تسرب إلى books.json: ${topic.id}`);
    if (booksRaw.includes(`"${topic.id}"`)) {
      fail(`معرّف مؤجّل موجود داخل books.json: ${topic.id}`);
    }
  }
}

if (errors.length) {
  console.error("❌ verify-fiqh-content failed:");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  books: books.length,
  chapters: chapterKeys.size,
  lessons: lessonIds.size,
  publishedLessons: publishedCount,
  needsReviewOrDraft: needsReviewCount,
  deferredNawazil: deferredCount,
}, null, 2));
