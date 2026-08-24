import { ExternalLink, UserRound } from "lucide-react";
import type { HarvestFeedCard } from "@/lib/harvest-feed";
import { formatRelativeTime } from "@/lib/lesson-time";
import "@/styles/components/source-item-card.css";

type Props = {
  card: HarvestFeedCard;
  compact?: boolean;
};

export function SourceItemCard({ card, compact }: Props) {
  const source = card.sources[0];
  const countdown = card.starts_at
    ? formatRelativeTime(Date.parse(card.starts_at))
    : card.time_text || "";
  const meta = [card.sheikh, card.place, countdown].filter(Boolean).join(" · ");

  return (
    <article className="src-card" data-src-type={card.type} dir="rtl">
      <header className="src-card__head">
        <span className="src-card__badge">{card.type}</span>
        {source ? <span className="src-card__org">{source.name_ar}</span> : null}
      </header>
      <h3 className="src-card__title">{card.title_ar}</h3>
      {!compact && card.summary_ar ? <p className="src-card__summary">{card.summary_ar}</p> : null}
      {meta ? (
        <p className="src-card__meta">
          <UserRound size={14} aria-hidden />
          {meta}
        </p>
      ) : null}
      <div className="src-card__actions">
        {source?.post_url ? (
          <a className="src-card__btn src-card__btn--primary" href={source.post_url} target="_blank" rel="noopener noreferrer">
            المصدر
            <ExternalLink size={14} aria-hidden />
          </a>
        ) : null}
        {card.register_url ? (
          <a className="src-card__btn" href={card.register_url} target="_blank" rel="noopener noreferrer">
            التسجيل
            <ExternalLink size={14} aria-hidden />
          </a>
        ) : null}
      </div>
    </article>
  );
}
