import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import type { LessonScheduleEntry } from "@/lib/lessons/lessonGrouping";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { UnifiedLessonCard } from "./UnifiedLessonCard";

type Props = {
  entries: LessonScheduleEntry[];
  archived?: boolean;
  emptyText?: string;
};

/** قائمة موحّدة — بطاقة واحدة فقط لكل درس/جلسة (بلا LessonCard القديم). */
export function LessonScheduleGroup({
  entries,
  archived = false,
  emptyText = "لا توجد دروس مطابقة.",
}: Props) {
  if (entries.length === 0) {
    return <p className="lessons-empty-state">{emptyText}</p>;
  }

  const lessons: KuwaitLessonRecord[] = entries.flatMap((entry) => {
    if (entry.kind === "course") return entry.course.sessions;
    return [entry.lesson as KuwaitLessonRecord];
  });

  // الأقرب زمنياً أولاً
  const sorted = [...lessons].sort(
    (a, b) => (a.nextOccurrenceMs ?? Number.MAX_SAFE_INTEGER) - (b.nextOccurrenceMs ?? Number.MAX_SAFE_INTEGER),
  );

  return (
    <div className="page-card-grid lesson-unified-grid lesson-schedule-group">
      {sorted.map((lesson) => (
        <UnifiedLessonCard
          key={lesson.id}
          lesson={fromKuwaitLesson(lesson, archived)}
          compact
        />
      ))}
    </div>
  );
}
