import { useMemo, type ReactNode } from "react";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { extractFilterOptions } from "@/lib/kuwait-lessons";
import { formatSheikhName } from "@/lib/sheikh-name";
import { isOnlineVenue } from "@/lib/lessons/lessonNormalize";
import { computeNextOccurrenceMs } from "@/lib/lesson-time";

export type LessonQuickFilterId =
  | "all"
  | "in_person"
  | "remote"
  | "today"
  | "this_week";

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

const SCHEDULE_CHIPS: Array<{ id: LessonQuickFilterId; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "in_person", label: "حضوري" },
  { id: "remote", label: "عن بعد" },
  { id: "today", label: "اليوم" },
  { id: "this_week", label: "هذا الأسبوع" },
];

function isTodayMs(ms: number, now = Date.now()): boolean {
  const d = new Date(ms);
  const n = new Date(now);
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function isThisWeekMs(ms: number, now = Date.now()): boolean {
  const end = now + 7 * 24 * 60 * 60 * 1000;
  return ms >= now && ms <= end;
}

export function applyLessonQuickFilters(
  lessons: KuwaitLessonRecord[],
  filters: LessonQuickFilters,
  nowMs = Date.now(),
): KuwaitLessonRecord[] {
  return lessons.filter((lesson) => {
    const nextMs = lesson.nextOccurrenceMs ?? computeNextOccurrenceMs(lesson.day, lesson.time);
    const inPerson = Boolean(lesson.mosque?.trim()) && !isOnlineVenue(lesson.mosque, lesson.region);
    const remote =
      Boolean(lesson.hasLiveStream || lesson.streamUrl) || isOnlineVenue(lesson.mosque, lesson.region);

    if (filters.schedule === "in_person" && !inPerson) return false;
    if (filters.schedule === "remote" && !remote) return false;
    if (filters.schedule === "today" && !isTodayMs(nextMs, nowMs)) return false;
    if (filters.schedule === "this_week" && !isThisWeekMs(nextMs, nowMs)) return false;

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
};

export function LessonFilters({ lessons, filters, onChange, searchSlot }: Props) {
  const options = useMemo(() => extractFilterOptions(lessons), [lessons]);

  const availableChips = useMemo(() => {
    const chips = SCHEDULE_CHIPS.filter((chip) => {
      if (chip.id === "all") return true;
      const probe = { ...filters, schedule: chip.id };
      return applyLessonQuickFilters(lessons, probe).length > 0;
    });
    return chips;
  }, [lessons, filters]);

  const sheikhOptions = options.sheikhs;
  const categoryOptions = options.categories;

  return (
    <div className="lesson-filters">
      {searchSlot ? <div className="lesson-filters__search">{searchSlot}</div> : null}
      <div className="lesson-filters__chips filter-chips" role="toolbar" aria-label="تصفية سريعة">
        {availableChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={`filter-chips__chip${filters.schedule === chip.id ? " filter-chips__chip--active" : ""}`}
            aria-pressed={filters.schedule === chip.id}
            onClick={() => onChange({ ...filters, schedule: chip.id })}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className="lesson-filters__selects">
        <label className="lesson-filters__select">
          <span>حسب الشيخ</span>
          <select
            value={filters.sheikh}
            onChange={(e) => onChange({ ...filters, sheikh: e.target.value })}
          >
            {sheikhOptions.map((v) => (
              <option key={v} value={v}>
                {v === "كل المشايخ" ? v : formatSheikhName(v) || v}
              </option>
            ))}
          </select>
        </label>
        <label className="lesson-filters__select">
          <span>حسب التصنيف</span>
          <select
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
          >
            {categoryOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
