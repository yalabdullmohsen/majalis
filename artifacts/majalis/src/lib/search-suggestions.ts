import { arabicMatchAny } from "@/lib/arabic-search";

/**
 * فهرس اقتراحات البحث — يُحمَّل كسولًا.
 *
 * ⚠️ لا تُعِد أي استيراد ساكن لملفات البذور هنا: هذه الوحدة مربوطة بـ NavBar
 *    الظاهر في كل صفحة، فأي استيراد ساكن يعني أن كل زائر ينزّل ~٩٦٠KB من
 *    البذور (adhkar + lessons + fawaid + qa + arbaeen + scholars) قبل أن يبحث.
 *    التحميل يتم عبر ensureSuggestionIndex() عند أول تفاعل مع مربّع البحث.
 */

export type SearchSuggestion = {
  id: string;
  label: string;
  meta?: string;
  href: string;
  group: "lessons" | "fawaid" | "qa" | "adhkar" | "nawawi" | "scholars";
};

type AdhkarModule = typeof import("@/lib/adhkar-seed");
type LessonsModule = typeof import("@/lib/lessons-seed");
type FawaidModule = typeof import("@/lib/fawaid-seed");
type QaModule = typeof import("@/lib/qa-seed");
type NawawiModule = typeof import("@/lib/arbaeen-nawawi-seed");
type ScholarsModule = typeof import("@/lib/scholars-data");

type SuggestionIndex = {
  ADHKAR_CATEGORIES: AdhkarModule["ADHKAR_CATEGORIES"];
  adhkarItems: ReturnType<AdhkarModule["getAllAdhkarItems"]>;
  LESSONS_SEED: LessonsModule["LESSONS_SEED"];
  SEED_FAWAID: FawaidModule["SEED_FAWAID"];
  SEED_QA: QaModule["SEED_QA"];
  ARBAEEN_NAWAWI: NawawiModule["ARBAEEN_NAWAWI"];
  SCHOLARS: ScholarsModule["SCHOLARS"];
};

let index: SuggestionIndex | null = null;
let pending: Promise<SuggestionIndex> | null = null;

/**
 * يحمّل فهرس الاقتراحات مرة واحدة. آمن للاستدعاء المتكرر (يعيد نفس الـpromise).
 * استدعِه عند التركيز/الكتابة في مربّع البحث — لا عند تحميل الصفحة.
 */
export function ensureSuggestionIndex(): Promise<SuggestionIndex> {
  if (index) return Promise.resolve(index);
  if (pending) return pending;

  const load = (async (): Promise<SuggestionIndex> => {
    const [adhkar, lessons, fawaid, qa, nawawi, scholars] = await Promise.all([
      import("@/lib/adhkar-seed"),
      import("@/lib/lessons-seed"),
      import("@/lib/fawaid-seed"),
      import("@/lib/qa-seed"),
      import("@/lib/arbaeen-nawawi-seed"),
      import("@/lib/scholars-data"),
    ]);

    const built: SuggestionIndex = {
      ADHKAR_CATEGORIES: adhkar.ADHKAR_CATEGORIES,
      adhkarItems: adhkar.getAllAdhkarItems(),
      LESSONS_SEED: lessons.LESSONS_SEED,
      SEED_FAWAID: fawaid.SEED_FAWAID,
      SEED_QA: qa.SEED_QA,
      ARBAEEN_NAWAWI: nawawi.ARBAEEN_NAWAWI,
      SCHOLARS: scholars.SCHOLARS,
    };
    index = built;
    return built;
  })();

  pending = load;

  load.catch(() => {
    // اسمح بإعادة المحاولة عند الفشل (شبكة متقطّعة / chunk لم يُحمَّل)
    if (pending === load) pending = null;
  });

  return load;
}

/** هل الفهرس جاهز في الذاكرة؟ (لعرض حالة تحميل بسيطة) */
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

/**
 * يبني الاقتراحات من الفهرس المحمَّل.
 * يعيد [] إن لم يُحمَّل الفهرس بعد — نادِ ensureSuggestionIndex() أولًا.
 */
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
    SCHOLARS,
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
      href: `/qa?q=${encodeURIComponent(q)}`,
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
      href: `/adhkar?cat=${encodeURIComponent(category?.slug || "morning")}`,
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

  for (const s of SCHOLARS) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([s.name, s.fullName, s.bio, ...s.specialty], q)) continue;
    pushUnique(results, seen, {
      id: s.id,
      label: s.name,
      meta: s.specialty.slice(0, 2).join(" · "),
      href: `/scholars/${s.id}`,
      group: "scholars",
    });
    if (results.filter((r) => r.group === "scholars").length >= MAX_PER_GROUP) break;
  }

  return results.slice(0, limit);
}

export const SUGGESTION_GROUP_LABELS: Record<SearchSuggestion["group"], string> = {
  lessons: "دروس",
  fawaid: "فوائد",
  qa: "أسئلة",
  adhkar: "أذكار",
  nawawi: "الأربعون النووية",
  scholars: "العلماء",
};
