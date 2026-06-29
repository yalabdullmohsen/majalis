import { arabicMatchAny } from "./arabic-search";
import {
  LIBRARY_CATALOG,
  LIBRARY_CATEGORIES,
  type LibraryBook,
  type LibraryCategory,
} from "./library-catalog";
import {
  type ContentType,
  classifyContentType,
  assertNoCrossContamination,
} from "./library/content-types";

export type LibraryItem = LibraryBook & {
  content_type: ContentType;
  file_url?: string;
  author_name?: string;
  language?: string;
  publisher?: string;
  publish_year?: number;
  page_count?: number;
  parts_count?: number;
  reading_minutes?: number;
  metadata?: Record<string, unknown>;
  references?: string[];
  cover_url?: string;
};

export type LibraryFilters = {
  category?: string;
  type?: string;
  search?: string;
  author?: string;
  language?: string;
  publisher?: string;
  publishYear?: number;
  bookType?: string;
  hasPdf?: boolean;
  readingMinutesMax?: number;
};

export function isCatalogBookId(id: string) {
  return id.startsWith("book-");
}

export function sortLibraryItems<T extends { sort_order?: number; title?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = a.sort_order ?? 999;
    const bo = b.sort_order ?? 999;
    if (ao !== bo) return ao - bo;
    return (a.title || "").localeCompare(b.title || "", "ar");
  });
}

export function mapCatalogToItem(book: LibraryBook): LibraryItem {
  return {
    ...book,
    content_type: "book",
    author_name: book.author,
    language: "ar",
  };
}

export function getLibraryCatalog(): LibraryItem[] {
  return sortLibraryItems(LIBRARY_CATALOG.map(mapCatalogToItem));
}

export function getLibraryBookById(id: string): LibraryItem | null {
  const book = LIBRARY_CATALOG.find((row) => row.id === id);
  return book ? mapCatalogToItem(book) : null;
}

export function getFeaturedLibraryBooks(limit = 6): LibraryItem[] {
  return getLibraryCatalog().slice(0, limit);
}

function matchesFilters(item: LibraryItem, filters: LibraryFilters): boolean {
  const { category, type, search, author, language, publisher, publishYear, bookType, hasPdf, readingMinutesMax } =
    filters;

  if (category && category !== "الكل" && item.category !== category) return false;
  if (type && type !== "الكل" && item.type !== type) return false;
  if (author && author !== "الكل") {
    const a = item.author || item.author_name || "";
    if (!a.includes(author)) return false;
  }
  if (language && language !== "الكل" && item.language !== language) return false;
  if (publisher && publisher !== "الكل" && item.publisher !== publisher) return false;
  if (publishYear && item.publish_year !== publishYear) return false;
  if (bookType && bookType !== "الكل" && item.type !== bookType) return false;
  if (hasPdf && !item.file_url) return false;
  if (readingMinutesMax && (item.reading_minutes ?? 999) > readingMinutesMax) return false;

  const q = search?.trim();
  if (
    q &&
    !arabicMatchAny(
      [item.title, item.author, item.description, item.category, item.type, ...(item.keywords || [])],
      q,
    )
  ) {
    return false;
  }
  return true;
}

export function filterLibraryByContentType(
  items: LibraryItem[],
  contentType: ContentType,
  filters: LibraryFilters = {},
): LibraryItem[] {
  const scoped = assertNoCrossContamination(items, contentType);
  return scoped.filter((item) => matchesFilters(item, filters));
}

export function filterLibraryCatalog(filters: LibraryFilters & { contentType?: ContentType } = {}): LibraryItem[] {
  const { contentType = "book", ...rest } = filters;
  return filterLibraryByContentType(getLibraryCatalog(), contentType, rest);
}

export function searchLibraryCatalog(
  term: string,
  contentType: ContentType = "book",
  limit = 20,
): LibraryItem[] {
  const q = term.trim();
  if (!q) return [];
  return filterLibraryCatalog({ search: q, contentType }).slice(0, limit);
}

export function getRelatedLibraryBooks(item: LibraryItem, limit = 4): LibraryItem[] {
  return getRelatedLibraryItems(item, "book", limit);
}

export function getRelatedLibraryItems(item: LibraryItem, contentType: ContentType, limit = 4): LibraryItem[] {
  return filterLibraryByContentType(getLibraryCatalog(), contentType)
    .filter((row) => row.id !== item.id && row.category === item.category)
    .slice(0, limit);
}

export function mergeLibraryWithCatalog(dbRows: LibraryItem[], contentType: ContentType): LibraryItem[] {
  const scopedDb = assertNoCrossContamination(dbRows, contentType);

  if (contentType !== "book") {
    return sortLibraryItems(scopedDb);
  }

  if (!scopedDb.length) return getLibraryCatalog();

  const merged = [...scopedDb];
  for (const book of LIBRARY_CATALOG) {
    if (!merged.some((row) => row.id === book.id)) {
      merged.push(mapCatalogToItem(book));
    }
  }

  return sortLibraryItems(
    merged.filter((row) => !String(row.id).startsWith("lib-") && !String(row.title || "").includes("تفريغ")),
  );
}

export function normalizeLibraryRow(row: Record<string, unknown>): LibraryItem {
  const catalog = getLibraryBookById(String(row.id || ""));
  const author = String(row.author || row.author_name || catalog?.author || "");
  const partsLabel = row.parts_label ?? catalog?.parts_label;
  const content_type = classifyContentType(row) ?? (catalog ? "book" : "book");
  const meta = (row.metadata as Record<string, unknown>) || {};

  return {
    id: String(row.id),
    title: String(row.title || catalog?.title || ""),
    author,
    author_name: author,
    content_type,
    type: String(row.type || row.item_type || catalog?.type || (content_type === "article" ? "مقال" : "كتاب")),
    category: String(row.category || catalog?.category || ""),
    description: String(row.description || catalog?.description || ""),
    parts_label: partsLabel ? String(partsLabel) : undefined,
    external_url: String(row.external_url || catalog?.external_url || "") || undefined,
    file_url: String(row.file_url || "") || undefined,
    cover_url: String(row.cover_url || meta.cover_url || "") || undefined,
    status: (row.status as LibraryBook["status"]) || "approved",
    keywords: (row.keywords as string[]) || catalog?.keywords || [],
    sort_order: Number(row.sort_order ?? catalog?.sort_order ?? 999),
    language: String(row.language || meta.language || "ar"),
    publisher: String(row.publisher || meta.publisher || "") || undefined,
    publish_year: row.publish_year != null ? Number(row.publish_year) : undefined,
    page_count: row.page_count != null ? Number(row.page_count) : undefined,
    parts_count: row.parts_count != null ? Number(row.parts_count) : undefined,
    reading_minutes: row.reading_minutes != null ? Number(row.reading_minutes) : undefined,
    metadata: meta,
    references: (row.references as string[]) || (meta.references as string[]) || undefined,
  };
}

export { LIBRARY_CATEGORIES, type LibraryCategory };
