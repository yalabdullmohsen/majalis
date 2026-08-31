import { memo, useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
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

function FactRow({ label, value }: { label: string; value?: string | null }) {
  const text = value != null && value !== "" ? cleanDisplayText(String(value)) : "";
  if (!text) return null;
  return (
    <div className="lesson-unified-card__fact">
      <span className="lesson-unified-card__fact-label">{label}</span>
      <span className="lesson-unified-card__fact-value">{text}</span>
    </div>
  );
}

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
  const scheduleConfirmed = hasConfirmedLessonSchedule(lesson.day || "", scheduleTime || "");
  const [statusLabel, setStatusLabel] = useState(
    scheduleConfirmed ? lesson.statusLabel : "الوقت قيد التأكيد",
  );
  const [nowLive, setNowLive] = useState(() => isLessonInProgress(lesson.day, scheduleTime));

  useEffect(() => {
    if (lesson.featuredHomeStatus === "مستمر") {
      setNowLive(true);
      setStatusLabel("مستمر");
      return;
    }
    if (!scheduleConfirmed) {
      setNowLive(false);
      setStatusLabel("الوقت قيد التأكيد");
      return;
    }
    function refresh() {
      const live = isLessonInProgress(lesson.day, scheduleTime);
      const freshMs = computeNextOccurrenceMs(lesson.day, scheduleTime);
      setNowLive(live);
      setStatusLabel(live ? "الآن" : formatRelativeTimeDetailed(freshMs, scheduleTime));
    }
    refresh();
    const earlyTimer = window.setTimeout(refresh, 5_000);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      window.clearTimeout(earlyTimer);
      window.clearInterval(timer);
    };
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

  const categoryLabel = cleanDisplayText(lesson.activityType || lesson.category || "") || "درس";
  const shortDescription = cleanDisplayText(
    lesson.description || lesson.note || lesson.linkedLessons?.[0] || "",
  );
  const displayDate = cleanDisplayText(lesson.gregorianDate || "");
  const displayDay = cleanDisplayText(lesson.day || "");
  const displayTime = scheduleConfirmed
    ? cleanDisplayText(lesson.time || formatShortLessonTime(scheduleTime) || scheduleTime || "")
    : "";
  const displayPlace = cleanDisplayText(
    [lesson.mosque, lesson.region].filter(Boolean).join(" — "),
  );
  const attendanceMode = lesson.hasLiveStream
    ? "بث مباشر"
    : lesson.activityType?.includes("عن بعد")
      ? "عن بعد"
      : displayPlace
        ? "حضوري"
        : "";
  const appointmentLine = formatLessonAppointmentLine({
    day: lesson.day,
    time: scheduleTime,
    gregorianDate: lesson.gregorianDate,
    hijriDate: lesson.hijriDate,
    uncertain: !scheduleConfirmed,
  });

  return (
    <article
      className={`lesson-unified-card card-v2${compact ? " lesson-unified-card--compact" : ""} ${prominenceClass(lesson.sortKey, lesson.archived)}`.trim()}
    >
      <header className="lesson-unified-card__header">
        <span className="lesson-unified-card__category">{categoryLabel}</span>
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
        {lesson.sheikhName ? (
          <p className="lesson-unified-card__sheikh">
            المحاضر: {lesson.sheikhName.replace(/^الشيخ(?:ة)?:\s*/u, "")}
          </p>
        ) : null}
        {shortDescription ? (
          <p className="lesson-unified-card__desc">{shortDescription}</p>
        ) : null}

        {lesson.organizerName &&
          lesson.organizerName.replace(/^الشيخ(?:ة)?:\s*/u, "") !==
            (lesson.sheikhName || "").replace(/^الشيخ(?:ة)?:\s*/u, "") && (
            <p className="lesson-unified-card__organizer">تنظيم: {lesson.organizerName}</p>
          )}

        <div className="lesson-unified-card__facts" aria-label="معلومات الدرس">
          <FactRow label="اليوم" value={displayDay} />
          <FactRow label="التاريخ" value={displayDate} />
          <FactRow
            label="الوقت"
            value={
              scheduleConfirmed
                ? displayTime || appointmentLine
                : "الوقت قيد التأكيد"
            }
          />
          <FactRow label="المكان" value={displayPlace} />
          <FactRow label="الحضور" value={attendanceMode} />
          {lesson.womenAttendance === "متاح" ? (
            <FactRow label="حضور النساء" value={lesson.womenAttendanceNote || "متاح"} />
          ) : null}
        </div>

        {!compact ? (
          <div className="lesson-unified-card__meta">
            <MetaCell label="نوع النشاط" value={lesson.activityType} />
            <MetaCell label="المنطقة" value={lesson.region} />
            <MetaCell label="المحافظة" value={lesson.governorate} />
            {lesson.linkedLessons && lesson.linkedLessons.length > 0 ? (
              <MetaCell label="الجلسات" value={lesson.linkedLessons.join(" · ")} />
            ) : null}
          </div>
        ) : null}

        <div
          className={`lesson-unified-card__actions${compact ? " lesson-unified-card__actions--compact" : ""}`}
        >
          {lesson.detailsHref ? (
            <Link href={lesson.detailsHref} className="lesson-unified-card__btn lesson-unified-card__btn--primary">
              التفاصيل
            </Link>
          ) : null}
          <FavoriteButton
            contentType="lesson"
            contentId={lesson.id}
            compact
            className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
          />
          <button
            type="button"
            className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
            onClick={() => downloadUnifiedCalendar(lesson)}
          >
            أضف للتقويم
          </button>

          {!compact && (
            <>
              <AdminInlineEdit
                contentType="lesson"
                contentId={lesson.id}
                initialData={{
                  title: lesson.title,
                  category: lesson.category,
                  mosque: lesson.mosque,
                  region: lesson.region,
                  day_of_week: lesson.day,
                  lesson_time: lesson.time,
                  description: lesson.description,
                }}
                className="lesson-unified-card__btn lesson-unified-card__btn--secondary"
              />
              <button
                type="button"
                className="lesson-unified-card__btn lesson-unified-card__btn--secondary"
                onClick={handleCopyLink}
              >
                {linkCopied ? "تم النسخ" : "نسخ الرابط"}
              </button>
              <button
                type="button"
                className="lesson-unified-card__btn lesson-unified-card__btn--secondary"
                onClick={handleCopy}
              >
                {copied ? "تم النسخ" : "نسخ البيانات"}
              </button>
              <button
                type="button"
                className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                onClick={() => void shareLesson(lesson)}
              >
                مشاركة
              </button>
              {lesson.streamUrl ? (
                <button
                  type="button"
                  className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                  onClick={() => openLessonExternalUrl(lesson.streamUrl!)}
                >
                  رابط البث
                </button>
              ) : null}
              {lesson.mapsUrl ? (
                <button
                  type="button"
                  className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
                  onClick={() => openLessonExternalUrl(lesson.mapsUrl!)}
                >
                  الموقع
                </button>
              ) : null}
            </>
          )}

          {showRegister && onToggleRegister ? (
            <button
              type="button"
              className="lesson-unified-card__btn lesson-unified-card__btn--ghost"
              onClick={onToggleRegister}
            >
              {registered ? (compact ? "مسجل" : "إلغاء التسجيل") : compact ? "حضور" : "سجّل حضوري"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
});

export default UnifiedLessonCard;
