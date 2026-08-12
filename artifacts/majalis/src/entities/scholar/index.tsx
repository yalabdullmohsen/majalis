/**
 * كيان Scholar — مستودع حي على scholars-data + بطاقة UI.
 */
export type { ScholarEntity, ScholarId } from "@/entities/scholar/api";
export {
  scholarRepository,
  fetchScholars,
  fetchScholarBySlug,
} from "@/entities/scholar/api";
export { useScholarsQuery, useScholarQuery } from "@/entities/scholar/hooks";

import type { EntityCardProps } from "@/entities/_ports";

export function ScholarCard({ titleAr, href, subtitleAr }: EntityCardProps) {
  return (
    <a href={href} className="entity-card entity-card--scholar">
      <span className="entity-card__title">{titleAr}</span>
      {subtitleAr ? <span className="entity-card__sub">{subtitleAr}</span> : null}
    </a>
  );
}
