import type { FiqhSource } from "@/lib/fiqh-books";
import {
  FIQH_STATUS_LABELS,
  type FiqhContentStatus,
} from "@/lib/fiqh/fiqhNormalize";
import { cn } from "@/lib/utils";

type Props = {
  sources: FiqhSource[];
  status?: FiqhContentStatus;
  className?: string;
};

function badgeClass(status: FiqhContentStatus): string {
  if (status === "complete") return "fiqh-status-badge--complete";
  if (status === "needs_completion") return "fiqh-status-badge--needs";
  return "fiqh-status-badge--review";
}

export function FiqhSourceLine({ sources, status, className }: Props) {
  const resolved =
    status ??
    (sources.length > 0 &&
    sources.every((s) => s.book?.trim() && s.author?.trim() && s.ref?.trim())
      ? "complete"
      : "under_review");

  if (!sources.length) {
    return (
      <div className={cn("fiqh-source-line fiqh-source-line--empty", className)}>
        <h2 className="fiqh-source-line__title">المصدر أو المرجع</h2>
        <span className={cn("fiqh-status-badge", badgeClass("under_review"))}>
          {FIQH_STATUS_LABELS.under_review}
        </span>
        <p className="fiqh-source-line__note">
          لم يُثبَّت مرجع علمي كافٍ بعد؛ لا يُعرض الحكم كرأي نهائي بلا مصدر.
        </p>
      </div>
    );
  }

  return (
    <section className={cn("fiqh-source-line", className)} aria-labelledby="fiqh-source-title">
      <div className="fiqh-source-line__head">
        <h2 id="fiqh-source-title" className="fiqh-source-line__title">
          المصدر أو المرجع
        </h2>
        {resolved !== "complete" ? (
          <span className={cn("fiqh-status-badge", badgeClass(resolved))}>
            {FIQH_STATUS_LABELS[resolved]}
          </span>
        ) : null}
      </div>
      <ul className="fiqh-source-line__list">
        {sources.map((source, index) => (
          <li key={`${source.book}-${source.ref}-${index}`}>
            <strong>{source.book}</strong>
            {source.author ? <span> — {source.author}</span> : null}
            {source.ref ? <span> · {source.ref}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
