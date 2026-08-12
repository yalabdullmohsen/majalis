import { useQuery } from "@tanstack/react-query";
import { timedQueryFn } from "@/lib/query-client";
import {
  scholarRepository,
  type ScholarEntity,
} from "@/entities/scholar/api";

/** بيانات العلماء ثابتة — بلا انتهاء صلاحية */
export const SCHOLARS_STALE_TIME = Number.POSITIVE_INFINITY;

export function useScholarsQuery() {
  return useQuery({
    queryKey: ["entities", "scholar", "all"] as const,
    queryFn: () =>
      timedQueryFn("entities:scholar:all", () => scholarRepository.getAll()),
    staleTime: SCHOLARS_STALE_TIME,
  });
}

export function useScholarQuery(slug: string | undefined) {
  return useQuery({
    queryKey: ["entities", "scholar", "bySlug", slug] as const,
    queryFn: () =>
      timedQueryFn(`entities:scholar:${slug}`, () =>
        scholarRepository.getBySlug(slug!),
      ),
    enabled: Boolean(slug),
    staleTime: SCHOLARS_STALE_TIME,
  });
}

export type { ScholarEntity };
