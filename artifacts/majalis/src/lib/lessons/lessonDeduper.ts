import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import {
  normalizeLessonDay,
  normalizeLessonPlace,
  normalizeLessonSheikh,
  normalizeLessonSource,
  normalizeLessonTime,
  normalizeLessonTitle,
} from "./lessonNormalize";

/** مفتاح التكرار: عنوان + شيخ + يوم + وقت + مكان + مصدر */
export function buildLessonDedupeKey(lesson: KuwaitLessonRecord): string {
  const title = normalizeLessonTitle(lesson.title);
  const sheikh = normalizeLessonSheikh(lesson.sheikhName);
  const day = normalizeLessonDay(lesson.day || lesson.gregorianDate || "");
  const time = normalizeLessonTime(lesson.time || "");
  const place = normalizeLessonPlace(lesson);
  const source = normalizeLessonSource(lesson.source);
  return [title, sheikh, day, time, place, source].join("|");
}

function lessonQualityScore(lesson: KuwaitLessonRecord): number {
  let score = lesson.completeness ?? 0;
  if (lesson.source === "supabase") score += 0.01;
  if (lesson.description?.trim()) score += 0.005;
  if (lesson.mapsUrl) score += 0.002;
  return score;
}

/** إزالة التكرارات الحقيقية فقط — الإبقاء على السجل الأكمل */
export function dedupeLessons(lessons: KuwaitLessonRecord[]): KuwaitLessonRecord[] {
  const best = new Map<string, KuwaitLessonRecord>();
  for (const lesson of lessons) {
    const key = buildLessonDedupeKey(lesson);
    const existing = best.get(key);
    if (!existing) {
      best.set(key, lesson);
      continue;
    }
    if (lessonQualityScore(lesson) > lessonQualityScore(existing)) {
      best.set(key, lesson);
    }
  }
  return Array.from(best.values());
}

export type DuplicateCluster = {
  key: string;
  lessons: KuwaitLessonRecord[];
};

/** مجموعات التكرار الفعلي (للتدقيق) */
export function findDuplicateClusters(lessons: KuwaitLessonRecord[]): DuplicateCluster[] {
  const buckets = new Map<string, KuwaitLessonRecord[]>();
  for (const lesson of lessons) {
    const key = buildLessonDedupeKey(lesson);
    const list = buckets.get(key) || [];
    list.push(lesson);
    buckets.set(key, list);
  }
  return Array.from(buckets.entries())
    .filter(([, list]) => list.length > 1)
    .map(([key, clusterLessons]) => ({ key, lessons: clusterLessons }));
}
