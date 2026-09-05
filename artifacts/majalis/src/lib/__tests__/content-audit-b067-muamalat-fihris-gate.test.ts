/**
 * b067: رهن/حوالة/وكالة منشورة كأبواب داخل البيوع.
 */
import assert from "node:assert/strict";
import {
  getFiqhBook,
  getFiqhChapter,
  publishedLessonsInChapter,
  resolveFiqhBookId,
} from "../fiqh-books";

const MERGED = [
  { alias: "rahn", bookId: "buyu", chapterId: "rahn" },
  { alias: "hawala", bookId: "buyu", chapterId: "hawala" },
  { alias: "wakala", bookId: "buyu", chapterId: "wakala" },
] as const;

for (const row of MERGED) {
  assert.equal(resolveFiqhBookId(row.alias), row.bookId, `${row.alias} → ${row.bookId}`);
  const hit = getFiqhChapter(row.alias, row.chapterId);
  assert.ok(hit, `باب ${row.alias}`);
  assert.equal(hit!.book.id, row.bookId);
  assert.equal(hit!.chapter.id, row.chapterId);
  assert.ok((hit!.chapter.summary || "").trim().length >= 40, `${row.chapterId} خلاصة`);
  assert.ok((hit!.chapter.sources || []).length >= 1, `${row.chapterId} مصادر`);
  assert.ok(publishedLessonsInChapter(hit!.chapter).length >= 1, `${row.chapterId} مسائل`);
}

const buyu = getFiqhBook("buyu");
assert.ok(buyu, "كتاب البيوع");
assert.ok(buyu!.chapters.length >= 15, `البيوع ≥15 بابًا (الآن ${buyu!.chapters.length})`);

console.log("content-audit-b067-muamalat-fihris-gate: ok");
