import { memo } from "react";
import { Link } from "wouter";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { getRelativeStatusLabel } from "@/lib/kuwait-lessons";
import { cleanDisplayText } from "@/lib/display-text";
import { formatLessonAppointmentLine, hasConfirmedLessonSchedule } from "@/lib/lesson-time";
import { getLessonDeliveryMode } from "@/lib/lessons/lessonNormalize";
import { LessonStatusBadge, resolveStatusVariant, WomenAttendanceBadge } from "./LessonStatusBadge";

type Props = {
  lesson: KuwaitLessonRecord;
  archived?: boolean;
  compact?: boolean;
};

function MetaItem({ label, value }: { label: string; value?: string | null }) {
  const text = value ? cleanDisplayText(value) : "";
  if (!text) return null;
  return (
    <div className="lesson-card__meta-item">
      <span className="lesson-card__meta-label">{label}</span>
      <span className="lesson-card__meta-value">{text}</span>
    </div>
  );
}

export const LessonCard = memo(function LessonCard({ lesson, archived = false, compact = true }: Props) {
  const unified = fromKuwaitLesson(lesson, archived);
  const scheduleConfirmed = hasConfirmedLessonSchedule(lesson.day || "", lesson.time || "");
  const statusLabel = scheduleConfirmed ? getRelativeStatusLabel(lesson, archived) : "الوقت قيد التأكيد";
  const delivery = getLessonDeliveryMode(lesson);
  const appointment = formatLessonAppointmentLine({
    day: lesson.day,
    time: lesson.time,
    gregorianDate: lesson.gregorianDate,
    hijriDate: lesson.hijriDate,
    uncertain: !scheduleConfirmed,
  });
  const place = [lesson.mosque, lesson.region].filter(Boolean).join(" — ");

  const inner = (
    <>
      <header className="lesson-card__header">
        <h3 className="lesson-card__title">{unified.title}</h3>
        <LessonStatusBadge label={statusLabel} variant={resolveStatusVariant(statusLabel)} />
      </header>
      <div className={`lesson-card__body${compact ? " lesson-card__body--compact" : ""}`}>
        <MetaItem label="الشيخ" value={unified.sheikhName} />
        <MetaItem label="الموعد" value={appointment} />
        {scheduleConfirmed ? <MetaItem label="الوقت" value={unified.time} /> : null}
        <MetaItem label="المكان" value={place} />
        {delivery ? <MetaItem label="النوع" value={delivery} /> : null}
        {lesson.womenAttendance === "متاح" ? (
          <WomenAttendanceBadge note={lesson.womenAttendanceNote || "متاح"} />
        ) : null}
      </div>
    </>
  );

  if (unified.detailsHref) {
    return (
      <article className="lesson-card card-v2">
        <Link href={unified.detailsHref} className="lesson-card__link">
          {inner}
        </Link>
      </article>
    );
  }

  return <article className="lesson-card card-v2">{inner}</article>;
});
