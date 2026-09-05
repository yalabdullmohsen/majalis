/**
 * b066 — أبواب كانت رقيقة سابقًا تُنشر بمحتوى حنبلي كامل تحت الكتب الجامعة.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getFiqhBook,
  getFiqhChapter,
  publishedChapters,
  publishedLessonsInChapter,
  resolveFiqhBookId,
} from "../fiqh-books";

describe("content-audit-b066-fiqh-thin-doors-gate", () => {
  it("chapters formerly behind thin doors now publish with content", () => {
    const cases = [
      { bookId: "sharika", chapterId: "ijara", minLessons: 1 },
      { bookId: "sharika", chapterId: "sharika", minLessons: 1 },
      { bookId: "buyu", chapterId: "qard", minLessons: 1 },
    ] as const;

    for (const c of cases) {
      const book = getFiqhBook(c.bookId);
      assert.ok(book, `missing book ${c.bookId}`);
      const chapter = getFiqhChapter(c.bookId, c.chapterId)?.chapter;
      assert.ok(chapter, `missing chapter ${c.bookId}/${c.chapterId}`);
      assert.equal(chapter!.status ?? "published", "published");
      assert.ok((chapter!.summary || "").trim().length >= 40, `thin summary ${c.chapterId}`);
      assert.ok((chapter!.sources || []).length >= 1, `no sources ${c.chapterId}`);
      const lessons = publishedLessonsInChapter(chapter!);
      assert.ok(lessons.length >= c.minLessons, `${c.chapterId} lessons ${lessons.length}`);
    }
  });

  it("alias targets resolve into published books", () => {
    assert.equal(resolveFiqhBookId("ijara"), "sharika");
    assert.equal(resolveFiqhBookId("qard"), "buyu");
    assert.equal(resolveFiqhBookId("rahn"), "buyu");
    const chapters = publishedChapters(getFiqhBook("buyu")!);
    assert.ok(chapters.some((c) => c.id === "rahn"));
    assert.ok(chapters.some((c) => c.id === "qard"));
  });
});
