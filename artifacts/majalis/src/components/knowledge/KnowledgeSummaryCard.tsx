import type { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { cn } from "@/lib/utils";
import {
  hasKnowledgeDetailContent,
  type KnowledgeDetailField,
  type KnowledgeDetailSection,
} from "@/lib/knowledge-detail";
import "@/styles/components/knowledge-summary-card.css";

export type { KnowledgeDetailField, KnowledgeDetailSection };
export { hasKnowledgeDetailContent };

export type KnowledgeSummaryCardProps = {
  href: string;
  title: string;
  summary?: string;
  icon?: string;
  category?: string;
  status?: string;
  statusMuted?: boolean;
  reviewHint?: string;
  ctaLabel?: string;
  onNavigate?: () => void;
  className?: string;
  id?: string;
};

/**
 * بطاقة مختصرة موحّدة لأقسام المعرفة — بلا توسعة داخل القائمة، بلا Card داخل Card، بلا شريط جانبي.
 */
export function KnowledgeSummaryCard({
  href,
  title,
  summary,
  icon,
  category,
  status,
  statusMuted,
  reviewHint,
  ctaLabel = "عرض التفاصيل",
  onNavigate,
  className,
  id,
}: KnowledgeSummaryCardProps) {
  return (
    <article
      id={id}
      className={cn("kx-summary-card", className)}
      data-content-type="directory-summary"
      data-verification-state={reviewHint ? "needs_specialist_review" : "catalog"}
    >
      <Link
        href={href}
        className="kx-summary-card__link"
        onClick={() => onNavigate?.()}
        aria-label={`${title} — ${ctaLabel}`}
      >
        <div className="kx-summary-card__head">
          {icon ? (
            <span className="kx-summary-card__icon" aria-hidden="true">
              <SectionIcon name={icon} size={22} />
            </span>
          ) : null}
          <div className="kx-summary-card__head-text">
            <h3 className="kx-summary-card__title">{title}</h3>
            {(category || status || reviewHint) && (
              <div className="kx-summary-card__badges">
                {category ? (
                  <span className="kx-summary-card__pill">{category}</span>
                ) : null}
                {status ? (
                  <span
                    className={cn(
                      "kx-summary-card__pill",
                      statusMuted && "kx-summary-card__pill--muted",
                    )}
                  >
                    {status}
                  </span>
                ) : null}
                {reviewHint ? (
                  <span className="kx-summary-card__pill kx-summary-card__pill--review">
                    {reviewHint}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
        {summary ? <p className="kx-summary-card__summary">{summary}</p> : null}
        <span className="kx-summary-card__cta">
          {ctaLabel}
          <ChevronLeft size={16} aria-hidden="true" />
        </span>
      </Link>
    </article>
  );
}

export type KnowledgeDetailSectionUi = Omit<KnowledgeDetailSection, "children"> & {
  children?: ReactNode;
};
