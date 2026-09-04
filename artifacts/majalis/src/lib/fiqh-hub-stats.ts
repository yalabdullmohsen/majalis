/**
 * إحصاءات بطل الفقه — محسوبة من بيانات الكتب لا أرقام ثابتة يدوية.
 * بوابة: `fiqh-hub-stats-gate.test.ts`
 */
import { getAllFiqhBooks, fiqhBookCounts } from "@/lib/fiqh-books";

function computeFiqhHubStats(): { books: number; chapters: number; lessons: number } {
  const books = getAllFiqhBooks();
  let chapters = 0;
  let lessons = 0;
  for (const b of books) {
    const c = fiqhBookCounts(b);
    chapters += c.chapters;
    lessons += c.lessons;
  }
  return { books: books.length, chapters, lessons };
}

export const FIQH_HUB_STATS = computeFiqhHubStats();
