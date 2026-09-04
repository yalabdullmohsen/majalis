/**
 * بوابة: إحصاءات بطل الفقه تطابق books.json.
 * تشغيل: node --import tsx src/lib/__tests__/fiqh-hub-stats-gate.test.ts
 */
import assert from "node:assert/strict";
import { FIQH_HUB_STATS } from "@/lib/fiqh-hub-stats";
import { getAllFiqhBooks, fiqhBookCounts } from "@/lib/fiqh-books";

const books = getAllFiqhBooks();
let chapters = 0;
let lessons = 0;
for (const b of books) {
  const c = fiqhBookCounts(b);
  chapters += c.chapters;
  lessons += c.lessons;
}

assert.equal(FIQH_HUB_STATS.books, books.length, "عدد الكتب");
assert.equal(FIQH_HUB_STATS.chapters, chapters, "عدد الأبواب");
assert.equal(FIQH_HUB_STATS.lessons, lessons, "عدد المسائل المنشورة");
console.log("fiqh-hub-stats-gate.test.ts: ok", FIQH_HUB_STATS);
