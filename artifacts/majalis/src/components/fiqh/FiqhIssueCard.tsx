import { Link } from "wouter";
import type { FiqhLessonHit } from "@/lib/fiqh-books";
import {
  FIQH_STATUS_LABELS,
  getLessonContentStatus,
  resolveLessonDoor,
  FIQH_DOOR_META,
} from "@/lib/fiqh/fiqhNormalize";
import { cn } from "@/lib/utils";

type Props = {
  hit: FiqhLessonHit;
  className?: string;
};

function statusClass(hit: FiqhLessonHit): string {
  const status = getLessonContentStatus(hit.lesson);
  if (status === "complete") return "fiqh-status-badge--complete";
  if (status === "needs_completion") return "fiqh-status-badge--needs";
  return "fiqh-status-badge--review";
}

export function FiqhIssueCard({ hit, className }: Props) {
  const status = getLessonContentStatus(hit.lesson);
  const door = FIQH_DOOR_META[resolveLessonDoor(hit)];
  const summary = hit.lesson.summary.trim();
  const excerpt = summary.length > 120 ? `${summary.slice(0, 117)}…` : summary;

  return (
    <article className={cn("fiqh-issue-card", className)}>
      <div className="fiqh-issue-card__head">
        <span className="fiqh-issue-card__door">{door.label}</span>
        {status !== "complete" ? (
          <span className={cn("fiqh-status-badge", statusClass(hit))}>
            {FIQH_STATUS_LABELS[status]}
          </span>
        ) : null}
      </div>
      <h3 className="fiqh-issue-card__title">
        <Link href={hit.href}>{hit.lesson.title}</Link>
      </h3>
      {excerpt ? <p className="fiqh-issue-card__summary">{excerpt}</p> : null}
      <p className="fiqh-issue-card__meta">
        {hit.book.title} · {hit.chapter.title}
      </p>
    </article>
  );
}
