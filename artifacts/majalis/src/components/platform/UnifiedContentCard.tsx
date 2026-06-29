import { Link } from "wouter";
import type { IntelligentSearchResult } from "@/lib/scholarly-intelligence-service";

type Props = {
  item: Pick<IntelligentSearchResult, "href" | "title" | "kind_label" | "source_name" | "verification_status" | "keywords">;
  compact?: boolean;
};

/** Shared card for cross-content discovery (search, related knowledge, sheikh hub). */
export function UnifiedContentCard({ item, compact = false }: Props) {
  const meta = [
    item.kind_label,
    item.source_name,
    item.verification_status === "verified" ? "موثق" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={item.href || "/search"} className="unified-content-card-link" style={{ textDecoration: "none" }}>
      <article className={`unified-content-card ds-card${compact ? " unified-content-card--compact" : ""}`}>
        <h3 className="unified-content-card__title">{item.title}</h3>
        {meta && <p className="unified-content-card__meta">{meta}</p>}
        {!compact && item.keywords && item.keywords.length > 0 && (
          <p className="unified-content-card__keywords">{item.keywords.slice(0, 4).join(" · ")}</p>
        )}
      </article>
    </Link>
  );
}

export default UnifiedContentCard;
