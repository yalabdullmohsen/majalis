import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import {
  formatShortLessonTime,
  hasConfirmedLessonSchedule,
} from "@/lib/lesson-time";
import { cleanDisplayText } from "@/lib/display-text";
import { formatSheikhName } from "@/lib/sheikh-name";

export function lessonContentType(lesson: KuwaitLessonRecord): string {
  if (lesson.isCourse || lesson.activityType === "دورة") return "دورة";
  if (lesson.activityType?.includes("حلقة")) return "حلقة";
  return cleanDisplayText(lesson.activityType || "درس") || "درس";
}

export function lessonSheikhLabel(lesson: KuwaitLessonRecord): string {
  const raw = lesson.sheikhName || lesson.organizerName || "";
  return formatSheikhName(raw) || cleanDisplayText(raw) || "";
}

export function lessonPlaceLabel(lesson: KuwaitLessonRecord): string {
  return cleanDisplayText([lesson.mosque, lesson.region].filter(Boolean).join(" — "));
}

export function lessonTimeLabel(lesson: KuwaitLessonRecord): string {
  const scheduleConfirmed = hasConfirmedLessonSchedule(lesson.day || "", lesson.time || "");
  if (!scheduleConfirmed) return "الوقت قيد التأكيد";
  return (
    cleanDisplayText(lesson.time || formatShortLessonTime(lesson.time) || "") ||
    cleanDisplayText(lesson.day || "") ||
    "—"
  );
}

export function lessonDateLabel(lesson: KuwaitLessonRecord): string {
  return cleanDisplayText(lesson.gregorianDate || lesson.day || "");
}

export function lessonAttendanceLabel(lesson: KuwaitLessonRecord): string {
  if (lesson.hasLiveStream) return "عن بعد · بث";
  if (lesson.activityType?.includes("عن بعد")) return "عن بعد";
  if (lesson.mosque || lesson.region) return "حضوري";
  return "";
}

export type AttendanceFilter = "all" | "in_person" | "remote";

export function filterByAttendance(
  lessons: KuwaitLessonRecord[],
  attendance: AttendanceFilter,
): KuwaitLessonRecord[] {
  if (attendance === "all") return lessons;
  if (attendance === "remote") {
    return lessons.filter(
      (l) => l.hasLiveStream || (l.activityType || "").includes("عن بعد"),
    );
  }
  return lessons.filter(
    (l) => !l.hasLiveStream && !(l.activityType || "").includes("عن بعد"),
  );
}
