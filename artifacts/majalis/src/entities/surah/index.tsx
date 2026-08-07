/**
 * كيان Surah — هيكل FSD (B).
 * المسارات model/api/ui تُفصل في E عند ربط البيانات الحقيقية.
 */
import type { EntityCardProps, EntityRepository } from "@/entities/_ports";

export type SurahId = string;

export type SurahEntity = {
  slug: string;
  titleAr: string;
};

export const surahRepository: EntityRepository<SurahEntity> = {
  async getAll() {
    return [];
  },
  async getBySlug(_slug: string) {
    return null;
  },
  async search(_query: string) {
    return [];
  },
};

export function SurahCard({ titleAr, href, subtitleAr }: EntityCardProps) {
  return (
    <a href={href} className="entity-card entity-card--surah">
      <span className="entity-card__title">{titleAr}</span>
      {subtitleAr ? <span className="entity-card__sub">{subtitleAr}</span> : null}
    </a>
  );
}
