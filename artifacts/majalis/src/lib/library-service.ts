import { arabicMatchAny } from "./arabic-search";
import {
  LIBRARY_CATALOG,
  LIBRARY_CATEGORIES,
  type LibraryBook,
  type LibraryCategory,
} from "./library-catalog";
import { resolveLibraryProvenance } from "./library-provenance";

export type LibraryItem = LibraryBook & {
  file_url?: string;
  author_name?: string;
  source_name?: string;
  source_url?: string;
};

/** مصدر موثّق = رابط https صالح — بلا اختلاق. */
export function hasVerifiedLibrarySource(
  book: Pick<LibraryBook, "external_url" | "sourceUrl"> | { external_url?: string; sourceUrl?: string },
): boolean {
  const url = String(book.external_url || book.sourceUrl || "").trim();
  if (!url) return false;
  try {
    const u = new URL(url);
    return /^https?:$/i.test(u.protocol) && Boolean(u.hostname);
  } catch {
    return false;
  }
}

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
  const prov = resolveLibraryProvenance(book);
  return {
    ...book,
    author_name: book.author,
    source_name: prov.sourceName,
    source_url: prov.sourceUrl ?? undefined,
    license: prov.license,
    usageNote: prov.usageNote ?? undefined,
    publicDomain: prov.publicDomain,
    hostedBySsunnah: prov.hostedBySsunnah,
    reviewed: prov.reviewed,
    lastVerifiedAt: prov.lastVerifiedAt ?? undefined,
  };
}

/** الفهرس الكامل — للإدارة والتدقيق فقط. */
export function getLibraryCatalog(): LibraryItem[] {
  return sortLibraryItems(LIBRARY_CATALOG.map(mapCatalogToItem));
}

/** السطح العام: كتب ذات مصدر موثّق فقط. */
export function getPublicLibraryCatalog(): LibraryItem[] {
  return getLibraryCatalog().filter(hasVerifiedLibrarySource);
}

export function getLibraryBookById(id: string): LibraryItem | null {
  const book = LIBRARY_CATALOG.find((row) => row.id === id);
  return book ? mapCatalogToItem(book) : null;
}

/** تفاصيل عامة: لا تُرجع كتابًا بلا مصدر موثّق. */
export function getPublicLibraryBookById(id: string): LibraryItem | null {
  const book = getLibraryBookById(id);
  if (!book || !hasVerifiedLibrarySource(book)) return null;
  return book;
}

export function getFeaturedLibraryBooks(limit = 6): LibraryItem[] {
  return getPublicLibraryCatalog()
    .filter((book) => !book.caution)
    .slice(0, limit);
}

export function filterLibraryCatalog({
  category,
  type,
  search,
  includeUnverified = false,
}: {
  category?: string;
  type?: string;
  search?: string;
  /** true للإدارة فقط — الافتراضي يخفي source_missing */
  includeUnverified?: boolean;
}): LibraryItem[] {
  const q = search?.trim();
  const base = includeUnverified ? getLibraryCatalog() : getPublicLibraryCatalog();
  return base.filter((item) => {
    if (category && category !== "الكل" && item.category !== category) return false;
    if (type && type !== "الكل" && item.type !== type) return false;
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
  });
}

export function searchLibraryCatalog(term: string, limit = 20): LibraryItem[] {
  const q = term.trim();
  if (!q) return [];
  return filterLibraryCatalog({ search: q }).slice(0, limit);
}

export function getRelatedLibraryBooks(book: LibraryItem, limit = 4): LibraryItem[] {
  return getPublicLibraryCatalog()
    .filter((row) => row.id !== book.id && row.category === book.category)
    .slice(0, limit);
}

export function mergeLibraryWithCatalog(dbRows: LibraryItem[]): LibraryItem[] {
  if (!dbRows.length) return getPublicLibraryCatalog();

  const merged = [...dbRows];

  for (const book of LIBRARY_CATALOG) {
    if (!hasVerifiedLibrarySource(book)) continue;
    if (!merged.some((row) => row.id === book.id)) {
      merged.push(mapCatalogToItem(book));
    }
  }

  return sortLibraryItems(
    merged.filter(
      (row) =>
        !String(row.id).startsWith("lib-") &&
        !String(row.title || "").includes("تفريغ") &&
        hasVerifiedLibrarySource(row),
    ),
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
