import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import type { LessonScheduleEntry } from "@/lib/lessons/lessonGrouping";
import { LessonCard } from "./LessonCard";
import { LessonCourseCard } from "./LessonCourseCard";

type Props = {
  entries: LessonScheduleEntry[];
  archived?: boolean;
  emptyText?: string;
};

export function LessonScheduleGroup({
  entries,
  archived = false,
  emptyText = "لا توجد دروس مطابقة.",
}: Props) {
  if (entries.length === 0) {
    return <p className="lessons-empty-state">{emptyText}</p>;
  }

  return (
    <div className="lesson-schedule-group">
      {entries.map((entry) =>
        entry.kind === "course" ? (
          <LessonCourseCard key={entry.course.id} course={entry.course} />
        ) : (
          <LessonCard key={entry.lesson.id} lesson={entry.lesson as KuwaitLessonRecord} archived={archived} />
        ),
      )}
    </div>
  );
}
