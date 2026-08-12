/**
 * مكتبة علمية — كتب ومراجع موثقة (مصدر البيانات للفهرسة والمحرك)
 */
export {
  LIBRARY_CATALOG,
  LIBRARY_CATEGORIES,
  type LibraryBook,
  type LibraryCategory,
} from "./library-catalog";

export {
  getLibraryCatalog,
  getLibraryBookById,
  getFeaturedLibraryBooks,
  filterLibraryCatalog,
  searchLibraryCatalog,
  getRelatedLibraryBooks,
  mergeLibraryWithCatalog,
  normalizeLibraryRow,
  isCatalogBookId,
  sortLibraryItems,
  type LibraryItem,
} from "./library-service";

import { LIBRARY_CATALOG } from "./library-catalog";

/** @deprecated استخدم LIBRARY_CATALOG */
export const LIBRARY_SEED = LIBRARY_CATALOG;

export type LibrarySeedItem = import("./library-catalog").LibraryBook;
