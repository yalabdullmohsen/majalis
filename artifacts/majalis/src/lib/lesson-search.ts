import { arabicIncludes } from "@/lib/arabic-search";
import { expandSearchTerms } from "@/lib/search-synonyms";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { stripSheikhPrefix } from "@/lib/sheikh-name";

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

  const terms = expandSearchTerms(q);

  for (const term of terms) {
    if (arabicIncludes(title, term)) score += title.length <= term.length + 4 ? 120 : 80;
    if (arabicIncludes(sheikh, term)) score += 70;
    if (arabicIncludes(lesson.mosque, term)) score += 55;
    if (arabicIncludes(lesson.region, term)) score += 45;
    if (arabicIncludes(lesson.governorate, term)) score += 40;
    if (arabicIncludes(lesson.category, term)) score += 35;
    if (lesson.keywords?.some((k) => arabicIncludes(k, term))) score += 30;
    if (arabicIncludes(lesson.description, term) || arabicIncludes(lesson.note, term)) score += 25;
    if (arabicIncludes(lesson.day, term) || arabicIncludes(lesson.time, term)) score += 15;
  }

  if (score === 0) {
    const haystack = searchFields(lesson).join(" ");
    for (const term of terms) {
      if (arabicIncludes(haystack, term)) {
        score += 10;
        break;
      }
    }
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
    stripSheikhPrefix(lesson.sheikhName),
    lesson.mosque,
    lesson.region,
    lesson.governorate,
    lesson.category,
  ]
    .filter(Boolean)
    .join(" · ");
}
