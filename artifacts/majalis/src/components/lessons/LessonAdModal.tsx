import { useEffect } from "react";
import type { LessonAd } from "@/lib/lesson-ads";
import { CATEGORY_LABELS } from "@/lib/lesson-ads";
import { TeacherPhoto } from "./TeacherPhoto";

function ExternalLink({
  href,
  children,
  variant = "primary",
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
  item: LessonAd | null;
  onClose: () => void;
};

export function LessonAdModal({ item, onClose }: Props) {
  useEffect(() => {
    if (!item) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="lad-modal" role="dialog" aria-modal="true" aria-labelledby="lad-modal-title">
      <button type="button" className="lad-modal__backdrop" aria-label="إغلاق" onClick={onClose} />

      <div className="lad-modal__panel">
        <div className="lad-modal__layout">
          <aside className="lad-modal__aside">
            <TeacherPhoto name={item.teacher} src={item.teacherImage} alt={item.teacher} />

            {item.posterImage && (
              <div className="lad-modal__poster">
                <img
                  src={item.posterImage}
                  alt={`ملصق ${item.title}`}
                  className="lad-modal__poster-img"
                  loading="lazy"
                />
              </div>
            )}
          </aside>

          <div className="lad-modal__content">
            <div className="lad-modal__head">
              <div>
                <p className="lad-modal__provider">{item.provider}</p>
                <h2 id="lad-modal-title" className="lad-modal__title">
                  {item.title}
                </h2>
                <p className="lad-modal__teacher">{item.teacher}</p>
                {item.startDate && (
                  <p className="lad-modal__start">بداية البرنامج: {item.startDate}</p>
                )}
              </div>

              <button type="button" className="lad-btn lad-btn--secondary" onClick={onClose}>
                إغلاق
              </button>
            </div>

            {item.detailIntro && <div className="lad-modal__intro">{item.detailIntro}</div>}

            <div className="lad-card__tags">
              <Tag>{CATEGORY_LABELS[item.category]}</Tag>
              {item.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              {item.hasWomenSection && <Tag>مكان مخصص للنساء</Tag>}
            </div>

            <div className="lad-modal__sessions">
              {item.sessions.map((session) => (
                <div key={`${item.id}-${session.label}-${session.time}`} className="lad-session">
                  <h3 className="lad-session__title">{session.label}</h3>

                  <div className="lad-session__grid">
                    <div>
                      <span className="lad-meta-label">اليوم</span>
                      <strong>{session.day}</strong>
                    </div>
                    <div>
                      <span className="lad-meta-label">الوقت</span>
                      <strong>{session.time}</strong>
                    </div>
                    <div>
                      <span className="lad-meta-label">المسجد</span>
                      <strong>{session.venue}</strong>
                    </div>
                    <div>
                      <span className="lad-meta-label">الموقع</span>
                      <strong>{session.district}</strong>
                    </div>
                  </div>

                  {session.note && <p className="lad-session__note">{session.note}</p>}

                  <div className="lad-card__actions">
                    <ExternalLink href={session.mapUrl}>الخريطة</ExternalLink>
                    <ExternalLink href={session.liveUrl} variant="secondary">
                      البث المباشر
                    </ExternalLink>
                    <ExternalLink href={session.referenceUrl} variant="secondary">
                      المادة العلمية
                    </ExternalLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
