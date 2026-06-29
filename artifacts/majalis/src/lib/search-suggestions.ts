import { arabicMatchAny } from "@/lib/arabic-search";
import { ADHKAR_CATEGORIES, getAllAdhkarItems } from "@/lib/adhkar-seed";
import { LESSONS_SEED } from "@/lib/lessons-seed";
import { SEED_FAWAID } from "@/lib/fawaid-seed";
import { SEED_QA } from "@/lib/qa-seed";
import { RESEARCH_SEED_PAPERS } from "@/lib/scientific-research/seed";
import { RESEARCH_BASE_PATH } from "@/lib/scientific-research/constants";

export type SearchSuggestion = {
  id: string;
  label: string;
  meta?: string;
  href: string;
  group: "lessons" | "fawaid" | "qa" | "adhkar" | "research";
};

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
    if (results.filter((r) => r.group === "adhkar").length >= MAX_PER_GROUP) break;
  }

  for (const paper of RESEARCH_SEED_PAPERS.filter((p) => p.status === "published")) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([paper.title, paper.author_name, paper.university, paper.specialization, ...(paper.keywords || [])], q)) continue;
    pushUnique(results, seen, {
      id: paper.id,
      label: paper.title,
      meta: paper.author_name ?? undefined,
      href: `${RESEARCH_BASE_PATH}/${paper.slug}`,
      group: "research",
    });
    if (results.filter((r) => r.group === "research").length >= MAX_PER_GROUP) break;
  }

  return results.slice(0, limit);
}

export const SUGGESTION_GROUP_LABELS: Record<SearchSuggestion["group"], string> = {
  lessons: "دروس",
  fawaid: "فوائد",
  qa: "أسئلة",
  adhkar: "أذكار",
  research: "الأبحاث العلمية",
};
