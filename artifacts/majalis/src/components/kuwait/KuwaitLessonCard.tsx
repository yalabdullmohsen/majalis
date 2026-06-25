import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";

type Props = {
  lesson: KuwaitLessonRecord;
  compact?: boolean;
  archived?: boolean;
};

export function KuwaitLessonCard({ lesson, compact = false, archived = false }: Props) {
  const unified = fromKuwaitLesson(lesson, archived);
  return <UnifiedLessonCard lesson={unified} compact={compact} />;
}

export default KuwaitLessonCard;
