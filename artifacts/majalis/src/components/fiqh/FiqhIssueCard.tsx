import { Link } from "wouter";
import type { FiqhLessonHit } from "@/lib/fiqh-books";
import {
  resolveLessonDoor,
  FIQH_DOOR_META,
} from "@/lib/fiqh/fiqhNormalize";
import { cn } from "@/lib/utils";

type Props = {
  hit: FiqhLessonHit;
  className?: string;
};

/** مسائل معاصرة حسّاسة — مادة موثّقة لا فتوى شخصية من المنصة */
const SENSITIVE_TOPIC_RE =
  /تأمين|بنوك|بنك|ربا|ETF|صناديق?\s*استثمار|CBD|قانّ?ب|تجميل|عمليات?\s*تجميل|عملات?\s*رقمية|كريبتو|crypto/i;

function isSensitiveHit(hit: FiqhLessonHit): boolean {
  const hay = `${hit.lesson.title}\n${hit.lesson.summary}\n${hit.chapter.title}\n${hit.book.title}`;
  return SENSITIVE_TOPIC_RE.test(hay);
}

export function FiqhIssueCard({ hit, className }: Props) {
  const door = FIQH_DOOR_META[resolveLessonDoor(hit)];
  const summary = hit.lesson.summary.trim();
  const excerpt = summary.length > 120 ? `${summary.slice(0, 117)}…` : summary;
  const sensitive = isSensitiveHit(hit);

  return (
    <article className={cn("fiqh-issue-card", sensitive && "fiqh-issue-card--documented", className)}>
      <div className="fiqh-issue-card__head">
        <span className="fiqh-issue-card__door">{door.label}</span>
        {sensitive ? (
          <span className="fiqh-status-badge fiqh-status-badge--documented">مادة موثّقة</span>
        ) : null}
        {/* حالات التحرير الداخلية (قيد التدقيق / بحاجة لاستكمال) لا تُعرض للعامة */}
      </div>
      <h3 className="fiqh-issue-card__title">
        <Link href={hit.href}>{hit.lesson.title}</Link>
      </h3>
      {excerpt ? <p className="fiqh-issue-card__summary">{excerpt}</p> : null}
      <p className="fiqh-issue-card__meta">
        {hit.book.title} · {hit.chapter.title}
      </p>
      {sensitive ? (
        <p className="fiqh-issue-card__disclaimer" role="note">
          ليست فتوى شخصية من المنصة — راجع المصدر والمنهجية قبل العمل بالحكم.
        </p>
      ) : null}
    </article>
  );
}
