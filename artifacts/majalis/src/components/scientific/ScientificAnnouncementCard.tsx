import { Link } from "wouter";
import type { ScientificAnnouncement } from "@/lib/scientific-announcements";
import { formatAnnouncementDate, getLocationLabel } from "@/lib/scientific-announcements";

type Props = {
  item: ScientificAnnouncement;
  compact?: boolean;
};

function MetaRow({ label, value }: { label: string; value?: string }) {
  if (!value || value === "غير محدد") return null;
  return (
    <div className="sci-ann-card__meta-row">
      <span className="sci-ann-card__meta-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ScientificAnnouncementCard({ item, compact = false }: Props) {
  const place = getLocationLabel(item);
  const schedule =
    item.kind === "weekly"
      ? `كل ${item.recurrenceDay || item.day || ""}`
      : item.date
        ? formatAnnouncementDate(item)
        : item.day || "غير محدد";

  return (
    <article className={`sci-ann-card${compact ? " sci-ann-card--compact" : ""}`}>
      <header className="sci-ann-card__header">
        <span className="sci-ann-card__ribbon">{item.announcementTitle}</span>
        {item.kind === "online_course" && (
          <span className="sci-ann-card__badge">دورة إلكترونية</span>
        )}
      </header>

      <div className="sci-ann-card__body">
        <h3 className="sci-ann-card__title">{item.lessonTitle}</h3>
        <p className="sci-ann-card__sheikh">{item.sheikh}</p>

        {item.bookTitle && !compact && (
          <p className="sci-ann-card__book">
            {item.bookTitle}
            {item.bookAuthor ? (
              <>
                <span className="sci-ann-card__book-sep" aria-hidden="true"> · </span>
                {item.bookAuthor}
              </>
            ) : null}
          </p>
        )}

        <div className="sci-ann-card__meta">
          <MetaRow label="الموعد" value={schedule} />
          <MetaRow label="الوقت" value={item.time} />
          <MetaRow label="المكان" value={place !== "غير محدد" ? place : undefined} />
          <MetaRow label="المنطقة" value={item.region} />
        </div>

        {!compact && item.tags.length > 0 && (
          <div className="sci-ann-card__tags">
            {item.tags.map((tag) => (
              <span key={tag} className="sci-ann-card__tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="sci-ann-card__actions">
          <Link href={`/scientific-announcements/${item.id}`} className="sci-ann-btn sci-ann-btn--primary">
            التفاصيل
          </Link>
          {item.registrationUrl && (
            <a
              href={item.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sci-ann-btn sci-ann-btn--secondary"
            >
              التسجيل
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default ScientificAnnouncementCard;
