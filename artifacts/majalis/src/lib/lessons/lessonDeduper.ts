import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import {
  normalizeLessonDay,
  normalizeLessonPlace,
  normalizeLessonSheikh,
  normalizeLessonTitle,
} from "./lessonNormalize";

/**
 * مفتاح التكرار الثابت للمنتج:
 * - دورة لها courseId → بطاقة واحدة لكل دورة
 * - وإلا: عنوان + شيخ + يوم/تاريخ
 * (الوقت والمكان لا يدخلان المفتاح — اختلاف صياغة الديوان/الوقت كان يضاعف نفس الجلسة)
 */
export function buildLessonDedupeKey(lesson: KuwaitLessonRecord): string {
  const courseId = String(lesson.courseId || "").trim();
  if (courseId) return `course:${courseId}`;

  const title = normalizeLessonTitle(lesson.title);
  const sheikh = normalizeLessonSheikh(lesson.sheikhName);
  const place = normalizeLessonPlace(lesson);

  // الدورات متعددة المجالس بلا courseId: طيّ بالعنوان+الشيخ+المكان
  if (lesson.isCourse || (lesson.sessionCount && lesson.sessionCount > 1)) {
    return ["course-title", title, sheikh, place].join("|");
  }

  const date = normalizeLessonDay(lesson.gregorianDate || lesson.day || "");
  return [title, sheikh, date].join("|");
}

function lessonQualityScore(lesson: KuwaitLessonRecord): number {
  let score = lesson.completeness ?? 0;
  if (lesson.source === "supabase") score += 0.01;
  if (lesson.description?.trim()) score += 0.005;
  if (lesson.mapsUrl) score += 0.002;
  if (lesson.time?.trim()) score += 0.001;
  if (lesson.sessionCount && lesson.sessionCount > 1) score += 0.0008;
  // تفضيل معرّف kw المستقر / الجلسة الأولى عند التساوي
  if (String(lesson.id || "").startsWith("kw-")) score += 0.0005;
  if (/-0$/.test(String(lesson.id || ""))) score += 0.0004;
  // كتالوج الإعلانات العلمية (sci-*) ثانوي أمام سجل الدرس الحي
  if (String(lesson.id || "").startsWith("sci-")) score -= 0.0006;
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
