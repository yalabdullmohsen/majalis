/**
 * اكتمال محتوى الفقه: كل كتاب/باب منشور بوصف ومحتوى ومصادر بلا تأجيل.
 * التشغيل: pnpm exec tsx --test src/lib/__tests__/fiqh-content-completeness.test.ts
 * أو: pnpm exec tsx src/lib/__tests__/fiqh-content-completeness.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getAllFiqhBooks,
  isPublishedBook,
  isPublishedChapter,
  publishedBooks,
  publishedChapters,
  searchFiqhCatalog,
} from "../fiqh-books";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const FORBIDDEN = [
  "pending_review",
  "مؤجل",
  "قيد الإضافة",
  "قريبًا",
  "سيتم لاحقًا",
  "TODO",
  "FIXME",
] as const;

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function sourcesOk(
  sources: { book?: string; author?: string; ref?: string }[] | undefined,
): boolean {
  return (
    Array.isArray(sources) &&
    sources.length > 0 &&
    sources.every((s) => Boolean(s.book?.trim() && s.author?.trim() && s.ref?.trim()))
  );
}

console.log("\n=== fiqh content completeness ===");

const catalogRaw = readFileSync(resolve(appRoot, "content/fiqh/books.json"), "utf8");
const books = getAllFiqhBooks();
const allChapters = books.flatMap((b) => b.chapters.map((c) => ({ book: b, chapter: c })));

assert(books.length >= 17, `كتب كافية (الفعلي ${books.length})`);
assert(publishedBooks().length === books.length, "كل الكتب منشورة عبر isPublishedBook");

const bookIds = books.map((b) => b.id);
assert(new Set(bookIds).size === bookIds.length, "لا duplicate book slug");

const chapterSlugs = allChapters.map(({ book, chapter }) => `${book.id}/${chapter.id}`);
assert(new Set(chapterSlugs).size === chapterSlugs.length, "لا duplicate chapter slug");

for (const book of books) {
  assert(Boolean(book.description?.trim()), `وصف كتاب: ${book.id}`);
  assert(Boolean(book.orderReason?.trim()), `سبب ترتيب: ${book.id}`);
  assert(sourcesOk(book.sources), `مصادر كتاب: ${book.id}`);
  assert((book.status ?? "published") === "published", `حالة كتاب منشورة: ${book.id}`);
  assert(isPublishedBook(book), `isPublishedBook: ${book.id}`);
  assert(publishedChapters(book).length === book.chapters.length, `كل أبواب ${book.id} ظاهرة`);

  for (const chapter of book.chapters) {
    const key = `${book.id}/${chapter.id}`;
    assert(Boolean(chapter.id), `chapterId موجود: ${key}`);
    assert(Boolean(book.id), `bookId موجود للباب: ${key}`);
    assert((chapter.status ?? "published") === "published", `باب منشور: ${key}`);
    assert(Boolean(chapter.definition?.trim()), `تعريف: ${key}`);
    assert(Boolean(chapter.summary?.trim()), `خلاصة: ${key}`);
    assert(Boolean(chapter.evidence?.trim()), `أدلة: ${key}`);
    assert(Boolean(chapter.notes?.trim()), `تنبيهات: ${key}`);
    assert(
      Array.isArray(chapter.topics) &&
        chapter.topics.length >= 1 &&
        chapter.topics.every((t) => Boolean(t?.trim())),
      `موضوعات: ${key}`,
    );
    assert(sourcesOk(chapter.sources), `مصادر باب: ${key}`);
    assert(isPublishedChapter(chapter), `محتوى باب مكتمل: ${key}`);
    assert((chapter.lessons?.length ?? 0) > 0, `باب بلا مسائل يتيمة العرض: ${key}`);
    for (const lesson of chapter.lessons) {
      assert(lesson.bookId === book.id, `lesson.bookId يطابق الكتاب: ${lesson.id}`);
      assert(lesson.chapterId === chapter.id, `lesson.chapterId يطابق الباب: ${lesson.id}`);
    }
  }
}

assert(allChapters.length >= 200, `أبواب كافية (الفعلي ${allChapters.length})`);

for (const bad of FORBIDDEN) {
  assert(!catalogRaw.includes(bad), `الكتالوج بلا عبارة تأجيل «${bad}»`);
}

const chapterView = readFileSync(
  resolve(appRoot, "src/pages/fiqh/ui/FiqhChapterView.tsx"),
  "utf8",
);
assert(chapterView.includes("موضوعات الباب"), "واجهة الباب تعرض موضوعات الباب");
assert(chapterView.includes("تنبيهات"), "واجهة الباب تعرض تنبيهات");
assert(chapterView.includes("خلاصة فقهية") || chapterView.includes("خلاصة"), "واجهة الباب تعرض الخلاصة");

const bookView = readFileSync(resolve(appRoot, "src/pages/fiqh/ui/FiqhBookView.tsx"), "utf8");
assert(bookView.includes("orderReason") || bookView.includes("ترتيب الكتاب"), "واجهة الكتاب تعرض سبب الترتيب");
assert(bookView.includes("مصادر الكتاب") || bookView.includes("book.sources"), "واجهة الكتاب تعرض المصادر");

const search = searchFiqhCatalog("الصلاة");
assert(search.books.some((b) => b.id === "salah"), "البحث يجد كتاب الصلاة");
assert(search.chapters.length > 0, "البحث يجد أبوابًا");

const uniqueSources = new Set<string>();
for (const book of books) {
  for (const s of book.sources ?? []) uniqueSources.add(`${s.book}|${s.ref}`);
  for (const ch of book.chapters) {
    for (const s of ch.sources ?? []) uniqueSources.add(`${s.book}|${s.ref}`);
  }
}
assert(uniqueSources.size >= 30, `مصادر كافية مستخدمة (الفعلي ${uniqueSources.size})`);

console.log(`\nالنتيجة: ${passed} نجاح / ${failed} فشل`);
console.log(
  `ملخص: كتب=${books.length} أبواب=${allChapters.length} مصادر_فريدة≈${uniqueSources.size}`,
);
if (failed > 0) process.exit(1);
