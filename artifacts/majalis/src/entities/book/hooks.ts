import { useQuery } from "@tanstack/react-query";
import { timedQueryFn } from "@/lib/query-client";
import { bookRepository, type BookEntity } from "@/entities/book/api";

/** فهرس الكتب ثابت من الكتالوج — بلا انتهاء صلاحية */
export const BOOKS_STALE_TIME = Number.POSITIVE_INFINITY;

export function useBooksQuery() {
  return useQuery({
    queryKey: ["entities", "book", "all"] as const,
    queryFn: () =>
      timedQueryFn("entities:book:all", () => bookRepository.getAll()),
    staleTime: BOOKS_STALE_TIME,
  });
}

export function useBookQuery(slug: string | undefined) {
  return useQuery({
    queryKey: ["entities", "book", "bySlug", slug] as const,
    queryFn: () =>
      timedQueryFn(`entities:book:${slug}`, () =>
        bookRepository.getBySlug(slug!),
      ),
    enabled: Boolean(slug),
    staleTime: BOOKS_STALE_TIME,
  });
}

export type { BookEntity };
