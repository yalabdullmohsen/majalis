import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import {
  normalizeLessonDay,
  normalizeLessonPlace,
  normalizeLessonSheikh,
  normalizeLessonTime,
  normalizeLessonTitle,
} from "./lessonNormalize";

/**
 * مفتاح التكرار الحقيقي:
 * - جلسات الكويت (`kw-…`) تُميَّز بمعرّفها حتى لا تُطمس جلسات الدورة الواحدة.
 * - غير ذلك: عنوان + شيخ + تاريخ + مكان + وقت.
 * المصدر (seed/supabase) لجودة الإبقاء عند التعارض فقط — لا يُدخل في المفتاح
 * حتى لا يتضاعف نفس الدرس من مصدرين.
 */
export function buildLessonDedupeKey(lesson: KuwaitLessonRecord): string {
  const stableId = String(lesson.id || "").trim();
  if (stableId.startsWith("kw-")) return `id:${stableId}`;

  const title = normalizeLessonTitle(lesson.title);
  const sheikh = normalizeLessonSheikh(lesson.sheikhName);
  const date = normalizeLessonDay(lesson.gregorianDate || lesson.day || "");
  const place = normalizeLessonPlace(lesson);
  const time = normalizeLessonTime(lesson.time || "");
  return [title, sheikh, date, place, time].join("|");
}

function lessonQualityScore(lesson: KuwaitLessonRecord): number {
  let score = lesson.completeness ?? 0;
  if (lesson.source === "supabase") score += 0.01;
  if (lesson.description?.trim()) score += 0.005;
  if (lesson.mapsUrl) score += 0.002;
  if (lesson.time?.trim()) score += 0.001;
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
