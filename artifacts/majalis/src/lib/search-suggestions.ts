import { arabicMatchAny } from "@/lib/arabic-search";
import { ADHKAR_CATEGORIES, getAllAdhkarItems } from "@/lib/adhkar-seed";
import { LESSONS_SEED } from "@/lib/lessons-seed";
import { SEED_FAWAID } from "@/lib/fawaid-seed";
import { SEED_QA } from "@/lib/qa-seed";
import { getSurahList } from "@/lib/quran-content";
import { searchSurahStories } from "@/lib/surah-stories";
import { LIBRARY_SEED } from "@/lib/library-seed";

export type SearchSuggestion = {
  id: string;
  label: string;
  meta?: string;
  href: string;
  group:
    | "lessons"
    | "fawaid"
    | "qa"
    | "adhkar"
    | "quran"
    | "surah-stories"
    | "library"
    | "miracles"
    | "sheikhs";
};

const MAX_PER_GROUP = 3;
const GROUP_LIMIT = 16;

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

function groupCount(list: SearchSuggestion[], group: SearchSuggestion["group"]) {
  return list.filter((r) => r.group === group).length;
}

export function buildSearchSuggestions(query: string, limit = GROUP_LIMIT): SearchSuggestion[] {
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
    if (groupCount(results, "lessons") >= MAX_PER_GROUP) break;
  }

  for (const surah of getSurahList()) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([surah.name, String(surah.number)], q)) continue;
    pushUnique(results, seen, {
      id: String(surah.number),
      label: `سورة ${surah.name}`,
      meta: `${surah.ayahs} آية`,
      href: `/quran/surah/${surah.number}`,
      group: "quran",
    });
    if (groupCount(results, "quran") >= MAX_PER_GROUP) break;
  }

  for (const story of searchSurahStories(q).slice(0, MAX_PER_GROUP)) {
    if (results.length >= limit) break;
    pushUnique(results, seen, {
      id: String(story.number),
      label: `قصة ${story.name}`,
      meta: story.mainThemes[0],
      href: `/quran/surah-stories/${story.number}`,
      group: "surah-stories",
    });
  }

  for (const book of LIBRARY_SEED) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([book.title, book.category, book.description, book.type], q)) continue;
    pushUnique(results, seen, {
      id: book.id,
      label: book.title,
      meta: book.category,
      href: `/library?q=${encodeURIComponent(book.title)}`,
      group: "library",
    });
    if (groupCount(results, "library") >= MAX_PER_GROUP) break;
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
    if (groupCount(results, "fawaid") >= MAX_PER_GROUP) break;
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
    if (groupCount(results, "qa") >= MAX_PER_GROUP) break;
  }

  const sheikhNames = new Set<string>();
  for (const lesson of LESSONS_SEED) {
    if (results.length >= limit) break;
    if (!lesson.speaker_name || !arabicMatchAny([lesson.speaker_name], q)) continue;
    const key = lesson.speaker_name;
    if (sheikhNames.has(key)) continue;
    sheikhNames.add(key);
    pushUnique(results, seen, {
      id: key,
      label: lesson.speaker_name,
      meta: "شيخ",
      href: `/lessons?q=${encodeURIComponent(lesson.speaker_name)}`,
      group: "sheikhs",
    });
    if (groupCount(results, "sheikhs") >= MAX_PER_GROUP) break;
  }

  if (arabicMatchAny(["إعجاز", "علمي", "miracle"], q)) {
    pushUnique(results, seen, {
      id: "miracles",
      label: "الإعجاز العلمي",
      meta: "قسم",
      href: "/miracles",
      group: "miracles",
    });
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
    if (groupCount(results, "adhkar") >= MAX_PER_GROUP) break;
  }

  return results.slice(0, limit);
}

export const SUGGESTION_GROUP_LABELS: Record<SearchSuggestion["group"], string> = {
  lessons: "دروس",
  quran: "قرآن",
  "surah-stories": "قصص السور",
  library: "مكتبة",
  fawaid: "فوائد",
  qa: "أسئلة",
  sheikhs: "مشايخ",
  miracles: "إعجاز علمي",
  adhkar: "أذكار",
};
