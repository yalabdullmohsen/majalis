/**
 * كيان Dua — هيكل FSD (B).
 * المسارات model/api/ui تُفصل في E عند ربط البيانات الحقيقية.
 */
import type { EntityCardProps, EntityRepository } from "@/entities/_ports";

export type DuaId = string;

export type DuaEntity = {
  slug: string;
  titleAr: string;
};

export const duaRepository: EntityRepository<DuaEntity> = {
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

export function DuaCard({ titleAr, href, subtitleAr }: EntityCardProps) {
  return (
    <a href={href} className="entity-card entity-card--dua">
      <span className="entity-card__title">{titleAr}</span>
      {subtitleAr ? <span className="entity-card__sub">{subtitleAr}</span> : null}
    </a>
  );
}
