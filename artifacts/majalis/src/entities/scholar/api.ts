import { SCHOLARS, type Scholar } from "@/lib/scholars-data";
import { normalizeArabic } from "@/shared/arabic-normalize";
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
    return SCHOLARS.filter((s) => {
      const hay = normalizeArabic(
        [s.name, s.fullName, s.era, ...(s.specialty ?? [])].join(" "),
      );
      return hay.includes(q);
    }).map(toEntity);
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
