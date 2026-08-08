/**
 * كيان Ruling — هيكل FSD (B).
 * المسارات model/api/ui تُفصل في E عند ربط البيانات الحقيقية.
 */
import type { EntityCardProps, EntityRepository } from "@/entities/_ports";

export type RulingId = string;

export type RulingEntity = {
  slug: string;
  titleAr: string;
};

export const rulingRepository: EntityRepository<RulingEntity> = {
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

/** بطاقة كيان خام — رسالة الاسم RulingCard موحّدة في ui-common */
export function RulingEntityCard({ titleAr, href, subtitleAr }: EntityCardProps) {
  return (
    <a href={href} className="entity-card entity-card--ruling">
      <span className="entity-card__title">{titleAr}</span>
      {subtitleAr ? <span className="entity-card__sub">{subtitleAr}</span> : null}
    </a>
  );
}
