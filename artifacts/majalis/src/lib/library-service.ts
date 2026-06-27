import { arabicMatchAny } from "./arabic-search";
import {
  LIBRARY_CATALOG,
  LIBRARY_CATEGORIES,
  type LibraryBook,
  type LibraryCategory,
} from "./library-catalog";

export type LibraryItem = LibraryBook & {
  file_url?: string;
  author_name?: string;
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
  return { ...book, author_name: book.author };
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

export function filterLibraryCatalog({
  category,
  type,
  search,
}: {
  category?: string;
  type?: string;
  search?: string;
}): LibraryItem[] {
  const q = search?.trim();
  return getLibraryCatalog().filter((item) => {
    if (category && category !== "الكل" && item.category !== category) return false;
    if (type && type !== "الكل" && item.type !== type) return false;
    if (q && !arabicMatchAny([item.title, item.author, item.description, item.category, item.type, ...item.keywords], q)) {
      return false;
    }
    return true;
  });
}

export function searchLibraryCatalog(term: string, limit = 20): LibraryItem[] {
  const q = term.trim();
  if (!q) return [];
  return filterLibraryCatalog({ search: q }).slice(0, limit);
}

export function getRelatedLibraryBooks(book: LibraryItem, limit = 4): LibraryItem[] {
  return getLibraryCatalog()
    .filter((row) => row.id !== book.id && row.category === book.category)
    .slice(0, limit);
}

export function mergeLibraryWithCatalog(dbRows: LibraryItem[]): LibraryItem[] {
  if (!dbRows.length) return getLibraryCatalog();

  const merged = [...dbRows];

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
  return {
    id: String(row.id),
    title: String(row.title || catalog?.title || ""),
    author,
    author_name: author,
    type: String(row.type || row.item_type || catalog?.type || "كتاب"),
    category: String(row.category || catalog?.category || ""),
    description: String(row.description || catalog?.description || ""),
    parts_label: partsLabel ? String(partsLabel) : undefined,
    external_url: String(row.external_url || catalog?.external_url || "") || undefined,
    file_url: String(row.file_url || "") || undefined,
    status: (row.status as LibraryBook["status"]) || "approved",
    keywords: (row.keywords as string[]) || catalog?.keywords || [],
    sort_order: Number(row.sort_order ?? catalog?.sort_order ?? 999),
  };
}

export { LIBRARY_CATEGORIES, type LibraryCategory };
