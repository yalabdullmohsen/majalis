import { LIBRARY_CATALOG, type LibraryBook } from "@/lib/library-catalog";
import { normalizeArabic } from "@/shared/arabic-normalize";
import type { EntityRepository } from "@/entities/_ports";
import { wrapAsync, type DataResult } from "@/shared/lib/data-result";

export type BookEntity = {
  slug: string;
  titleAr: string;
  authorAr?: string;
  categoryAr?: string;
};

function toEntity(b: LibraryBook): BookEntity {
  return {
    slug: b.id,
    titleAr: b.title,
    authorAr: b.author,
    categoryAr: b.category,
  };
}

export const bookRepository: EntityRepository<BookEntity> = {
  async getAll() {
    return LIBRARY_CATALOG.map(toEntity);
  },
  async getBySlug(slug: string) {
    const hit = LIBRARY_CATALOG.find((b) => b.id === slug);
    return hit ? toEntity(hit) : null;
  },
  async search(query: string) {
    const q = normalizeArabic(query);
    if (!q) return [];
    return LIBRARY_CATALOG.filter((b) => {
      const hay = normalizeArabic(
        [b.title, b.author, b.category, ...(b.keywords ?? [])].join(" "),
      );
      return hay.includes(q);
    }).map(toEntity);
  },
};

export async function fetchBooks(): Promise<DataResult<BookEntity[]>> {
  return wrapAsync(() => bookRepository.getAll());
}
