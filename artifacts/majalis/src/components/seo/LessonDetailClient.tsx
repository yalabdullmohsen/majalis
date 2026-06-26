"use client";

import LessonDetailPage from "@/views/LessonDetailPage";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

export default function LessonDetailClient({
  lesson,
}: {
  lesson: KuwaitLessonRecord | null;
}) {
  if (!lesson) {
    return <LessonDetailPage params={{ id: "" }} />;
  }

  return <LessonDetailPage params={{ id: lesson.id }} initialLesson={lesson} />;
}
