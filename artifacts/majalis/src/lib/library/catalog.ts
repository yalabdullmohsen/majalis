import { arabicMatchAny } from "@/lib/arabic-search";
import { LIBRARY_BOOKS } from "./books-data";
import {
  countChapters,
  findChapter,
  flattenChapters,
} from "./book-factory";
import type { LibraryBook, LibraryBookSummary, LibrarySearchHit } from "./types";

const bySlug = new Map(LIBRARY_BOOKS.map((b) => [b.slug, b]));
const byId = new Map(LIBRARY_BOOKS.map((b) => [b.id, b]));

export function getAllLibraryBooks(): LibraryBook[] {
  return LIBRARY_BOOKS;
}

export function getLibraryBookSummaries(): LibraryBookSummary[] {
  return LIBRARY_BOOKS.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: b.author,
    category: b.category,
    type: b.type,
    description: b.description,
    coverHue: b.coverHue,
    chapterCount: countChapters(b),
  }));
}

export function getLibraryBookBySlug(slug: string): LibraryBook | undefined {
  return bySlug.get(slug);
}

export function getLibraryBookById(id: string): LibraryBook | undefined {
  return byId.get(id);
}

export function resolveLibrarySlug(item: { id?: string; title?: string; slug?: string }): string {
  if (item.slug && bySlug.has(item.slug)) return item.slug;
  if (item.id && byId.has(item.id)) return byId.get(item.id)!.slug;
  const byTitle = LIBRARY_BOOKS.find((b) => b.title === item.title);
  if (byTitle) return byTitle.slug;
  return item.slug || item.id || "unknown";
}

export function searchLibraryCatalog(query: string, limit = 20): LibrarySearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const hits: LibrarySearchHit[] = [];

  for (const book of LIBRARY_BOOKS) {
    const bookMatch = arabicMatchAny([book.title, book.author, book.category, book.description], q);
    for (const ch of flattenChapters(book.sections)) {
      const text = ch.paragraphs.join(" ");
      if (!bookMatch && !arabicMatchAny([ch.title, text], q)) continue;
      hits.push({
        bookSlug: book.slug,
        bookTitle: book.title,
        chapterId: ch.id,
        chapterTitle: ch.title,
        snippet: ch.title + (text ? ` — ${text.slice(0, 80)}` : ""),
      });
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}

export function searchInBook(book: LibraryBook, query: string): LibrarySearchHit[] {
  const q = query.trim();
  if (!q) return [];
  return flattenChapters(book.sections)
    .filter((ch) => arabicMatchAny([ch.title, ...ch.paragraphs], q))
    .map((ch) => ({
      bookSlug: book.slug,
      bookTitle: book.title,
      chapterId: ch.id,
      chapterTitle: ch.title,
      snippet: ch.paragraphs[0]?.slice(0, 100) || ch.title,
    }));
}

export function getFirstChapterId(book: LibraryBook): string {
  return flattenChapters(book.sections)[0]?.id || "intro-main";
}

export function getDefaultChapterId(book: LibraryBook, preferredId?: string | null): string {
  if (preferredId && findChapter(book, preferredId)) return preferredId;
  return getFirstChapterId(book);
}

/** Flat list for seed / supabase compatibility */
export function getLibrarySeedRows() {
  return getLibraryBookSummaries().map((b) => {
    const full = bySlug.get(b.slug)!;
    return {
      id: b.id,
      slug: b.slug,
      title: b.title,
      author: b.author,
      type: b.type,
      category: b.category,
      description: b.description,
      external_url: full.externalUrl,
      status: "approved" as const,
    };
  });
}

export { findChapter, flattenChapters, countChapters, findChapterPath } from "./book-factory";
