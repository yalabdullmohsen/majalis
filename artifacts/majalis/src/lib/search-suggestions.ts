import { arabicMatchAny } from "@/lib/arabic-search";
import { ADHKAR_CATEGORIES, getAllAdhkarItems } from "@/lib/adhkar-seed";
import { LESSONS_SEED } from "@/lib/lessons-seed";
import { SEED_FAWAID } from "@/lib/fawaid-seed";
import { SEED_QA } from "@/lib/qa-seed";
import { searchLibraryCatalog } from "@/lib/library-service";
import { searchMiraclesSeed } from "@/lib/miracles-seed";
import { ANNUAL_COURSES_SEED } from "@/lib/platform-content-service";
import { getQuranCircles } from "@/lib/quran-circles";
import { getAllMutoon } from "@/lib/mutoon";

export type SearchSuggestionGroup =
  | "lessons"
  | "quran_circles"
  | "mutoon"
  | "library"
  | "courses"
  | "miracles"
  | "fawaid"
  | "qa"
  | "adhkar";

export type SearchSuggestion = {
  id: string;
  label: string;
  meta?: string;
  href: string;
  group: SearchSuggestionGroup;
};

const MAX_PER_GROUP = 3;

function pushUnique(
  list: SearchSuggestion[],
  seen: Set<string>,
  item: SearchSuggestion,
) {
  const key = `${item.group}:${item.id}`;
  if (seen.has(key)) return;
  seen.add(key);
  list.push(item);
}

function countInGroup(list: SearchSuggestion[], group: SearchSuggestionGroup) {
  return list.filter((r) => r.group === group).length;
}

export function buildSearchSuggestions(query: string, limit = 16): SearchSuggestion[] {
  const q = query.trim();
  if (q.length < 2) return [];

  const results: SearchSuggestion[] = [];
  const seen = new Set<string>();

  for (const lesson of LESSONS_SEED) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([lesson.title, lesson.description, lesson.speaker_name, lesson.category, ...(lesson.keywords || [])], q)) continue;
    pushUnique(results, seen, {
      id: lesson.id,
      label: lesson.title,
      meta: lesson.speaker_name,
      href: `/lessons/${lesson.id}`,
      group: "lessons",
    });
    if (countInGroup(results, "lessons") >= MAX_PER_GROUP) break;
  }

  for (const circle of getQuranCircles()) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([circle.name, circle.sheikh_name, circle.city, circle.description, ...circle.categories], q)) continue;
    pushUnique(results, seen, {
      id: circle.id,
      label: circle.name,
      meta: circle.sheikh_name,
      href: `/quran-circles/${circle.id}`,
      group: "quran_circles",
    });
    if (countInGroup(results, "quran_circles") >= MAX_PER_GROUP) break;
  }

  for (const mutoon of getAllMutoon()) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([mutoon.name, mutoon.author, mutoon.category, mutoon.summary], q)) continue;
    pushUnique(results, seen, {
      id: mutoon.id,
      label: mutoon.name,
      meta: mutoon.author,
      href: `/mutoon/${mutoon.id}`,
      group: "mutoon",
    });
    if (countInGroup(results, "mutoon") >= MAX_PER_GROUP) break;
  }

  for (const book of searchLibraryCatalog(q).slice(0, MAX_PER_GROUP)) {
    if (results.length >= limit) break;
    pushUnique(results, seen, {
      id: book.id,
      label: book.title,
      meta: book.author,
      href: `/library?q=${encodeURIComponent(q)}`,
      group: "library",
    });
  }

  for (const course of ANNUAL_COURSES_SEED) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([course.title, course.summary, ...(course.sheikh_names || []), ...(course.keywords || [])], q)) continue;
    pushUnique(results, seen, {
      id: course.id,
      label: course.title,
      meta: course.venue_city,
      href: `/annual-courses/${course.id}`,
      group: "courses",
    });
    if (countInGroup(results, "courses") >= MAX_PER_GROUP) break;
  }

  for (const miracle of searchMiraclesSeed(q).slice(0, MAX_PER_GROUP)) {
    if (results.length >= limit) break;
    pushUnique(results, seen, {
      id: miracle.id,
      label: miracle.title,
      meta: miracle.category,
      href: `/miracles?q=${encodeURIComponent(q)}`,
      group: "miracles",
    });
  }

  for (const f of SEED_FAWAID) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([f.text, f.author_name, f.category], q)) continue;
    pushUnique(results, seen, {
      id: f.id,
      label: f.text.slice(0, 72) + (f.text.length > 72 ? "…" : ""),
      meta: f.author_name ?? undefined,
      href: `/fawaid?q=${encodeURIComponent(q)}`,
      group: "fawaid",
    });
    if (countInGroup(results, "fawaid") >= MAX_PER_GROUP) break;
  }

  for (const item of SEED_QA) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([item.question, item.answer, item.reference], q)) continue;
    pushUnique(results, seen, {
      id: item.id,
      label: item.question.slice(0, 72) + (item.question.length > 72 ? "…" : ""),
      meta: item.qa_categories?.name,
      href: `/qa?q=${encodeURIComponent(q)}`,
      group: "qa",
    });
    if (countInGroup(results, "qa") >= MAX_PER_GROUP) break;
  }

  for (const adhkar of getAllAdhkarItems()) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([adhkar.text, ...(adhkar.keywords || []), adhkar.source, adhkar.reference], q)) continue;
    const category = ADHKAR_CATEGORIES.find((c) => c.id === adhkar.categoryId);
    pushUnique(results, seen, {
      id: adhkar.id,
      label: adhkar.text.slice(0, 72) + (adhkar.text.length > 72 ? "…" : ""),
      meta: category?.name,
      href: `/adhkar?cat=${encodeURIComponent(category?.slug || "morning")}`,
      group: "adhkar",
    });
    if (countInGroup(results, "adhkar") >= MAX_PER_GROUP) break;
  }

  return results.slice(0, limit);
}

export const SUGGESTION_GROUP_LABELS: Record<SearchSuggestionGroup, string> = {
  lessons: "دروس",
  quran_circles: "حلقات القرآن",
  mutoon: "متون",
  library: "مكتبة",
  courses: "دورات",
  miracles: "إعجاز علمي",
  fawaid: "فوائد",
  qa: "أسئلة",
  adhkar: "أذكار",
};
