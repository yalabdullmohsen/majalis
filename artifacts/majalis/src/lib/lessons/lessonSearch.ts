import { arabicIncludes } from "@/lib/arabic-search";
import { expandSearchTerms } from "@/lib/search-synonyms";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { normalizeLessonText } from "./lessonNormalize";

function lessonSearchHaystack(lesson: KuwaitLessonRecord): string {
  return [
    lesson.title,
    lesson.sheikhName,
    lesson.organizerName,
    lesson.mosque,
    lesson.region,
    lesson.governorate,
    lesson.category,
    lesson.activityType,
    lesson.note,
    lesson.description,
    lesson.source,
    ...(lesson.keywords || []),
    ...(lesson.linkedLessons || []),
  ]
    .filter(Boolean)
    .join(" ");
}

export function lessonMatchesSearch(lesson: KuwaitLessonRecord, query: string): boolean {
  const q = normalizeLessonText(query);
  if (!q) return true;

  const haystack = lessonSearchHaystack(lesson);
  const terms = expandSearchTerms(q);
  return terms.some((term) => arabicIncludes(haystack, term));
}

export function searchLessons(lessons: KuwaitLessonRecord[], query: string): KuwaitLessonRecord[] {
  const q = query.trim();
  if (!q) return lessons;
  return lessons.filter((lesson) => lessonMatchesSearch(lesson, q));
}

export function scoreLessonSearchMatch(lesson: KuwaitLessonRecord, query: string): number {
  const q = normalizeLessonText(query);
  if (!q) return 0;

  let score = 0;
  const terms = expandSearchTerms(q);
  for (const term of terms) {
    if (arabicIncludes(lesson.title, term)) score += 100;
    if (arabicIncludes(lesson.sheikhName, term)) score += 70;
    if (arabicIncludes(lesson.mosque, term)) score += 55;
    if (arabicIncludes(lesson.category, term)) score += 40;
    if (arabicIncludes(lesson.source || "", term)) score += 20;
    if (lesson.keywords?.some((k) => arabicIncludes(k, term))) score += 25;
  }
  if (score === 0 && lessonMatchesSearch(lesson, q)) score = 10;
  return score;
}
