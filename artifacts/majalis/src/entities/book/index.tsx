/**
 * كيان Book — مستودع حي على library-catalog.
 */
export type { BookEntity } from "@/entities/book/api";
export { bookRepository, fetchBooks } from "@/entities/book/api";

import type { EntityCardProps } from "@/entities/_ports";

export function BookCard({ titleAr, href, subtitleAr }: EntityCardProps) {
  return (
    <a href={href} className="entity-card entity-card--book">
      <span className="entity-card__title">{titleAr}</span>
      {subtitleAr ? <span className="entity-card__sub">{subtitleAr}</span> : null}
    </a>
  );
}
