/**
 * سجل الفقه — مصدر واحد للحقيقة فوق content/fiqh/books.json
 * كتاب ← باب ← مسألة، مع ترقيم ووسوم وبحث.
 */
import {
  getAllFiqhBooks,
  listPublishedLessons,
  publishedBooks,
  publishedChapters,
  publishedLessonsInChapter,
  searchFiqhLessons,
  type FiqhBook,
  type FiqhChapter,
  type FiqhLesson,
  type FiqhLessonHit,
} from "@/lib/fiqh-books";

export type FiqhRegistryNode = {
  id: string;
  order: number;
  title: string;
  blurb: string;
  tags: string[];
  sources: string[];
};

export type FiqhRegistryLesson = FiqhRegistryNode & {
  bookId: string;
  chapterId: string;
  href: string;
};

export type FiqhRegistryChapter = FiqhRegistryNode & {
  bookId: string;
  lessons: FiqhRegistryLesson[];
};

export type FiqhRegistryBook = FiqhRegistryNode & {
  category: FiqhBook["category"];
  chapters: FiqhRegistryChapter[];
};

function bookSources(book: FiqhBook): string[] {
  const set = new Set<string>();
  for (const ch of book.chapters) {
    for (const l of ch.lessons) {
      for (const s of l.sources ?? []) {
        if (s.book) set.add(`${s.book} — ${s.author}`);
      }
    }
  }
  return [...set].slice(0, 8);
}

function toLesson(book: FiqhBook, ch: FiqhChapter, lesson: FiqhLesson, order: number): FiqhRegistryLesson {
  return {
    id: lesson.id,
    order,
    title: lesson.title,
    blurb: lesson.summary.slice(0, 120),
    tags: [book.category, lesson.level],
    sources: (lesson.sources ?? []).map((s) => `${s.book} — ${s.author}`),
    bookId: book.id,
    chapterId: ch.id,
    href: `/fiqh/books/${book.id}/lessons/${lesson.id}`,
  };
}

function toChapter(book: FiqhBook, ch: FiqhChapter): FiqhRegistryChapter {
  const lessons = publishedLessonsInChapter(ch).map((l, i) => toLesson(book, ch, l, i + 1));
  return {
    id: ch.id,
    order: ch.order,
    title: ch.title,
    blurb: `${lessons.length} مسألة في هذا الباب`,
    tags: [book.category],
    sources: bookSources(book).slice(0, 3),
    bookId: book.id,
    lessons,
  };
}

export function buildFiqhRegistry(): FiqhRegistryBook[] {
  return publishedBooks().map((book) => ({
    id: book.id,
    order: book.order,
    title: book.title,
    blurb: `${publishedChapters(book).length} بابًا فقهيًا`,
    tags: [book.category],
    sources: bookSources(book),
    category: book.category,
    chapters: publishedChapters(book).map((ch) => toChapter(book, ch)),
  }));
}

export const fiqhRegistry = buildFiqhRegistry();

export function getFiqhRegistryBook(id: string): FiqhRegistryBook | undefined {
  return fiqhRegistry.find((b) => b.id === id);
}

export function searchFiqhRegistry(query: string): FiqhLessonHit[] {
  return searchFiqhLessons(query);
}

export function arabicOrdinal(n: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).replace(/\d/g, (d) => digits[Number(d)] ?? d);
}

export { getAllFiqhBooks, listPublishedLessons, publishedBooks };
