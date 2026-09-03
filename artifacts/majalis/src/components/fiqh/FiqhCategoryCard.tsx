import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { formatMasailCount } from "@/lib/arabic-count";
import {
  FIQH_STATUS_LABELS,
  type FiqhContentStatus,
  type FiqhDoorSummary,
} from "@/lib/fiqh/fiqhNormalize";
import { cn } from "@/lib/utils";

type Props = {
  door: FiqhDoorSummary;
  className?: string;
};

function statusClass(status: FiqhContentStatus): string {
  switch (status) {
    case "complete":
      return "fiqh-status-badge--complete";
    case "needs_completion":
      return "fiqh-status-badge--needs";
    default:
      return "fiqh-status-badge--review";
  }
}

export function FiqhCategoryCard({ door, className }: Props) {
  const entryHref = door.bookHref ?? door.href;
  const showCount = door.hasVerifiedIssueCount && door.issueCount > 0;

  return (
    <article className={cn("fiqh-category-card", className)}>
      <div className="fiqh-category-card__head">
        <h3 className="fiqh-category-card__title">{door.label}</h3>
        <span className={cn("fiqh-status-badge", statusClass(door.status))}>
          {FIQH_STATUS_LABELS[door.status]}
        </span>
      </div>
      <p className="fiqh-category-card__desc">{door.desc}</p>
      {showCount ? (
        <p className="fiqh-category-card__meta">{formatMasailCount(door.issueCount)}</p>
      ) : null}
      <Link href={entryHref} className="fiqh-category-card__cta">
        <span>دخول الباب</span>
        <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
      </Link>
    </article>
  );
}
