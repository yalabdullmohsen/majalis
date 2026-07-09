import LessonsPage from "@/views/LessonsPage";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

export default function LessonsPageClient({
  initialActive,
  initialArchived,
}: {
  initialActive: KuwaitLessonRecord[];
  initialArchived: KuwaitLessonRecord[];
}) {
  return (
    <LessonsPage
      initialActive={initialActive}
      initialArchived={initialArchived}
    />
  );
}
