import { arabicMatchAny } from "@/lib/arabic-search";
import {
  HISTORY_CATEGORIES,
  ISLAMIC_HISTORY_ITEMS,
  type IslamicHistoryItem,
} from "@/data/islamic-history";

/**
 * فهرس اقتراحات البحث — يُحمَّل كسولًا.
 */

export type SearchSuggestion = {
  id: string;
  label: string;
  meta?: string;
  href: string;
  group: "lessons" | "fawaid" | "qa" | "adhkar" | "nawawi" | "history" | "prophets";
};

type AdhkarModule = typeof import("@/lib/adhkar-seed");
type LessonsModule = typeof import("@/lib/lessons-seed");
type FawaidModule = typeof import("@/lib/fawaid-seed");
type QaModule = typeof import("@/lib/qa-seed");
type NawawiModule = typeof import("@/lib/arbaeen-nawawi-seed");
type ProphetsModule = typeof import("@/lib/prophets-data");

type SuggestionIndex = {
  ADHKAR_CATEGORIES: AdhkarModule["ADHKAR_CATEGORIES"];
  adhkarItems: ReturnType<AdhkarModule["getAllAdhkarItems"]>;
  LESSONS_SEED: LessonsModule["LESSONS_SEED"];
  SEED_FAWAID: FawaidModule["SEED_FAWAID"];
  SEED_QA: QaModule["SEED_QA"];
  ARBAEEN_NAWAWI: NawawiModule["ARBAEEN_NAWAWI"];
  HISTORY_ITEMS: IslamicHistoryItem[];
  PROPHETS: ProphetsModule["PROPHETS"];
};

let index: SuggestionIndex | null = null;
let pending: Promise<SuggestionIndex> | null = null;

export function ensureSuggestionIndex(): Promise<SuggestionIndex> {
  if (index) return Promise.resolve(index);
  if (pending) return pending;

  const load = (async (): Promise<SuggestionIndex> => {
    const [adhkar, lessons, fawaid, qa, nawawi, prophets] = await Promise.all([
      import("@/lib/adhkar-seed"),
      import("@/lib/lessons-seed"),
      import("@/lib/fawaid-seed"),
      import("@/lib/qa-seed"),
      import("@/lib/arbaeen-nawawi-seed"),
      import("@/lib/prophets-data"),
    ]);

    const [LESSONS_SEED, SEED_QA] = await Promise.all([
      lessons.loadLessonsSeed(),
      qa.loadSeedQa(),
    ]);

    const built: SuggestionIndex = {
      ADHKAR_CATEGORIES: adhkar.ADHKAR_CATEGORIES,
      adhkarItems: adhkar.getAllAdhkarItems(),
      LESSONS_SEED,
      SEED_FAWAID: fawaid.SEED_FAWAID,
      SEED_QA,
      ARBAEEN_NAWAWI: nawawi.ARBAEEN_NAWAWI,
      HISTORY_ITEMS: ISLAMIC_HISTORY_ITEMS,
      PROPHETS: prophets.PROPHETS,
    };
    index = built;
    return built;
  })();

  pending = load;

  load.catch(() => {
    if (pending === load) pending = null;
  });

  return load;
}

export function isSuggestionIndexReady(): boolean {
  return index !== null;
}

const MAX_PER_GROUP = 4;

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

export function buildSearchSuggestions(query: string, limit = 12): SearchSuggestion[] {
  const q = query.trim();
  if (q.length < 2) return [];
  if (!index) return [];

  const {
    LESSONS_SEED,
    SEED_FAWAID,
    SEED_QA,
    adhkarItems,
    ADHKAR_CATEGORIES,
    ARBAEEN_NAWAWI,
    HISTORY_ITEMS,
    PROPHETS,
  } = index;

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
    if (results.filter((r) => r.group === "lessons").length >= MAX_PER_GROUP) break;
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
    if (results.filter((r) => r.group === "fawaid").length >= MAX_PER_GROUP) break;
  }

  for (const item of SEED_QA) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([item.question, item.answer, item.reference], q)) continue;
    pushUnique(results, seen, {
      id: item.id,
      label: item.question.slice(0, 72) + (item.question.length > 72 ? "…" : ""),
      meta: item.qa_categories?.name,
      href: `/quiz?q=${encodeURIComponent(q)}`,
      group: "qa",
    });
    if (results.filter((r) => r.group === "qa").length >= MAX_PER_GROUP) break;
  }

  for (const adhkar of adhkarItems) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([adhkar.text, ...(adhkar.keywords || []), adhkar.source, adhkar.reference], q)) continue;
    const category = ADHKAR_CATEGORIES.find((c) => c.id === adhkar.categoryId);
    pushUnique(results, seen, {
      id: adhkar.id,
      label: adhkar.text.slice(0, 72) + (adhkar.text.length > 72 ? "…" : ""),
      meta: category?.name,
      href: `/adhkar/${encodeURIComponent(category?.slug || "morning")}`,
      group: "adhkar",
    });
    if (results.filter((r) => r.group === "adhkar").length >= MAX_PER_GROUP) break;
  }

  for (const h of ARBAEEN_NAWAWI) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([h.title, h.text, h.explanation], q)) continue;
    pushUnique(results, seen, {
      id: String(h.id),
      label: h.title,
      meta: h.source,
      href: `/arbaeen-nawawi?h=${h.id}`,
      group: "nawawi",
    });
    if (results.filter((r) => r.group === "nawawi").length >= MAX_PER_GROUP) break;
  }

  for (const item of HISTORY_ITEMS) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([item.title, item.summary, item.detail, item.era, ...(item.relatedPersons ?? [])], q)) continue;
    pushUnique(results, seen, {
      id: item.id,
      label: item.title,
      meta: HISTORY_CATEGORIES[item.category],
      href: `/tarikh-islami/${item.id}`,
      group: "history",
    });
    if (results.filter((r) => r.group === "history").length >= MAX_PER_GROUP) break;
  }

  for (const p of PROPHETS) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([p.arabicName, p.title, p.briefBio, p.slug, ...(p.keyAttributes || [])], q)) continue;
    pushUnique(results, seen, {
      id: p.slug,
      label: p.arabicName,
      meta: p.title || "قصص الأنبياء",
      href: `/prophets/${p.slug}`,
      group: "prophets",
    });
    if (results.filter((r) => r.group === "prophets").length >= MAX_PER_GROUP) break;
  }

  return results.slice(0, limit);
}

export const SUGGESTION_GROUP_LABELS: Record<SearchSuggestion["group"], string> = {
  lessons: "دروس",
  fawaid: "فوائد",
  qa: "أسئلة",
  adhkar: "أذكار",
  nawawi: "الأربعون النووية",
  history: "التاريخ الإسلامي",
  prophets: "الأنبياء",
};
