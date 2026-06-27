import { Link } from "wouter";
import type { ShariaRulingExtended } from "@/lib/rulings-types";

type Props = {
  ruling: ShariaRulingExtended;
};

export function RulingCard({ ruling }: Props) {
  return (
    <Link href={`/rulings/${ruling.id}`} className="ruling-card ui-card">
      <div className="ruling-card__head">
        <span className="ruling-card__category">{ruling.category}</span>
        {ruling.subcategory && <span className="ruling-card__sub">{ruling.subcategory}</span>}
      </div>
      <h2 className="ruling-card__title">{ruling.title}</h2>
      {ruling.summary && <p className="ruling-card__summary">{ruling.summary}</p>}
      <div className="ruling-card__meta">
        {ruling.prevailing_view && <span className="ruling-card__badge">{ruling.prevailing_view}</span>}
        {(ruling.view_count ?? 0) > 0 && <span>{ruling.view_count} مشاهدة</span>}
        {(ruling.importance_score ?? 0) >= 75 && <span className="ruling-card__important">مهم</span>}
      </div>
      {ruling.keywords && ruling.keywords.length > 0 && (
        <div className="ruling-card__tags">
          {ruling.keywords.slice(0, 4).map((k) => (
            <span key={k} className="ruling-card__tag">
              {k}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
