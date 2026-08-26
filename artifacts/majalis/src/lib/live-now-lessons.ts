/**
 * دروس «جارٍ الآن» — للشارة الحية على الرئيسية.
 */
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import {
  getFeaturedHomeStatusLabel,
  isLessonComplete,
} from "@/lib/kuwait-lessons";
import { isLessonInProgress } from "@/lib/lesson-time";

export type LiveNowLesson = KuwaitLessonRecord & { liveNow: boolean };

/** دروس نشطة الآن — «مستمر» في الجدول أو داخل نافذة «جارٍ الآن». */
export function filterLiveNowLessons(
  lessons: KuwaitLessonRecord[],
  nowMs = Date.now(),
): LiveNowLesson[] {
  const now = new Date(nowMs);
  return lessons
    .filter((lesson) => {
      if (getFeaturedHomeStatusLabel(lesson, nowMs) === "مستمر") return true;
      return (
        isLessonComplete(lesson) &&
        Boolean(lesson.day) &&
        isLessonInProgress(lesson.day, lesson.time, now)
      );
    })
    .map((lesson) => ({ ...lesson, liveNow: true }));
}

/** دروس ببث مباشر جارية الآن — أولوية الشارة LIVE. */
export function filterLiveStreamNowLessons(
  lessons: KuwaitLessonRecord[],
  nowMs = Date.now(),
): LiveNowLesson[] {
  return filterLiveNowLessons(lessons, nowMs).filter((l) => l.hasLiveStream);
}
