/**
 * مصدر الفقه: content/fiqh/books.json — كتاب ← باب ← مسألة.
 * لا تُعرض إلا المسائل المنشورة الموثَّقة، ولا يُخلط بالدروس العامة.
 */
import booksJson from "../../content/fiqh/books.json";
import { normalizeArabic } from "@/shared/arabic-normalize";
import { arabicIncludes } from "@/lib/arabic-search";

export type FiqhBookCategory = "ibadat" | "muamalat" | "usrah" | "jinayat" | "qada";
export type FiqhLessonLevel = "مبتدئ" | "متوسط" | "متقدم";
export type FiqhLessonStatus = "published" | "draft";

export type FiqhSource = { book: string; author: string; ref: string };

export type FiqhLesson = {
  id: string;
  title: string;
  bookId: string;
  chapterId: string;
  level: FiqhLessonLevel;
  madhhabNotes?: string;
  sources: FiqhSource[];
  status: FiqhLessonStatus;
  summary: string;
  evidence: string;
  preferred: string;
};

export type FiqhChapter = {
  id: string;
  title: string;
  order: number;
  lessons: FiqhLesson[];
};

export type FiqhBook = {
  id: string;
  title: string;
  category: FiqhBookCategory;
  order: number;
  chapters: FiqhChapter[];
};

export type FiqhSupportingTopic = {
  id: string;
  title: string;
  href: string;
  desc: string;
  icon: string;
};

export const FIQH_CATEGORY_LABELS: Record<FiqhBookCategory, string> = {
  ibadat: "العبادات",
  muamalat: "المعاملات",
  usrah: "الأسرة",
  jinayat: "الجنايات والحدود",
  qada: "القضاء",
};

export const FIQH_CATEGORY_ORDER: FiqhBookCategory[] = [
  "ibadat",
  "muamalat",
  "usrah",
  "jinayat",
  "qada",
];

/** مباحث مساندة — ليست كتب فروع، ولا تُخلط بشبكة الكتب. */
export const FIQH_SUPPORTING_TOPICS: FiqhSupportingTopic[] = [
  {
    id: "usul",
    title: "أصول الفقه",
    href: "/fiqh/usul",
    desc: "أدلة الأحكام وطرق الاستنباط عند أهل السنة.",
    icon: "📖",
  },
  {
    id: "qawaid",
    title: "القواعد الفقهية",
    href: "/fiqh-qawaid",
    desc: "القواعد الخمس الكبرى وما يتفرع عنها.",
    icon: "📐",
  },
  {
    id: "madhahib",
    title: "المذاهب الأربعة",
    href: "/madhahib",
    desc: "الحنفي والمالكي والشافعي والحنبلي: أصولها وانتشارها.",
    icon: "📚",
  },
  {
    id: "nawazil",
    title: "النوازل المعاصرة",
    href: "/fiqh-council/nawazil",
    desc: "نوازل العصر عبر قرارات المجامع المعتمدة.",
    icon: "⚡",
  },
  {
    id: "majami",
    title: "قرارات المجامع الفقهية",
    href: "/fiqh-council",
    desc: "مدخل واحد لقرارات المجامع وفتاواها الموثَّقة.",
    icon: "🏛️",
  },
  {
    id: "fatawa",
    title: "الفتاوى",
    href: "/fiqh-council/fatwas",
    desc: "فتاوى المجمع بهيئاته، لا إفتاء فردي من المنصة.",
    icon: "📜",
  },
];

const CATALOG = booksJson as { books: FiqhBook[] };

export function getAllFiqhBooks(): FiqhBook[] {
  return CATALOG.books.slice().sort((a, b) => a.order - b.order);
}

export function isPublishedLesson(lesson: FiqhLesson): boolean {
  return (
    lesson.status === "published" &&
    Boolean(lesson.bookId) &&
    Boolean(lesson.chapterId) &&
    Array.isArray(lesson.sources) &&
    lesson.sources.length > 0 &&
    lesson.sources.every((s) => s.book?.trim() && s.author?.trim() && s.ref?.trim())
  );
}

export function publishedLessonsInChapter(chapter: FiqhChapter): FiqhLesson[] {
  return chapter.lessons.filter(isPublishedLesson);
}

export function publishedChapters(book: FiqhBook): FiqhChapter[] {
  return book.chapters
    .filter((c) => publishedLessonsInChapter(c).length > 0)
    .sort((a, b) => a.order - b.order);
}

export function publishedBooks(books: FiqhBook[] = getAllFiqhBooks()): FiqhBook[] {
  return books.filter((b) => publishedChapters(b).length > 0);
}

export function getFiqhBook(bookId: string): FiqhBook | undefined {
  return getAllFiqhBooks().find((b) => b.id === bookId);
}

export function getVisibleFiqhBook(bookId: string): FiqhBook | undefined {
  const book = getFiqhBook(bookId);
  if (!book) return undefined;
  return publishedChapters(book).length > 0 ? book : undefined;
}

export type FiqhLessonHit = {
  lesson: FiqhLesson;
  book: FiqhBook;
  chapter: FiqhChapter;
  path: string;
  href: string;
};

export function lessonPath(book: FiqhBook, chapter: FiqhChapter, lesson: FiqhLesson): string {
  return `${book.title} ← ${chapter.title} ← ${lesson.title}`;
}

export function lessonHref(book: FiqhBook, lesson: FiqhLesson): string {
  return `/fiqh/books/${book.id}/lessons/${lesson.id}`;
}

export function bookHref(bookId: string): string {
  return `/fiqh/books/${bookId}`;
}

export function listPublishedLessons(): FiqhLessonHit[] {
  const hits: FiqhLessonHit[] = [];
  for (const book of publishedBooks()) {
    for (const chapter of publishedChapters(book)) {
      for (const lesson of publishedLessonsInChapter(chapter)) {
        hits.push({
          lesson,
          book,
          chapter,
          path: lessonPath(book, chapter, lesson),
          href: lessonHref(book, lesson),
        });
      }
    }
  }
  return hits;
}

export function getFiqhLesson(bookId: string, lessonId: string): FiqhLessonHit | undefined {
  return listPublishedLessons().find((h) => h.book.id === bookId && h.lesson.id === lessonId);
}

export type FiqhSearchFilters = {
  bookId?: string;
  level?: FiqhLessonLevel | "";
  madhhab?: string;
};

export function searchFiqhLessons(query: string, filters: FiqhSearchFilters = {}): FiqhLessonHit[] {
  const q = query.trim();
  return listPublishedLessons().filter((hit) => {
    if (filters.bookId && hit.book.id !== filters.bookId) return false;
    if (filters.level && hit.lesson.level !== filters.level) return false;
    if (filters.madhhab) {
      const notes = hit.lesson.madhhabNotes ?? "";
      if (!arabicIncludes(notes, filters.madhhab) && !arabicIncludes(hit.lesson.summary, filters.madhhab)) {
        return false;
      }
    }
    if (!q) return true;
    return (
      arabicIncludes(hit.lesson.title, q) ||
      arabicIncludes(hit.chapter.title, q) ||
      arabicIncludes(hit.book.title, q) ||
      arabicIncludes(hit.lesson.summary, q)
    );
  });
}

export function fiqhBookCounts(book: FiqhBook): { chapters: number; lessons: number } {
  const chapters = publishedChapters(book);
  return {
    chapters: chapters.length,
    lessons: chapters.reduce((n, c) => n + publishedLessonsInChapter(c).length, 0),
  };
}

export function normalizeFiqhQuery(text: string): string {
  return normalizeArabic(text);
}
