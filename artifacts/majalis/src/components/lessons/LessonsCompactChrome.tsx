import { Calendar, Archive, BookOpen, ChevronLeft, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { getFeaturedHomeStatusLabel } from "@/lib/kuwait-lessons";
import {
  computeNextOccurrenceMs,
  formatLessonAppointmentLine,
  formatRelativeTimeDetailed,
  hasConfirmedLessonSchedule,
  isLessonInProgress,
} from "@/lib/lesson-time";
import { formatSheikhName } from "@/lib/sheikh-name";
import { resolveLessonDetailsHref } from "@/lib/unified-lesson-card";

type Props = {
  lesson: KuwaitLessonRecord;
  featuredHome?: boolean;
};

function statusFor(lesson: KuwaitLessonRecord, featuredHome?: boolean): string {
  if (featuredHome) {
    const label = getFeaturedHomeStatusLabel(lesson);
    if (label) return label;
  }
  const scheduleConfirmed = hasConfirmedLessonSchedule(lesson.day || "", lesson.time || "");
  if (!scheduleConfirmed) return "قيد التأكيد";
  if (isLessonInProgress(lesson.day, lesson.time)) return "اليوم";
  const ms = computeNextOccurrenceMs(lesson.day, lesson.time);
  const rel = formatRelativeTimeDetailed(ms, lesson.time);
  if (/غدا|غدًا/u.test(rel)) return "غداً";
  if (/اليوم|الآن/u.test(rel)) return "اليوم";
  if (lesson.archived) return "منتهٍ";
  return rel || "قريب";
}

/** بطاقة درس مكثّفة — سطران، ارتفاع موحّد، منطقة لمس كاملة. */
export function CompactLessonRow({ lesson, featuredHome }: Props) {
  const href = resolveLessonDetailsHref(lesson) || "/lessons";
  const sheikh = formatSheikhName(lesson.sheikhName) || lesson.sheikhName;
  const place = lesson.mosque || lesson.region || "";
  const time = formatLessonAppointmentLine({
    day: lesson.day,
    time: lesson.time,
    gregorianDate: lesson.startDate,
    uncertain: !hasConfirmedLessonSchedule(lesson.day || "", lesson.time || ""),
  }) || lesson.time || "—";
  const status = statusFor(lesson, featuredHome);

  return (
    <Link href={href} className="lesson-compact-row">
      <div className="lesson-compact-row__text">
        <h3 className="lesson-compact-row__title">{lesson.title}</h3>
        <p className="lesson-compact-row__meta">
          <span>{sheikh}</span>
          {place ? <span>{place}</span> : null}
          <span>{time}</span>
          <span className="lesson-compact-row__status">{status}</span>
        </p>
      </div>
      <ChevronLeft className="lesson-compact-row__chev" size={18} strokeWidth={2} aria-hidden="true" />
    </Link>
  );
}

type QuickProps = {
  onFilter: () => void;
  filterExpanded: boolean;
  activeFilterCount: number;
};

/** صف خيارات مضغوط: تقويم · أرشيف · حلقات + تصفية */
export function LessonsQuickBar({ onFilter, filterExpanded, activeFilterCount }: QuickProps) {
  return (
    <nav className="lessons-quick-bar" aria-label="خيارات الدروس">
      <Link href="/calendar" className="lessons-quick-bar__chip">
        <Calendar size={16} strokeWidth={2} aria-hidden="true" />
        <span>التقويم</span>
      </Link>
      <Link href="/lessons/archive" className="lessons-quick-bar__chip">
        <Archive size={16} strokeWidth={2} aria-hidden="true" />
        <span>الأرشيف</span>
      </Link>
      <Link href="/quran-circles" className="lessons-quick-bar__chip">
        <BookOpen size={16} strokeWidth={2} aria-hidden="true" />
        <span>حلقات</span>
      </Link>
      <button
        type="button"
        className={`lessons-quick-bar__chip lessons-quick-bar__chip--filter${filterExpanded ? " is-active" : ""}`}
        aria-expanded={filterExpanded}
        onClick={onFilter}
      >
        <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" />
        <span>تصفية{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</span>
      </button>
    </nav>
  );
}
