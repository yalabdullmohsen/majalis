import { memo, useCallback, useEffect, useMemo, useState } from "react";
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
  formatRelativeTimeDetailed,
  formatShortLessonTime,
  hasConfirmedLessonSchedule,
  isKuwaitTomorrow,
  isLessonInProgress,
  isSameKuwaitDay,
} from "@/lib/lesson-time";
import { getLessonDeliveryMode } from "@/lib/lessons/lessonNormalize";
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

function kindBadge(lesson: UnifiedLesson): string {
  if (lesson.activityType === "دورة" || (lesson.sessionCount && lesson.sessionCount > 1)) {
    return "دورة";
  }
  return "درس";
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
  const [isToday, setIsToday] = useState(() =>
    isSameKuwaitDay(lesson.nextOccurrenceMs || lesson.sortKey || Date.now()),
  );

  useEffect(() => {
    if (lesson.featuredHomeStatus === "مستمر") {
      setNowLive(true);
      setStatusLabel("مستمر");
      setIsToday(true);
      return;
    }
    if (!scheduleConfirmed) {
      setNowLive(false);
      setStatusLabel("الوقت قيد التأكيد");
      setIsToday(false);
      return;
    }
    function refresh() {
      const live = isLessonInProgress(lesson.day, scheduleTime);
      const freshMs = computeNextOccurrenceMs(lesson.day, scheduleTime);
      setNowLive(live);
      setIsToday(isSameKuwaitDay(freshMs));
      if (live) {
        setStatusLabel("الآن");
        return;
      }
      if (isSameKuwaitDay(freshMs)) {
        const detailed = formatRelativeTimeDetailed(freshMs, scheduleTime);
        setStatusLabel(detailed === "انتهى" ? "اليوم" : detailed.startsWith("بعد") ? detailed : "اليوم");
        return;
      }
      if (isKuwaitTomorrow(freshMs)) {
        setStatusLabel("غداً");
        return;
      }
      setStatusLabel(formatRelativeTimeDetailed(freshMs, scheduleTime));
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

  const typeKind = kindBadge(lesson);
  const delivery = useMemo(
    () =>
      getLessonDeliveryMode({
        mosque: lesson.mosque,
        region: lesson.region,
        hasLiveStream: lesson.hasLiveStream,
        streamUrl: lesson.streamUrl,
      }),
    [lesson.mosque, lesson.region, lesson.hasLiveStream, lesson.streamUrl],
  );
  const shortDescription = cleanDisplayText(
    lesson.description || lesson.note || lesson.linkedLessons?.[0] || "",
  );
  const displayDay = cleanDisplayText(lesson.day || "");
  const displayDate = cleanDisplayText(lesson.gregorianDate || "");
  const displayTime = scheduleConfirmed
    ? cleanDisplayText(lesson.time || formatShortLessonTime(scheduleTime) || scheduleTime || "")
    : "";
  const displayPlace = cleanDisplayText(
    [lesson.mosque, lesson.region].filter(Boolean).join(" — "),
  );
  // موعد مختصر بلا تكرار تاريخ+وقت
  const scheduleValue = scheduleConfirmed
    ? [displayDay || displayDate, displayTime].filter(Boolean).join(" · ")
    : [displayDay || displayDate, "قيد التأكيد"].filter(Boolean).join(" · ");

  const prominence = prominenceClass(lesson.sortKey, lesson.archived);
  const todayClass =
    isToday || nowLive || prominence.includes("--today") ? " lesson-unified-card--today" : "";

  return (
    <article
      className={`lesson-unified-card card-v2${compact ? " lesson-unified-card--compact" : ""}${todayClass} ${prominence}`.trim()}
    >
      <header className="lesson-unified-card__header">
        <div className="lesson-unified-card__badges">
          <span className="lesson-unified-card__category">{typeKind}</span>
          {delivery ? <span className="lesson-unified-card__delivery">{delivery}</span> : null}
          {isToday || nowLive ? (
            <span className="lesson-unified-card__today-flag" aria-label="موعده اليوم">
              اليوم
            </span>
          ) : null}
        </div>
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
        <p className="lesson-unified-card__sheikh">
          {lesson.sheikhName
            ? lesson.sheikhName.replace(/^الشيخ(?:ة)?:\s*/u, "")
            : "الشيخ غير محدد"}
        </p>
        {!compact && shortDescription ? (
          <p className="lesson-unified-card__desc">{shortDescription}</p>
        ) : null}

        {lesson.organizerName &&
          lesson.organizerName.replace(/^الشيخ(?:ة)?:\s*/u, "") !==
            (lesson.sheikhName || "").replace(/^الشيخ(?:ة)?:\s*/u, "") && (
            <p className="lesson-unified-card__organizer">تنظيم: {lesson.organizerName}</p>
          )}

        <div className="lesson-unified-card__facts" aria-label="معلومات الدرس">
          <FactRow label="الموعد" value={scheduleValue || "الموعد غير محدد"} />
          <FactRow label="المكان" value={displayPlace || "المكان غير محدد"} />
          <FactRow label="الحضور" value={delivery || "غير محدد"} />
          {!compact && lesson.womenAttendance === "متاح" ? (
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
            className="lesson-unified-card__btn lesson-unified-card__btn--secondary"
          />
          <button
            type="button"
            className="lesson-unified-card__btn lesson-unified-card__btn--secondary"
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
