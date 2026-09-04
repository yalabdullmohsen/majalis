import type { ReactNode } from "react";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { formatSheikhName } from "@/lib/sheikh-name";
import { isOnlineVenue } from "@/lib/lessons/lessonNormalize";
import { computeNextOccurrenceMs, isSameKuwaitDay, isSameKuwaitWeek } from "@/lib/lesson-time";
import { isWomenFriendlyLesson } from "@/lib/lesson-women-attendance";

export type LessonQuickFilterId =
  | "all"
  | "lessons"
  | "courses"
  | "in_person"
  | "remote"
  | "archive"
  | "today"
  | "this_week"
  | "women";

export type LessonQuickFilters = {
  schedule: LessonQuickFilterId;
  sheikh: string;
  category: string;
};

export const DEFAULT_LESSON_QUICK_FILTERS: LessonQuickFilters = {
  schedule: "all",
  sheikh: "كل المشايخ",
  category: "الكل",
};

/** فلاتر سريعة موحّدة أعلى صفحة الدروس */
const SCHEDULE_CHIPS: Array<{ id: LessonQuickFilterId; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "lessons", label: "دروس" },
  { id: "courses", label: "دورات" },
  { id: "in_person", label: "حضوري" },
  { id: "remote", label: "عن بعد" },
  { id: "today", label: "اليوم" },
  { id: "archive", label: "أرشيف" },
];

/** مدعوم برمجياً: هذا الأسبوع (غير ظاهر في الشريط المختصر) */
export const LESSON_WEEK_FILTER_LABEL = "هذا الأسبوع";

function isStandaloneLesson(lesson: KuwaitLessonRecord): boolean {
  return !(lesson.isCourse || lesson.activityType === "دورة");
}

export function applyLessonQuickFilters(
  lessons: KuwaitLessonRecord[],
  filters: LessonQuickFilters,
  nowMs = Date.now(),
): KuwaitLessonRecord[] {
  if (filters.schedule === "archive") return [];

  return lessons.filter((lesson) => {
    const nextMs = lesson.nextOccurrenceMs ?? computeNextOccurrenceMs(lesson.day, lesson.time);
    const inPerson = Boolean(lesson.mosque?.trim()) && !isOnlineVenue(lesson.mosque, lesson.region);
    const remote =
      Boolean(lesson.hasLiveStream || lesson.streamUrl) || isOnlineVenue(lesson.mosque, lesson.region);

    if (filters.schedule === "in_person" && !inPerson) return false;
    if (filters.schedule === "remote" && !remote) return false;
    if (filters.schedule === "today" && !isSameKuwaitDay(nextMs, nowMs)) return false;
    if (filters.schedule === "this_week" && !isSameKuwaitWeek(nextMs, nowMs)) return false;
    if (filters.schedule === "courses" && !(lesson.isCourse || lesson.activityType === "دورة")) {
      return false;
    }
    if (filters.schedule === "lessons" && !isStandaloneLesson(lesson)) return false;
    if (filters.schedule === "women" && !isWomenFriendlyLesson(lesson)) return false;

    if (filters.sheikh !== "كل المشايخ") {
      const target = formatSheikhName(filters.sheikh) || filters.sheikh;
      const name = formatSheikhName(lesson.sheikhName) || lesson.sheikhName;
      if (name !== target) return false;
    }
    if (filters.category !== "الكل" && lesson.category !== filters.category) return false;
    return true;
  });
}

type Props = {
  lessons: KuwaitLessonRecord[];
  filters: LessonQuickFilters;
  onChange: (next: LessonQuickFilters) => void;
  searchSlot?: ReactNode;
  filterSlot?: ReactNode;
};

export function LessonFilters({ filters, onChange, searchSlot, filterSlot }: Props) {
  return (
    <div className="lesson-filters lesson-filters--compact">
      <div className="lesson-filters__bar">
        <div className="lesson-filters__chips filter-chips" role="toolbar" aria-label="تصفية سريعة">
          {SCHEDULE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`filter-chips__chip${filters.schedule === chip.id ? " is-active" : ""}`}
              aria-pressed={filters.schedule === chip.id}
              onClick={() => onChange({ ...filters, schedule: chip.id })}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="lesson-filters__tools">
          {searchSlot}
          {filterSlot}
        </div>
      </div>
    </div>
  );
}
