import { memo, useCallback, useEffect, useState } from "react";
import { resolveLessonPosterUrl } from "@/lib/lesson-image";
import { Link } from "wouter";
import { AdminInlineEdit } from "@/components/AdminInlineEdit";
import {
  buildLessonCopyText,
  buildLessonShareUrl,
  downloadUnifiedCalendar,
  prominenceClass,
  type UnifiedLesson,
} from "@/lib/unified-lesson-card";
import { cleanDisplayText } from "@/lib/display-text";
import { computeNextOccurrenceMs, formatRelativeTimeDetailed, isLessonInProgress } from "@/lib/lesson-time";
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
  const [nowLive, setNowLive] = useState(() => isLessonInProgress(lesson.day, lesson.time));

  useEffect(() => {
    function refresh() {
      const live    = isLessonInProgress(lesson.day, lesson.time);
      const freshMs = computeNextOccurrenceMs(lesson.day, lesson.time);
      setNowLive(live);
      setStatusLabel(live ? "الآن" : formatRelativeTimeDetailed(freshMs, lesson.time));
    }
    refresh();
    const earlyTimer = window.setTimeout(refresh, 5_000);
    const timer = window.setInterval(refresh, 60_000);
    return () => { window.clearTimeout(earlyTimer); window.clearInterval(timer); };
  }, [lesson.day, lesson.time]);

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

  const posterUrl = resolveLessonPosterUrl(lesson.lessonImage);
  const flags = [
    lesson.hasLiveStream ? "بث مباشر" : "",
    lesson.hasRecording ? "تسجيل متاح" : "",
    lesson.sessionCount ? `${lesson.sessionCount} لقاءات` : "",
  ].filter(Boolean);

  return (
    <article
      className={`lesson-unified-card card-v2${compact ? " lesson-unified-card--compact" : ""} ${prominenceClass(lesson.sortKey, lesson.archived)}`.trim()}
    >
      <header className="lesson-unified-card__header">
        <span className="lesson-unified-card__category">{lesson.category}</span>
        {nowLive ? (
          <span className="lesson-now-badge" role="status" aria-label="الدرس جارٍ الآن">
            <span aria-hidden="true">●</span> الآن
          </span>
        ) : (
          <span className="lesson-unified-card__status">{statusLabel}</span>
        )}
      </header>

      <div className="lesson-unified-card__body">
        <div className={`lesson-unified-card__top${compact ? " lesson-unified-card__top--compact" : ""}`}>
          <SheikhAvatar src={lesson.sheikhImage} name={lesson.sheikhName} size={compact ? 64 : 76} />
          <div className="lesson-unified-card__headline">
            <h3 className="lesson-unified-card__title">{lesson.title}</h3>
            {lesson.sheikhName && (
              <p className="lesson-unified-card__sheikh">{lesson.sheikhName}</p>
            )}
          </div>
        </div>

        {!compact && posterUrl && (
          <div className="lesson-unified-card__media">
            <LazyImage src={posterUrl} alt={lesson.title} className="lesson-unified-card__poster" />
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
            <LazyImage src={lesson.qrCodeUrl} alt={`رمز QR: ${lesson.title}`} className="lesson-unified-card__qr-img" />
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
              <AdminInlineEdit
                contentType="lesson"
                contentId={lesson.id}
                initialData={{ title: lesson.title, category: lesson.category, mosque: lesson.mosque, region: lesson.region, day_of_week: lesson.day, lesson_time: lesson.time, description: lesson.description }}
                className="lesson-unified-card__btn lesson-unified-card__btn--secondary"
              />
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
