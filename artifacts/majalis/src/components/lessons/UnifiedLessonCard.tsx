import { memo, useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Clock3, MapPin, Radio } from "lucide-react";
import { AdminInlineEdit } from "@/components/AdminInlineEdit";
import {
  buildLessonCopyText,
  buildLessonShareUrl,
  downloadUnifiedCalendar,
  openLessonExternalUrl,
  prominenceClass,
  shareLesson,
  type UnifiedLesson,
} from "@/lib/unified-lesson-card";
import { cleanDisplayText } from "@/lib/display-text";
import {
  computeNextOccurrenceMs,
  formatLessonAppointmentLine,
  formatRelativeTimeDetailed,
  formatShortLessonTime,
  hasConfirmedLessonSchedule,
  isLessonInProgress,
} from "@/lib/lesson-time";
import { FavoriteButton } from "@/components/FavoriteButton";

type Props = {
  lesson: UnifiedLesson;
  compact?: boolean;
  showRegister?: boolean;
  registered?: boolean;
  onToggleRegister?: () => void;
};

function MetaCell({
  label,
  value,
  showEmpty = false,
}: {
  label: string;
  value?: string | number;
  showEmpty?: boolean;
}) {
  const text = value != null && value !== "" ? cleanDisplayText(String(value)) : "";
  if (!text && !showEmpty) return null;
  return (
    <div className="lesson-unified-card__meta-cell">
      <span className="lesson-unified-card__meta-label">{label}</span>
      <strong>{text || "لم يذكر"}</strong>
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
  const scheduleConfirmed = hasConfirmedLessonSchedule(lesson.day || "", scheduleTime || "");
  const [statusLabel, setStatusLabel] = useState(
    scheduleConfirmed ? lesson.statusLabel : "الوقت قيد التأكيد",
  );
  const [nowLive, setNowLive] = useState(() => isLessonInProgress(lesson.day, scheduleTime));

  useEffect(() => {
    if (lesson.featuredHomeStatus) {
      setNowLive(lesson.featuredHomeStatus === "مستمر");
      setStatusLabel(lesson.featuredHomeStatus);
      return;
    }
    if (!scheduleConfirmed) {
      setNowLive(false);
      setStatusLabel("الوقت قيد التأكيد");
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
  }, [lesson.day, scheduleTime, lesson.featuredHomeStatus, scheduleConfirmed]);

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
    uncertain: !scheduleConfirmed,
  });
  const timeChip = scheduleConfirmed
    ? (appointmentLine || lesson.day || lesson.time)
    : "الوقت قيد التأكيد";
  const displayDate = lesson.gregorianDate || "";
  const displayDay = lesson.day || "";
  const displayTime = scheduleConfirmed
    ? (lesson.time || formatShortLessonTime(scheduleTime) || scheduleTime || "")
    : "لم يذكر";
  const displayPlace = lesson.mosque || "";
  const placeLine = [displayPlace, lesson.region].filter(Boolean).join(" — ");
  const sessionSubject = lesson.linkedLessons?.[0] || lesson.note || lesson.description;
  const scheduleLine = [
    lesson.day,
    scheduleConfirmed ? (lesson.time || formatShortLessonTime(scheduleTime) || scheduleTime) : "الوقت قيد التأكيد",
  ].filter(Boolean).join(" · ");
  const compactMeta = [
    lesson.activityType || lesson.category,
    timeChip,
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
            المحاضر: {lesson.sheikhName.replace(/^الشيخ(?:ة)?:\s*/u, "")}
          </p>
        )}
        {sessionSubject && (
          <p className="lesson-unified-card__session-subject">{sessionSubject}</p>
        )}
        {scheduleLine && (
          <p className="lesson-unified-card__schedule-line">{scheduleLine}</p>
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
          {!compact && <MetaCell label="نوع النشاط" value={lesson.activityType} showEmpty />}
          {!compact && <MetaCell label="التاريخ" value={displayDate} showEmpty />}
          {!compact && <MetaCell label="اليوم" value={displayDay} showEmpty />}
          {!compact && <MetaCell label="الوقت" value={displayTime} showEmpty />}
          {!compact && <MetaCell label="المكان" value={displayPlace} showEmpty />}
          {!compact && lesson.womenAttendance === "متاح" && (
            <MetaCell
              label="حضور النساء"
              value={lesson.womenAttendanceNote || "متاح"}
            />
          )}
          {!compact && lesson.region && <MetaCell label="المنطقة" value={lesson.region} />}
          {!compact && lesson.governorate && <MetaCell label="المحافظة" value={lesson.governorate} />}
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
              <button
                type="button"
                className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                onClick={() => downloadUnifiedCalendar(lesson)}
              >
                أضف للتقويم
              </button>
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
                onClick={() => void shareLesson(lesson)}
              >
                مشاركة
              </button>
              <button
                type="button"
                className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                onClick={() => downloadUnifiedCalendar(lesson)}
              >
                إضافة للتقويم
              </button>
              {lesson.streamUrl && (
                <button
                  type="button"
                  className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                  onClick={() => openLessonExternalUrl(lesson.streamUrl!)}
                >
                  رابط البث
                </button>
              )}
              {lesson.mapsUrl && (
                <button
                  type="button"
                  className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                  onClick={() => openLessonExternalUrl(lesson.mapsUrl!)}
                >
                  الموقع
                </button>
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
