import LessonDetailPage from "@/views/LessonDetailPage";
import { Empty } from "@/components/ui-common";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

export default function LessonDetailClient({
  lesson,
}: {
  lesson: KuwaitLessonRecord | null;
}) {
  if (!lesson) {
    return <Empty text="لم يُعثر على الدرس." />;
  }

  return <LessonDetailPage params={{ id: lesson.id }} initialLesson={lesson} />;
}
