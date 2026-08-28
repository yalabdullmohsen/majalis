import { ISLAMIC_HISTORY_ITEMS } from "@/data/islamic-history";
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

const HISTORY_PERSONALITIES = ISLAMIC_HISTORY_ITEMS.filter((item) => item.kind === "personality");

function toEntity(item: (typeof HISTORY_PERSONALITIES)[number]): ScholarEntity {
  return {
    slug: item.id,
    titleAr: item.title,
    era: item.era,
    specialty: item.category === "personalities" ? ["شخصية تاريخية"] : undefined,
  };
}

export const scholarRepository: EntityRepository<ScholarEntity> = {
  async getAll() {
    return HISTORY_PERSONALITIES.map(toEntity);
  },
  async getBySlug(slug: string) {
    const hit = HISTORY_PERSONALITIES.find((s) => s.id === slug);
    return hit ? toEntity(hit) : null;
  },
  async search(query: string) {
    const q = normalizeArabic(query);
    if (!q) return [];
    const scored = HISTORY_PERSONALITIES.map((s) => {
      const hay = [s.title, s.era, s.summary, ...(s.relatedPersons ?? [])].join(" ");
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
