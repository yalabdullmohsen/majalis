import type { SinJeemQuestion } from "@/lib/sin-jeem/types";
import type { QuestionBankItem, Difficulty } from "./types";
import { getAnsweredIds, getWeakCategorySlugs, getMasteryLevel } from "./user-progress";
import { resolveMainCategory } from "./categories";

const DIFFICULTY_ORDER: Difficulty[] = ["مبتدئ", "سهل", "متوسط", "متقدم", "خبير"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextDifficulty(current: Difficulty, mastery: number): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(current);
  if (mastery >= 80 && idx < DIFFICULTY_ORDER.length - 1) return DIFFICULTY_ORDER[idx + 1];
  if (mastery < 40 && idx > 0) return DIFFICULTY_ORDER[idx - 1];
  return current;
}

export type PickOptions = {
  count: number;
  categorySlugs?: string[];
  difficulty?: Difficulty;
  userId?: string;
  excludeIds?: Set<string>;
};

/** Smart picker — no repeat until category exhausted; adaptive difficulty; weak-topic boost */
export function pickQuestionsV2(pool: SinJeemQuestion[], opts: PickOptions): SinJeemQuestion[] {
  const { count, categorySlugs = [], difficulty = "متوسط" } = opts;
  const answered = getAnsweredIds();
  const weakCats = new Set(getWeakCategorySlugs());

  let candidates = pool.filter((q) => {
    if (opts.excludeIds?.has(q.id)) return false;
    if (categorySlugs.length && !categorySlugs.includes(q.category_slug || "")) return false;
    const main = resolveMainCategory(q.category_slug);
    if (categorySlugs.length && !categorySlugs.includes(q.category_slug || "") && !categorySlugs.includes(main)) {
      return false;
    }
    return true;
  });

  const targetDiff = categorySlugs[0]
    ? nextDifficulty(difficulty, getMasteryLevel(resolveMainCategory(categorySlugs[0])))
    : difficulty;

  const byDiff = candidates.filter((q) => q.difficulty === targetDiff);
  if (byDiff.length >= count) candidates = byDiff;

  const unseen = candidates.filter((q) => !answered.has(q.id));
  const weakUnseen = unseen.filter((q) => weakCats.has(resolveMainCategory(q.category_slug)));
  const primary = weakUnseen.length >= count ? weakUnseen : unseen.length ? unseen : candidates;

  const picked: SinJeemQuestion[] = [];
  const usedText = new Set<string>();

  for (const q of shuffle(primary)) {
    if (picked.length >= count) break;
    const key = q.question.trim();
    if (usedText.has(key)) continue;
    usedText.add(key);
    picked.push(q);
  }

  if (picked.length < count) {
    for (const q of shuffle(candidates)) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.id === q.id)) continue;
      picked.push(q);
    }
  }

  return picked.slice(0, count);
}

export function toSinJeemQuestion(item: QuestionBankItem): SinJeemQuestion {
  return {
    id: item.id,
    category_slug: item.category_slug,
    subcategory_slug: item.subcategory_slug,
    question_type: (item.question_type as SinJeemQuestion["question_type"]) || "multiple_choice",
    question: item.question,
    options: [...item.options],
    correct_index: item.correct_index,
    explanation: item.explanation,
    difficulty: item.difficulty,
    source: item.source,
    keywords: item.keywords,
    review_status: item.status === "published" ? "approved" : "pending",
  };
}
