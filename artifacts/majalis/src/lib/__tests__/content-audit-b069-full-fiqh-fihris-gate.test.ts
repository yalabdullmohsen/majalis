/**
 * b069 — فهرس الفقه الحنبلي المنشور (كتب ← أبواب ← مسائل).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAllFiqhBooks,
  listPublishedChapters,
  listPublishedLessons,
  publishedChapters,
  publishedLessonsInChapter,
  searchFiqhCatalog,
} from "../fiqh-books";

describe("content-audit-b069-full-fiqh-fihris-gate", () => {
  it("every published book has real chapters and lessons (no stubs)", () => {
    const books = getAllFiqhBooks();
    assert.ok(books.length >= 17, `expected ≥17 books, got ${books.length}`);

    for (const book of books) {
      const chapters = publishedChapters(book);
      assert.ok(chapters.length >= 4, `${book.id}: need ≥4 chapters, got ${chapters.length}`);
      for (const ch of chapters) {
        assert.ok((ch.definition || "").trim().length >= 20, `${book.id}/${ch.id} thin definition`);
        assert.ok((ch.summary || "").trim().length >= 40, `${book.id}/${ch.id} thin summary`);
        assert.ok((ch.sources || []).length >= 1, `${book.id}/${ch.id} missing sources`);
        assert.ok(
          !/pending_review|مؤجل|قيد الإضافة|قريبًا|سيتم لاحقًا/i.test(`${ch.definition} ${ch.summary}`),
        );
      }
      const lessons = chapters.flatMap((ch) => publishedLessonsInChapter(ch));
      assert.ok(lessons.length >= 4, `${book.id}: need ≥4 lessons, got ${lessons.length}`);
      for (const lesson of lessons) {
        assert.ok((lesson.summary || "").trim().length >= 40, `${book.id}/${lesson.id} thin summary`);
        assert.ok((lesson.sources || []).length >= 1, `${book.id}/${lesson.id} missing sources`);
        assert.ok((lesson.preferred || "").trim().length >= 20, `${book.id}/${lesson.id} thin preferred`);
      }
    }

    assert.ok(listPublishedChapters().length >= 200);
    assert.ok(listPublishedLessons().length >= 400);
  });

  it("search finds representative books and chapters", () => {
    const bookHits = searchFiqhCatalog("الطهارة");
    assert.ok(bookHits.books.some((b) => b.id === "taharah"));
    const chapterHits = searchFiqhCatalog("المياه");
    assert.ok(chapterHits.chapters.some((h) => h.chapter.id === "miyah" && h.book.id === "taharah"));
    const lessonHits = searchFiqhCatalog("نية الصوم");
    assert.ok(lessonHits.lessons.some((h) => h.lesson.bookId === "sawm"));
  });
});
