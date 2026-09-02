import type { FiqhLessonHit } from "@/lib/fiqh-books";
import { arabicIncludes } from "@/lib/arabic-search";
import {
  dedupeLessonHits,
  listPublishedLessonHits,
  listVisibleLessonHits,
  normalizeFiqhText,
  sortLessonsByCompleteness,
} from "@/lib/fiqh/fiqhNormalize";
import { filterLessonsByDoor, type FiqhDoorFilter } from "@/lib/fiqh/fiqhFilters";

const FIQH_QUERY_ALIASES: Record<string, string[]> = {
  الصلاة: ["صلاة", "الصلوات", "salah"],
  الوضوء: ["وضوء", "طهارة", "tahara", "taharah"],
  الصيام: ["صيام", "رمضان", "sawm"],
  الزكاة: ["زكاة", "zakat"],
  الحج: ["حج", "عمرة", "hajj"],
  البيع: ["بيع", "بيوع", "buyu", "معاملات"],
  النكاح: ["نكاح", "زواج", "nikah", "أسرة"],
};

function expandFiqhQuery(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const normalized = normalizeFiqhText(trimmed);
  const terms = new Set<string>([trimmed, normalized]);
  for (const [key, aliases] of Object.entries(FIQH_QUERY_ALIASES)) {
    const nk = normalizeFiqhText(key);
    if (normalized.includes(nk) || nk.includes(normalized)) {
      terms.add(key);
      for (const alias of aliases) terms.add(alias);
    }
    for (const alias of aliases) {
      const na = normalizeFiqhText(alias);
      if (normalized.includes(na) || na.includes(normalized)) {
        terms.add(key);
        for (const a of aliases) terms.add(a);
      }
    }
  }
  return [...terms];
}

function lessonSearchFields(hit: FiqhLessonHit): string[] {
  const sourceText = (hit.lesson.sources ?? [])
    .map((s) => `${s.book} ${s.author} ${s.ref}`)
    .join(" ");
  return [
    hit.lesson.title,
    hit.lesson.summary,
    hit.lesson.evidence,
    hit.lesson.preferred,
    hit.lesson.madhhabNotes ?? "",
    hit.chapter.title,
    hit.book.title,
    sourceText,
  ];
}

function matchesFiqhQuery(hit: FiqhLessonHit, query: string): boolean {
  const terms = expandFiqhQuery(query);
  if (terms.length === 0) return true;
  const fields = lessonSearchFields(hit);
  return terms.some((term) => fields.some((field) => arabicIncludes(field, term)));
}

export type FiqhSearchOptions = {
  door?: FiqhDoorFilter;
  includeUnpublished?: boolean;
  limit?: number;
};

export function searchFiqhIssues(
  query: string,
  options: FiqhSearchOptions = {},
): FiqhLessonHit[] {
  const { door = "all", includeUnpublished = false, limit } = options;
  const corpus = includeUnpublished ? listVisibleLessonHits() : listPublishedLessonHits();
  const filtered = filterLessonsByDoor(corpus, door);
  const q = query.trim();
  const matched = q
    ? dedupeLessonHits(filtered.filter((hit) => matchesFiqhQuery(hit, q)))
    : sortLessonsByCompleteness(dedupeLessonHits(filtered));
  return typeof limit === "number" ? matched.slice(0, limit) : matched;
}

/** للفحص الآلي — هل الاستعلام يعيد نتائج منطقية؟ */
export function probeFiqhSearch(query: string): FiqhLessonHit[] {
  return searchFiqhIssues(query, { limit: 5 });
}
