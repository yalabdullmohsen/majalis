import { memo, useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Clock3, MapPin, Radio } from "lucide-react";
import { AdminInlineEdit } from "@/components/AdminInlineEdit";
import {
  buildLessonCopyText,
  buildLessonShareUrl,
  downloadUnifiedCalendar,
  prominenceClass,
  type UnifiedLesson,
} from "@/lib/unified-lesson-card";
import { cleanDisplayText } from "@/lib/display-text";
import {
  computeNextOccurrenceMs,
  formatLessonAppointmentLine,
  formatRelativeTimeDetailed,
  isLessonInProgress,
} from "@/lib/lesson-time";
import { FavoriteButton } from "@/components/FavoriteButton";
import { hrefTeachers } from "@/lib/content-href";
import { sheikhNameKey } from "@/lib/sheikh-name";

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

export const UnifiedLessonCard = memo(function UnifiedLessonCard({
  lesson,
  compact = false,
  showRegister,
  registered,
  onToggleRegister,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const scheduleTime = lesson.scheduleTime || lesson.time;
  const [statusLabel, setStatusLabel] = useState(lesson.statusLabel);
  const [nowLive, setNowLive] = useState(() => isLessonInProgress(lesson.day, scheduleTime));

  useEffect(() => {
    if (lesson.featuredHomeStatus) {
      setNowLive(lesson.featuredHomeStatus === "مستمر");
      setStatusLabel(lesson.featuredHomeStatus);
      return;
    }
    function refresh() {
      const live    = isLessonInProgress(lesson.day, scheduleTime);
      const freshMs = computeNextOccurrenceMs(lesson.day, scheduleTime);
      setNowLive(live);
      setStatusLabel(live ? "الآن" : formatRelativeTimeDetailed(freshMs, scheduleTime));
    }
    refresh();
    const earlyTimer = window.setTimeout(refresh, 5_000);
    const timer = window.setInterval(refresh, 60_000);
    return () => { window.clearTimeout(earlyTimer); window.clearInterval(timer); };
  }, [lesson.day, scheduleTime, lesson.featuredHomeStatus]);

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

  const flags = [
    lesson.hasLiveStream ? "بث مباشر" : "",
    lesson.hasRecording ? "تسجيل متاح" : "",
    lesson.sessionCount ? `${lesson.sessionCount} لقاءات` : "",
  ].filter(Boolean);
  const appointmentLine = formatLessonAppointmentLine({
    day: lesson.day,
    time: scheduleTime,
    gregorianDate: lesson.gregorianDate,
    hijriDate: lesson.hijriDate,
  });
  const placeLine = [lesson.mosque, lesson.region].filter(Boolean).join(" — ");
  const compactMeta = [
    lesson.activityType || lesson.category,
    appointmentLine || lesson.day || lesson.time,
    placeLine,
    lesson.hasLiveStream ? "بث مباشر" : "",
  ].filter(Boolean).slice(0, 4);

  return (
    <article
      className={`lesson-unified-card card-v2${compact ? " lesson-unified-card--compact" : ""} ${prominenceClass(lesson.sortKey, lesson.archived)}`.trim()}
    >
      <header className="lesson-unified-card__header">
        <span className="lesson-unified-card__category">{lesson.category}</span>
        {nowLive && !lesson.featuredHomeStatus ? (
          <span className="lesson-now-badge" role="status" aria-label="الدرس جارٍ الآن">
            <span aria-hidden="true">●</span> الآن
          </span>
        ) : (
          <span className="lesson-unified-card__status">{statusLabel}</span>
        )}
      </header>

      <div className="lesson-unified-card__body">
        <h3 className="lesson-unified-card__title">{lesson.title}</h3>
        {lesson.sheikhName && (
          <p className="lesson-unified-card__sheikh">
            المحاضر:{" "}
            <Link href={hrefTeachers(sheikhNameKey(lesson.sheikhName))} className="lesson-unified-card__sheikh-link">
              {lesson.sheikhName.replace(/^الشيخ(?:ة)?:\s*/u, "")}
            </Link>
          </p>
        )}
        {lesson.organizerName &&
          lesson.organizerName.replace(/^الشيخ(?:ة)?:\s*/u, "") !==
            lesson.sheikhName.replace(/^الشيخ(?:ة)?:\s*/u, "") && (
          <p className="lesson-unified-card__organizer">تنظيم: {lesson.organizerName}</p>
        )}

        {flags.length > 0 && !compact && (
          <div className="lesson-unified-card__flags">
            {flags.map((flag) => (
              <span key={flag} className="lesson-unified-card__flag">{flag}</span>
            ))}
          </div>
        )}

        {compact && (
          <div className="lesson-unified-card__compact-meta" aria-label="ملخص الدرس">
            {compactMeta.map((item, index) => {
              const Icon = index === 0 ? BookOpen : index === 1 ? Clock3 : index === 2 ? MapPin : Radio;
              return (
                <span key={`${lesson.id}-${item}-${index}`} className="lesson-unified-card__compact-chip">
                  <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
                  <span>{item}</span>
                </span>
              );
            })}
          </div>
        )}

        <div className={`lesson-unified-card__meta${compact ? " lesson-unified-card__meta--compact" : ""}`}>
          {!compact && <MetaCell label="نوع النشاط" value={lesson.activityType} />}
          {!compact && <MetaCell label="الموعد" value={appointmentLine || undefined} />}
          {!compact && <MetaCell label="المكان" value={lesson.mosque} />}
          {!compact && <MetaCell label="المنطقة" value={lesson.region} />}
          {!compact && <MetaCell label="المحافظة" value={lesson.governorate} />}
          {!compact && lesson.linkedLessons && lesson.linkedLessons.length > 0 && (
            <MetaCell label="الجلسات" value={lesson.linkedLessons.join(" · ")} />
          )}
        </div>

        {!compact && lesson.note && (
          <p className="lesson-unified-card__note">{lesson.note}</p>
        )}

        <div className={`lesson-unified-card__actions${compact ? " lesson-unified-card__actions--compact" : ""}`}>
          {lesson.detailsHref ? (
            <Link href={lesson.detailsHref} className="lesson-unified-card__btn lesson-unified-card__btn--primary">
              التفاصيل
            </Link>
          ) : null}
          {compact && (
            <>
              <FavoriteButton contentType="lesson" contentId={lesson.id} compact className="lesson-unified-card__btn lesson-unified-card__btn--ghost" />
              {showRegister && onToggleRegister && (
                <button
                  type="button"
                  className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                  onClick={onToggleRegister}
                >
                  {registered ? "مسجل" : "حضور"}
                </button>
              )}
            </>
          )}
          {!compact && (
            <>
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
          {!compact && showRegister && onToggleRegister && (
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
