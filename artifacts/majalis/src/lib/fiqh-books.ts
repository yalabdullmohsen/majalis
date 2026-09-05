/**
 * مصدر الفقه: content/fiqh/books.json — كتاب ← باب ← مسألة.
 * المذهب المعتمد في العرض: الحنبلي (زاد / روض / كشاف / مغني / ممتعم).
 * لا تُعرض إلا المسائل المنشورة الموثَّقة، ولا يُخلط بالدروس العامة.
 */
import booksJson from "../../content/fiqh/books.json";
import aliasesJson from "../../content/fiqh/book-aliases.json";
import { normalizeArabic } from "@/shared/arabic-normalize";

export type FiqhBookCategory = "ibadat" | "muamalat" | "usrah" | "jinayat" | "qada";
export type FiqhLessonLevel = "مبتدئ" | "متوسط" | "متقدم";
export type FiqhLessonStatus = "published" | "draft";
export type FiqhChapterStatus = "published" | "draft";

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
  status?: FiqhChapterStatus;
  definition?: string;
  /** موضوعات الباب — نقاط مختصرة لأبرز المسائل. */
  topics?: string[];
  summary?: string;
  evidence?: string;
  /** تنبيهات مختصرة (اختلاف الحال / الرجوع لأهل العلم). */
  notes?: string;
  sources?: FiqhSource[];
  lessons: FiqhLesson[];
};

export type FiqhBook = {
  id: string;
  title: string;
  description?: string;
  /** سبب ترتيب الكتاب ضمن كتب الفقه. */
  orderReason?: string;
  category: FiqhBookCategory;
  order: number;
  status?: FiqhChapterStatus;
  aliases?: string[];
  sources?: FiqhSource[];
  chapters: FiqhChapter[];
};

export type FiqhBookAlias = {
  aliasTitle: string;
  aliasId: string;
  targetBookId: string;
  targetChapterId?: string;
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
const ALIASES = (aliasesJson as { aliases: FiqhBookAlias[] }).aliases ?? [];

export function getFiqhBookAliases(): FiqhBookAlias[] {
  return ALIASES.slice();
}

export function resolveFiqhBookId(bookIdOrAlias: string): string {
  if (CATALOG.books.some((b) => b.id === bookIdOrAlias)) return bookIdOrAlias;
  const hit = ALIASES.find((a) => a.aliasId === bookIdOrAlias);
  return hit?.targetBookId ?? bookIdOrAlias;
}

export function resolveFiqhAliasTarget(bookIdOrAlias: string): FiqhBookAlias | undefined {
  if (CATALOG.books.some((b) => b.id === bookIdOrAlias)) return undefined;
  return ALIASES.find((a) => a.aliasId === bookIdOrAlias);
}

export function getAllFiqhBooks(): FiqhBook[] {
  return CATALOG.books.slice().sort((a, b) => a.order - b.order);
}

function sourcesComplete(sources: FiqhSource[] | undefined): boolean {
  return (
    Array.isArray(sources) &&
    sources.length > 0 &&
    sources.every((s) => s.book?.trim() && s.author?.trim() && s.ref?.trim())
  );
}

export function isPublishedLesson(lesson: FiqhLesson): boolean {
  return (
    lesson.status === "published" &&
    Boolean(lesson.bookId) &&
    Boolean(lesson.chapterId) &&
    Boolean(lesson.summary?.trim()) &&
    Boolean(lesson.evidence?.trim()) &&
    Boolean(lesson.preferred?.trim()) &&
    sourcesComplete(lesson.sources)
  );
}

export function publishedLessonsInChapter(chapter: FiqhChapter): FiqhLesson[] {
  return chapter.lessons.filter(isPublishedLesson);
}

export function isPublishedChapter(chapter: FiqhChapter): boolean {
  const statusOk = (chapter.status ?? "published") === "published";
  const topicsOk =
    Array.isArray(chapter.topics) &&
    chapter.topics.length >= 1 &&
    chapter.topics.every((t) => Boolean(t?.trim()));
  return (
    statusOk &&
    Boolean(chapter.definition?.trim()) &&
    Boolean(chapter.summary?.trim()) &&
    Boolean(chapter.evidence?.trim()) &&
    Boolean(chapter.notes?.trim()) &&
    topicsOk &&
    sourcesComplete(chapter.sources) &&
    publishedLessonsInChapter(chapter).length > 0
  );
}

export function publishedChapters(book: FiqhBook): FiqhChapter[] {
  return book.chapters.filter(isPublishedChapter).sort((a, b) => a.order - b.order);
}

export function isPublishedBook(book: FiqhBook): boolean {
  const statusOk = (book.status ?? "published") === "published";
  return (
    statusOk &&
    Boolean(book.description?.trim()) &&
    Boolean(book.orderReason?.trim()) &&
    sourcesComplete(book.sources) &&
    publishedChapters(book).length > 0
  );
}

export function publishedBooks(books: FiqhBook[] = getAllFiqhBooks()): FiqhBook[] {
  return books.filter(isPublishedBook);
}

export function getFiqhBook(bookId: string): FiqhBook | undefined {
  const resolved = resolveFiqhBookId(bookId);
  return getAllFiqhBooks().find((b) => b.id === resolved);
}

export function getVisibleFiqhBook(bookId: string): FiqhBook | undefined {
  const book = getFiqhBook(bookId);
  if (!book) return undefined;
  return publishedChapters(book).length > 0 ? book : undefined;
}

export function getFiqhChapter(
  bookId: string,
  chapterId: string,
): { book: FiqhBook; chapter: FiqhChapter } | undefined {
  const book = getVisibleFiqhBook(bookId);
  if (!book) return undefined;
  const alias = resolveFiqhAliasTarget(bookId);
  const wantChapterId = alias?.targetChapterId || chapterId;
  const chapter = publishedChapters(book).find((c) => c.id === wantChapterId || c.id === chapterId);
  if (!chapter) return undefined;
  return { book, chapter };
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

export function chapterHref(bookId: string, chapterId: string): string {
  return `/fiqh/books/${bookId}/chapters/${chapterId}`;
}

export function bookHref(bookId: string): string {
  return `/fiqh/books/${resolveFiqhBookId(bookId)}`;
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

export function getFiqhLessonAny(bookId: string, lessonId: string): FiqhLessonHit | undefined {
  const book = getFiqhBook(bookId);
  if (!book) return undefined;
  for (const chapter of book.chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (!lesson) continue;
    return {
      lesson,
      book,
      chapter,
      path: lessonPath(book, chapter, lesson),
      href: lessonHref(book, lesson),
    };
  }
  return undefined;
}

export function getFiqhLesson(bookId: string, lessonId: string): FiqhLessonHit | undefined {
  const book = getVisibleFiqhBook(bookId);
  if (!book) return undefined;
  for (const chapter of publishedChapters(book)) {
    const lesson = publishedLessonsInChapter(chapter).find((l) => l.id === lessonId);
    if (!lesson) continue;
    return {
      lesson,
      book,
      chapter,
      path: lessonPath(book, chapter, lesson),
      href: lessonHref(book, lesson),
    };
  }
  return undefined;
}

function flattenBookLessons(book: FiqhBook): FiqhLessonHit[] {
  const hits: FiqhLessonHit[] = [];
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
  return hits;
}

export function adjacentFiqhLessons(
  bookId: string,
  lessonId: string,
): { prev?: FiqhLessonHit; next?: FiqhLessonHit; chapterHits: FiqhLessonHit[] } {
  const current = getFiqhLesson(bookId, lessonId);
  if (!current) return { chapterHits: [] };
  const all = flattenBookLessons(current.book);
  const index = all.findIndex((h) => h.lesson.id === lessonId);
  const chapterHits = all.filter((h) => h.chapter.id === current.chapter.id);
  return {
    prev: index > 0 ? all[index - 1] : undefined,
    next: index >= 0 && index < all.length - 1 ? all[index + 1] : undefined,
    chapterHits,
  };
}

/** وصف عرضي من عنوان الكتاب — ليس حكماً شرعياً جديداً. */
export function fiqhBookBlurb(book: FiqhBook): string {
  if (book.description?.trim()) return book.description.trim();
  const topic = book.title.replace(/^كتاب\s+/, "").trim();
  return `أبواب ${topic} ومسائلها المنشورة على المذهب الحنبلي.`;
}

export type FiqhChapterHit = {
  book: FiqhBook;
  chapter: FiqhChapter;
  href: string;
  path: string;
};

export function listPublishedChapters(): FiqhChapterHit[] {
  const hits: FiqhChapterHit[] = [];
  for (const book of publishedBooks()) {
    for (const chapter of publishedChapters(book)) {
      hits.push({
        book,
        chapter,
        href: chapterHref(book.id, chapter.id),
        path: `${book.title} ← ${chapter.title}`,
      });
    }
  }
  return hits;
}

/**
 * مطابقة فقهية صارمة (تطبيع عربي + تضمين) — بلا مطابقة متساهلة
 * حتى لا تختلط «الصلاة/الطلاق» أو «الزكاة/الزاد».
 */
export function fiqhTextIncludes(haystack: string | null | undefined, needle: string): boolean {
  const q = normalizeArabic(needle).trim();
  if (!q) return true;
  const hay = normalizeArabic(haystack ?? "");
  if (!hay) return false;
  if (hay.includes(q)) return true;
  const stripAl = (s: string) => s.replace(/(^|[^\p{L}])ال(?=\p{L})/gu, "$1");
  return stripAl(hay).includes(stripAl(q));
}

export function searchFiqhCatalog(query: string): {
  books: FiqhBook[];
  chapters: FiqhChapterHit[];
  lessons: FiqhLessonHit[];
} {
  const q = query.trim();
  const books = publishedBooks().filter(
    (b) =>
      !q ||
      fiqhTextIncludes(b.title, q) ||
      fiqhTextIncludes(b.description ?? "", q) ||
      fiqhTextIncludes(b.orderReason ?? "", q) ||
      (b.aliases ?? []).some((a) => fiqhTextIncludes(a, q)),
  );
  // الأبواب: مطابقة حقول الباب فقط (لا تُغرق النتائج بعنوان الكتاب الأب).
  const chapters = listPublishedChapters().filter(
    (h) =>
      !q ||
      fiqhTextIncludes(h.chapter.title, q) ||
      fiqhTextIncludes(h.chapter.summary ?? "", q) ||
      fiqhTextIncludes(h.chapter.definition ?? "", q) ||
      fiqhTextIncludes(h.chapter.notes ?? "", q) ||
      (h.chapter.topics ?? []).some((t) => fiqhTextIncludes(t, q)),
  );
  const lessons = searchFiqhLessons(q);
  return { books, chapters, lessons };
}

/** مستوى تقريبي من المسائل المنشورة في الكتاب. */
export function fiqhBookApproxLevel(book: FiqhBook): FiqhLessonLevel {
  const tally: Record<FiqhLessonLevel, number> = { مبتدئ: 0, متوسط: 0, متقدم: 0 };
  for (const chapter of publishedChapters(book)) {
    for (const lesson of publishedLessonsInChapter(chapter)) {
      tally[lesson.level] += 1;
    }
  }
  if (tally.متقدم >= tally.متوسط && tally.متقدم >= tally.مبتدئ && tally.متقدم > 0) return "متقدم";
  if (tally.متوسط >= tally.مبتدئ && tally.متوسط > 0) return "متوسط";
  return "مبتدئ";
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
      if (!fiqhTextIncludes(notes, filters.madhhab) && !fiqhTextIncludes(hit.lesson.summary, filters.madhhab)) {
        return false;
      }
    }
    if (!q) return true;
    return (
      fiqhTextIncludes(hit.lesson.title, q) ||
      fiqhTextIncludes(hit.chapter.title, q) ||
      fiqhTextIncludes(hit.book.title, q) ||
      fiqhTextIncludes(hit.lesson.summary, q) ||
      fiqhTextIncludes(hit.lesson.evidence, q) ||
      fiqhTextIncludes(hit.lesson.preferred, q)
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
