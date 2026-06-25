import { memo, useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  buildLessonCopyText,
  buildLessonShareUrl,
  downloadUnifiedCalendar,
  prominenceClass,
  type UnifiedLesson,
} from "@/lib/unified-lesson-card";
import { cleanDisplayText } from "@/lib/display-text";
import { formatRelativeTime } from "@/lib/lesson-time";
import { FavoriteButton } from "@/components/FavoriteButton";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";

type Props = {
  lesson: UnifiedLesson;
  compact?: boolean;
  showRegister?: boolean;
  registered?: boolean;
  onToggleRegister?: () => void;
};

function MetaCell({ label, value }: { label: string; value?: string | number }) {
  const text = value != null && value !== "" ? cleanDisplayText(String(value)) : "";
  if (!text) return null;
  return (
    <div className="lesson-unified-card__meta-cell">
      <span className="lesson-unified-card__meta-label">{label}</span>
      <strong>{text}</strong>
    </div>
  );
}

function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      width={320}
      height={180}
    />
  );
}

export const UnifiedLessonCard = memo(function UnifiedLessonCard({
  lesson,
  compact = false,
  showRegister,
  registered,
  onToggleRegister,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [statusLabel, setStatusLabel] = useState(lesson.statusLabel);

  useEffect(() => {
    setStatusLabel(lesson.statusLabel);
    const timer = window.setInterval(() => {
      setStatusLabel(formatRelativeTime(lesson.nextOccurrenceMs));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [lesson.nextOccurrenceMs, lesson.statusLabel]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildLessonCopyText(lesson));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  }, [lesson]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildLessonShareUrl(lesson));
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* silent */
    }
  }, [lesson]);

  const handleShare = useCallback(async () => {
    const url = buildLessonShareUrl(lesson);
    const text = buildLessonCopyText(lesson);
    if (navigator.share) {
      try {
        await navigator.share({ title: lesson.title, text, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await handleCopy();
  }, [lesson, handleCopy]);

  const flags = [
    lesson.hasLiveStream ? "بث مباشر" : "",
    lesson.hasRecording ? "تسجيل متاح" : "",
    lesson.sessionCount ? `${lesson.sessionCount} لقاءات` : "",
  ].filter(Boolean);

  return (
    <article
      className={`lesson-unified-card${compact ? " lesson-unified-card--compact" : ""} ${prominenceClass(lesson.sortKey, lesson.archived)}`.trim()}
    >
      <header className="lesson-unified-card__header">
        <span className="lesson-unified-card__category">{lesson.category}</span>
        <span className="lesson-unified-card__status">{statusLabel}</span>
      </header>

      <div className="lesson-unified-card__body">
        <div className={`lesson-unified-card__top${compact ? " lesson-unified-card__top--compact" : ""}`}>
          {lesson.sheikhImage && (
            <SheikhAvatar src={lesson.sheikhImage} name={lesson.sheikhName} size={compact ? 48 : 56} />
          )}
          <div className="lesson-unified-card__headline">
            <h3 className="lesson-unified-card__title">{lesson.title}</h3>
            {lesson.sheikhName && (
              <p className="lesson-unified-card__sheikh">{lesson.sheikhName}</p>
            )}
          </div>
        </div>

        {!compact && lesson.lessonImage && (
          <div className="lesson-unified-card__media">
            <LazyImage src={lesson.lessonImage} alt={lesson.title} className="lesson-unified-card__poster" />
          </div>
        )}

        {flags.length > 0 && (
          <div className="lesson-unified-card__flags">
            {flags.map((flag) => (
              <span key={flag} className="lesson-unified-card__flag">{flag}</span>
            ))}
          </div>
        )}

        <div className="lesson-unified-card__meta">
          {!compact && <MetaCell label="نوع النشاط" value={lesson.activityType} />}
          <MetaCell label="اليوم" value={lesson.day} />
          {!compact && <MetaCell label="التاريخ" value={lesson.gregorianDate} />}
          {!compact && <MetaCell label="التاريخ الهجري" value={lesson.hijriDate} />}
          <MetaCell label="الوقت" value={lesson.time} />
          <MetaCell label="المكان" value={lesson.mosque} />
          <MetaCell label="المنطقة" value={lesson.region} />
          {!compact && <MetaCell label="المحافظة" value={lesson.governorate} />}
          {!compact && lesson.linkedLessons && lesson.linkedLessons.length > 0 && (
            <MetaCell label="الجلسات" value={lesson.linkedLessons.join(" · ")} />
          )}
        </div>

        {!compact && lesson.qrCodeUrl && (
          <div className="lesson-unified-card__qr">
            <LazyImage src={lesson.qrCodeUrl} alt="QR Code" className="lesson-unified-card__qr-img" />
          </div>
        )}

        {!compact && lesson.note && (
          <p className="lesson-unified-card__note">{lesson.note}</p>
        )}

        <div className="lesson-unified-card__actions">
          <Link href={lesson.detailsHref} className="lesson-unified-card__btn lesson-unified-card__btn--primary">
            التفاصيل
          </Link>
          {!compact && (
            <>
              <button type="button" className="lesson-unified-card__btn lesson-unified-card__btn--secondary" onClick={handleShare}>
                مشاركة
              </button>
              <button type="button" className="lesson-unified-card__btn lesson-unified-card__btn--secondary" onClick={handleCopyLink}>
                {linkCopied ? "تم النسخ" : "نسخ الرابط"}
              </button>
              <button type="button" className="lesson-unified-card__btn lesson-unified-card__btn--secondary" onClick={handleCopy}>
                {copied ? "تم النسخ" : "نسخ البيانات"}
              </button>
              <FavoriteButton contentType="lesson" contentId={lesson.id} compact className="lesson-unified-card__btn lesson-unified-card__btn--ghost" />
              <button
                type="button"
                className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                onClick={() => downloadUnifiedCalendar(lesson)}
              >
                إضافة للتقويم
              </button>
              {lesson.streamUrl && (
                <a href={lesson.streamUrl} target="_blank" rel="noopener noreferrer" className="lesson-unified-card__btn lesson-unified-card__btn--ghost">
                  رابط البث
                </a>
              )}
              {lesson.mapsUrl && (
                <a href={lesson.mapsUrl} target="_blank" rel="noopener noreferrer" className="lesson-unified-card__btn lesson-unified-card__btn--ghost">
                  الموقع
                </a>
              )}
            </>
          )}
          {showRegister && onToggleRegister && (
            <button
              type="button"
              className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
              onClick={onToggleRegister}
            >
              {registered ? "إلغاء التسجيل" : "سجّل حضوري"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
});

export default UnifiedLessonCard;
