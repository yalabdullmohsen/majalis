import { cleanDisplayText } from "./display-text";
import { extractLessonSchedule } from "./lesson-display";
import type { KuwaitLessonRecord } from "./kuwait-lessons";

export type UnifiedLesson = {
  id: string;
  title: string;
  sheikhName: string;
  sheikhImage?: string;
  category: string;
  day: string;
  time: string;
  mosque: string;
  region: string;
  governorate: string;
  sortKey: number;
  statusLabel: string;
  detailsHref: string;
  note?: string;
  archived?: boolean;
};

const PROXIMITY_LABELS: Record<number, string> = {
  0: "اليوم",
  1: "غداً",
};

function proximityLabel(sortKey: number, day: string): string {
  if (PROXIMITY_LABELS[sortKey]) return PROXIMITY_LABELS[sortKey];
  if (sortKey >= 2 && sortKey <= 6) return `بعد ${sortKey} أيام`;
  if (day) return day;
  return "نشط";
}

export function fromKuwaitLesson(lesson: KuwaitLessonRecord, archived = false): UnifiedLesson {
  return {
    id: lesson.id,
    title: cleanDisplayText(lesson.title),
    sheikhName: cleanDisplayText(lesson.sheikhName),
    sheikhImage: lesson.sheikhImage,
    category: cleanDisplayText(lesson.category) || "أخرى",
    day: cleanDisplayText(lesson.day),
    time: cleanDisplayText(lesson.time),
    mosque: cleanDisplayText(lesson.mosque),
    region: cleanDisplayText(lesson.region),
    governorate: cleanDisplayText(lesson.governorate),
    sortKey: lesson.sortKey,
    statusLabel: archived ? "منتهٍ" : proximityLabel(lesson.sortKey, lesson.day),
    detailsHref: `/lessons/${lesson.id}`,
    note: lesson.note ? cleanDisplayText(lesson.note) : undefined,
    archived,
  };
}

export function fromDbLesson(lesson: {
  id: string;
  title: string;
  category?: string;
  mosque?: string;
  city?: string;
  region?: string;
  description?: string;
  schedule?: string;
  day_of_week?: string;
  lesson_time?: string;
  speaker_name?: string;
  sheikhs?: { name?: string };
  sortKey?: number;
}): UnifiedLesson {
  const sheikhName = lesson.sheikhs?.name || lesson.speaker_name || "";
  const { day, time } = extractLessonSchedule(lesson);
  const sortKey = lesson.sortKey ?? 99;

  return {
    id: lesson.id,
    title: cleanDisplayText(lesson.title),
    sheikhName: cleanDisplayText(sheikhName),
    category: cleanDisplayText(lesson.category) || "أخرى",
    day: cleanDisplayText(day),
    time: cleanDisplayText(time),
    mosque: cleanDisplayText(lesson.mosque),
    region: cleanDisplayText(lesson.region),
    governorate: cleanDisplayText(lesson.city),
    sortKey,
    statusLabel: proximityLabel(sortKey, day),
    detailsHref: `/lessons/${lesson.id}`,
    note: lesson.description ? cleanDisplayText(lesson.description) : undefined,
  };
}

export function buildLessonCopyText(lesson: UnifiedLesson): string {
  const lines = [
    lesson.title,
    lesson.sheikhName,
    `التصنيف: ${lesson.category}`,
    lesson.day ? `اليوم: ${lesson.day}` : "",
    lesson.time ? `الوقت: ${lesson.time}` : "",
    lesson.mosque ? `المسجد: ${lesson.mosque}` : "",
    lesson.region ? `المنطقة: ${lesson.region}` : "",
    lesson.governorate ? `المحافظة: ${lesson.governorate}` : "",
    `الحالة: ${lesson.statusLabel}`,
  ].filter(Boolean);

  if (lesson.note) lines.push(lesson.note);
  lines.push("", "المجلس العلمي");
  return lines.join("\n");
}

export function prominenceClass(sortKey: number, archived?: boolean): string {
  if (archived) return "lesson-unified-card--archived";
  if (sortKey === 0) return "lesson-unified-card--today";
  if (sortKey === 1) return "lesson-unified-card--soon";
  return "";
}
