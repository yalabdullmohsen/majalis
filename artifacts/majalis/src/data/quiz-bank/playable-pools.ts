/**
 * بناء برك لعب من الأسئلة المنشورة فقط (محلي).
 * يُمرَّر إلى mergeSupabaseQuestions كقاعدة بدل ALL_QUESTIONS الخام.
 */
import type { CategoryQuestions, QuizQuestion } from "../islamicQuizData";
import { QUIZ_CATEGORY_DEFS } from "./categories";
import { getPublishedQuizQuestions } from "./index";
import { mapTypeToLegacyKind } from "./types";

export function buildPublishedLocalPools(): Record<string, CategoryQuestions> {
  const merged: Record<string, CategoryQuestions> = {};
  for (const cat of QUIZ_CATEGORY_DEFS) {
    merged[cat.id] = { 200: [], 400: [], 600: [] };
  }
  for (const q of getPublishedQuizQuestions()) {
    const pts = q.pointValue ?? 200;
    if (!merged[q.categoryId]) {
      merged[q.categoryId] = { 200: [], 400: [], 600: [] };
    }
    const legacy: QuizQuestion = {
      id: q.id,
      q: q.questionText,
      a: q.explanation,
      hint: q.hint ?? "",
      kind: mapTypeToLegacyKind(q.type),
      choices: q.choices,
      correctIndex: q.correctIndex,
      items: q.items,
      pairs: q.pairs,
      source: q.sourceReference ?? q.sourceTitle,
    };
    merged[q.categoryId][pts].push(legacy);
  }
  return merged;
}
