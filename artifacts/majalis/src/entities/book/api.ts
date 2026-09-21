import { LIBRARY_CATALOG, type LibraryBook } from "@/lib/library-catalog";
import { hasVerifiedLibrarySource } from "@/lib/library-service";
import { normalizeArabic } from "@/shared/arabic-normalize";
import { scoreTolerantMatch, compareTolerantMatches } from "@/features/search/tolerant-match";
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

const PUBLIC_BOOKS = LIBRARY_CATALOG.filter(hasVerifiedLibrarySource);

export const bookRepository: EntityRepository<BookEntity> = {
  async getAll() {
    return PUBLIC_BOOKS.map(toEntity);
  },
  async getBySlug(slug: string) {
    const hit = PUBLIC_BOOKS.find((b) => b.id === slug);
    return hit ? toEntity(hit) : null;
  },
  async search(query: string) {
    const q = normalizeArabic(query);
    if (!q) return [];
    const scored = PUBLIC_BOOKS.map((b) => {
      const hay = [b.title, b.author, b.category, ...(b.keywords ?? [])].join(" ");
      const hayNorm = normalizeArabic(hay);
      const m = scoreTolerantMatch(hay, query, hayNorm);
      return m ? { b, m } : null;
    }).filter((x): x is NonNullable<typeof x> => !!x);
    scored.sort((a, b) => compareTolerantMatches(a.m, b.m));
    return scored.map(({ b }) => toEntity(b));
  },
};

export async function fetchBooks(): Promise<DataResult<BookEntity[]>> {
  return wrapAsync(() => bookRepository.getAll());
}
