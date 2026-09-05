/**
 * سلامة تصنيف الفقه: كتب←أبواب، بلا أيتام، بلا slugs مكررة.
 * التشغيل: pnpm exec tsx src/lib/__tests__/fiqh-taxonomy-integrity.test.ts
 */
import {
  getAllFiqhBooks,
  getFiqhBookAliases,
  getFiqhChapter,
  isPublishedBook,
  isPublishedChapter,
  publishedBooks,
  publishedChapters,
} from "../fiqh-books";

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== fiqh taxonomy integrity ===");
console.log("=== no orphan chapters ===");
console.log("=== no duplicate slugs ===");

const books = getAllFiqhBooks();
const bookIds = books.map((b) => b.id);
assert(new Set(bookIds).size === bookIds.length, "لا duplicate book slug");
assert(publishedBooks().length === books.length, "كل الكتب منشورة");

const chapterKeys: string[] = [];
const chapterIdsGlobal: string[] = [];
const titleBuckets = new Map<string, string[]>();

for (const book of books) {
  assert(Boolean(book.id), `bookId موجود: ${book.title}`);
  assert(Boolean(book.description?.trim()), `وصف كتاب: ${book.id}`);
  assert((book.sources?.length ?? 0) > 0, `sourceRefs/sources للكتاب: ${book.id}`);
  assert(isPublishedBook(book), `كتاب مكتمل: ${book.id}`);
  assert((book.chapters?.length ?? 0) > 0, `كتاب غير فارغ: ${book.id}`);

  for (const chapter of book.chapters) {
    const key = `${book.id}/${chapter.id}`;
    chapterKeys.push(key);
    chapterIdsGlobal.push(chapter.id);
    const titles = titleBuckets.get(chapter.title) ?? [];
    titles.push(key);
    titleBuckets.set(chapter.title, titles);

    assert(Boolean(chapter.id), `chapterId: ${key}`);
    assert(isPublishedChapter(chapter), `باب مكتمل مرتبط بكتاب: ${key}`);
    assert(Boolean(getFiqhChapter(book.id, chapter.id)), `getFiqhChapter يعمل: ${key}`);
    assert((chapter.sources?.length ?? 0) > 0, `sourceRefs للباب: ${key}`);

    for (const lesson of chapter.lessons) {
      assert(lesson.bookId === book.id, `لا orphan lesson bookId: ${lesson.id}`);
      assert(lesson.chapterId === chapter.id, `لا orphan lesson chapterId: ${lesson.id}`);
    }
  }

  assert(publishedChapters(book).length === book.chapters.length, `لا أبواب مخفية في ${book.id}`);
}

assert(new Set(chapterKeys).size === chapterKeys.length, "لا duplicate chapter key");
assert(new Set(chapterIdsGlobal).size === chapterIdsGlobal.length, "لا duplicate chapter id عبر الكتب");

for (const [title, keys] of titleBuckets.entries()) {
  if (keys.length <= 1) continue;
  assert(
    new Set(keys.map((k) => k.split("/")[0])).size === keys.length,
    `عنوان مكرر بسياق كتبي مختلف: «${title}» → ${keys.join(", ")}`,
  );
}

for (const alias of getFiqhBookAliases()) {
  assert(bookIds.includes(alias.targetBookId), `alias بلا كتاب يتيم: ${alias.aliasId}`);
  if (alias.targetChapterId) {
    assert(
      Boolean(getFiqhChapter(alias.targetBookId, alias.targetChapterId)),
      `alias chapter موجود: ${alias.aliasId}`,
    );
  }
}

assert(chapterKeys.length >= 200, `أبواب كافية (${chapterKeys.length})`);

console.log(`\nالنتيجة: ${passed} نجاح / ${failed} فشل`);
if (failed > 0) process.exit(1);
