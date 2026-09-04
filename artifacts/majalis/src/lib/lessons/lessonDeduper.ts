import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import {
  normalizeLessonDay,
  normalizeLessonPlace,
  normalizeLessonSheikh,
  normalizeLessonTitle,
} from "./lessonNormalize";

/**
 * مفتاح التكرار الثابت للمنتج:
 * عنوان + شيخ + تاريخ + مكان
 * (الوقت لا يدخل المفتاح حتى لا تتضاعف نفس الجلسة بصيغ وقت مختلفة)
 */
export function buildLessonDedupeKey(lesson: KuwaitLessonRecord): string {
  const title = normalizeLessonTitle(lesson.title);
  const sheikh = normalizeLessonSheikh(lesson.sheikhName);
  const date = normalizeLessonDay(lesson.gregorianDate || lesson.day || "");
  const place = normalizeLessonPlace(lesson);
  return [title, sheikh, date, place].join("|");
}

function lessonQualityScore(lesson: KuwaitLessonRecord): number {
  let score = lesson.completeness ?? 0;
  if (lesson.source === "supabase") score += 0.01;
  if (lesson.description?.trim()) score += 0.005;
  if (lesson.mapsUrl) score += 0.002;
  if (lesson.time?.trim()) score += 0.001;
  // تفضيل معرّف kw المستقر عند التساوي
  if (String(lesson.id || "").startsWith("kw-")) score += 0.0005;
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
