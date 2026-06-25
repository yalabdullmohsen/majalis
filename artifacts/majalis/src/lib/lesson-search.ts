import { arabicIncludes } from "@/lib/arabic-search";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

function searchFields(lesson: KuwaitLessonRecord): string[] {
  return [
    lesson.title,
    lesson.sheikhName,
    lesson.mosque,
    lesson.region,
    lesson.governorate,
    lesson.day,
    lesson.time,
    lesson.category,
    lesson.activityType,
    lesson.note,
    lesson.description,
    ...(lesson.keywords || []),
    ...(lesson.linkedLessons || []),
  ].filter(Boolean) as string[];
}

/** درجة الصلة — أعلى = أقرب للاستعلام. */
export function scoreLessonSearch(lesson: KuwaitLessonRecord, query: string): number {
  const q = query.trim();
  if (!q) return 0;

  let score = 0;
  const title = lesson.title || "";
  const sheikh = lesson.sheikhName || "";

  if (arabicIncludes(title, q)) score += title.length <= q.length + 4 ? 120 : 80;
  if (arabicIncludes(sheikh, q)) score += 70;
  if (arabicIncludes(lesson.mosque, q)) score += 55;
  if (arabicIncludes(lesson.region, q)) score += 45;
  if (arabicIncludes(lesson.governorate, q)) score += 40;
  if (arabicIncludes(lesson.category, q)) score += 35;
  if (lesson.keywords?.some((k) => arabicIncludes(k, q))) score += 30;
  if (arabicIncludes(lesson.description, q) || arabicIncludes(lesson.note, q)) score += 25;
  if (arabicIncludes(lesson.day, q) || arabicIncludes(lesson.time, q)) score += 15;

  if (score === 0) {
    const haystack = searchFields(lesson).join(" ");
    if (arabicIncludes(haystack, q)) score += 10;
  }

  if (score > 0 && !lesson.archivedAt) score += 5;
  return score;
}

export function rankLessonsBySearch(
  lessons: KuwaitLessonRecord[],
  query: string,
  limit = 24,
): KuwaitLessonRecord[] {
  const q = query.trim();
  if (!q) return [];

  return lessons
    .map((lesson) => ({ lesson, score: scoreLessonSearch(lesson, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.lesson.nextOccurrenceMs - b.lesson.nextOccurrenceMs)
    .slice(0, limit)
    .map((entry) => entry.lesson);
}

export function buildLessonSearchMeta(lesson: KuwaitLessonRecord): string {
  return [
    lesson.sheikhName.replace(/^الشيخ:\s*/u, ""),
    lesson.mosque,
    lesson.region,
    lesson.governorate,
    lesson.category,
  ]
    .filter(Boolean)
    .join(" · ");
}
