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

/** أسماء مرتبطة بأحداث الخط الزمني — بلا قسم «شخصيات تاريخية» منفصل. */
function relatedPersonEntities(): ScholarEntity[] {
  const map = new Map<string, ScholarEntity>();
  for (const item of ISLAMIC_HISTORY_ITEMS) {
    for (const name of item.relatedPersons ?? []) {
      const slug = `related:${encodeURIComponent(name)}`;
      if (!map.has(slug)) {
        map.set(slug, {
          slug,
          titleAr: name,
          era: item.era,
          specialty: ["مذكور في أحداث التاريخ"],
        });
      }
    }
  }
  return [...map.values()];
}

const HISTORY_FIGURES = relatedPersonEntities();

export const scholarRepository: EntityRepository<ScholarEntity> = {
  async getAll() {
    return HISTORY_FIGURES;
  },
  async getBySlug(slug: string) {
    return HISTORY_FIGURES.find((s) => s.slug === slug) ?? null;
  },
  async search(query: string) {
    const q = normalizeArabic(query);
    if (!q) return [];
    const scored = HISTORY_FIGURES.map((s) => {
      const hay = [s.titleAr, s.era, ...(s.specialty ?? [])].join(" ");
      const hayNorm = normalizeArabic(hay);
      const m = scoreTolerantMatch(hay, query, hayNorm);
      return m ? { s, m } : null;
    }).filter((x): x is NonNullable<typeof x> => !!x);
    scored.sort((a, b) => compareTolerantMatches(a.m, b.m));
    return scored.map(({ s }) => s);
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
