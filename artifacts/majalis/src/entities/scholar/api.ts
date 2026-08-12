import { SCHOLARS, type Scholar } from "@/lib/scholars-data";
import { normalizeArabic } from "@/shared/arabic-normalize";
import { scoreTolerantMatch, compareTolerantMatches } from "@/features/search/tolerant-match";
import type { EntityRepository } from "@/entities/_ports";
import { wrapAsync, type DataResult } from "@/shared/lib/data-result";

export type ScholarId = string;

export type ScholarEntity = {
  slug: string;
  titleAr: string;
  fullName?: string;
  era?: string;
  specialty?: string[];
};

function toEntity(s: Scholar): ScholarEntity {
  return {
    slug: s.id,
    titleAr: s.name,
    fullName: s.fullName,
    era: s.era,
    specialty: s.specialty,
  };
}

export const scholarRepository: EntityRepository<ScholarEntity> = {
  async getAll() {
    return SCHOLARS.map(toEntity);
  },
  async getBySlug(slug: string) {
    const hit = SCHOLARS.find((s) => s.id === slug);
    return hit ? toEntity(hit) : null;
  },
  async search(query: string) {
    const q = normalizeArabic(query);
    if (!q) return [];
    const scored = SCHOLARS.map((s) => {
      const hay = [s.name, s.fullName, s.era, ...(s.specialty ?? [])].join(" ");
      const hayNorm = normalizeArabic(hay);
      const m = scoreTolerantMatch(hay, query, hayNorm);
      return m ? { s, m } : null;
    }).filter((x): x is NonNullable<typeof x> => !!x);
    scored.sort((a, b) => compareTolerantMatches(a.m, b.m));
    return scored.map(({ s }) => toEntity(s));
  },
};

export async function fetchScholars(): Promise<DataResult<ScholarEntity[]>> {
  return wrapAsync(() => scholarRepository.getAll());
}

export async function fetchScholarBySlug(
  slug: string,
): Promise<DataResult<ScholarEntity | null>> {
  return wrapAsync(() => scholarRepository.getBySlug(slug));
}
