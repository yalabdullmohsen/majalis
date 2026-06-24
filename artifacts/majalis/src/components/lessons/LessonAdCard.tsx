import type { LessonAd } from "@/lib/lesson-ads";
import { CATEGORY_LABELS, getCurrentProgressNote } from "@/lib/lesson-ads";
import { TeacherPhoto } from "./TeacherPhoto";

function ExternalLink({
  href,
  children,
  variant = "secondary",
}: {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`lad-btn lad-btn--${variant}`}
    >
      {children}
    </a>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="lad-tag">{children}</span>;
}

type Props = {
  item: LessonAd;
  compact?: boolean;
  onOpen: (item: LessonAd) => void;
};

export function LessonAdCard({ item, compact = false, onOpen }: Props) {
  const firstSession = item.sessions[0];
  const progressNote = getCurrentProgressNote(item);

  return (
    <article className={compact ? "lad-card lad-card--compact" : "lad-card"}>
      <div className="lad-card__grid">
        <TeacherPhoto
          name={item.teacher}
          src={item.teacherImage}
          alt={item.teacher}
          className="lad-card__photo"
        />

        <div className="lad-card__body">
          <div className="lad-card__badges">
            <span className="lad-badge lad-badge--gold">{CATEGORY_LABELS[item.category]}</span>
            <span className="lad-badge lad-badge--muted">{item.provider}</span>
          </div>

          <h3 className="lad-card__title">{item.title}</h3>
          <p className="lad-card__teacher">{item.teacher}</p>
          <p className="lad-card__desc">{item.shortDescription}</p>

          {progressNote && (
            <p className="lad-card__progress" role="note">
              {progressNote}
            </p>
          )}

          <div className="lad-card__meta">
            <div>
              <span className="lad-meta-label">اليوم</span>
              <strong>{firstSession.day}</strong>
            </div>
            <div>
              <span className="lad-meta-label">الوقت</span>
              <strong>{firstSession.time}</strong>
            </div>
            <div>
              <span className="lad-meta-label">المكان</span>
              <strong>{firstSession.venue}</strong>
            </div>
          </div>

          <div className="lad-card__tags">
            {item.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            {item.hasWomenSection && <Tag>قسم نساء</Tag>}
          </div>

          <div className="lad-card__actions">
            <button type="button" className="lad-btn lad-btn--primary" onClick={() => onOpen(item)}>
              عرض التفاصيل
            </button>
            <ExternalLink href={firstSession.mapUrl}>الخريطة</ExternalLink>
            <ExternalLink href={firstSession.liveUrl}>البث المباشر</ExternalLink>
            <ExternalLink href={firstSession.referenceUrl}>المادة العلمية</ExternalLink>
          </div>
        </div>
      </div>
    </article>
  );
}
