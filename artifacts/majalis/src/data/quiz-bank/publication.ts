/**
 * طبقة النشر — عدد الأسئلة والحساب من الحالة فقط.
 * لا أرقام يدوية · لا ظهور لغير PUBLISHED.
 */
import { QUIZ_LEAF_CATEGORIES } from "./categories";
import {
  canPublishQuestion,
  isPubliclyVisible,
  type QuizBankQuestion,
  type QuizCategory,
} from "./types";

export type CategoryWithCount = QuizCategory & {
  questionCount: number;
};

export function countPublishedByCategory(
  questions: readonly QuizBankQuestion[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const q of questions) {
    if (!isPubliclyVisible(q)) continue;
    counts[q.categoryId] = (counts[q.categoryId] ?? 0) + 1;
  }
  return counts;
}

/** فئات الإنتاج: enabled + لديها ≥1 سؤال منشور */
export function listPlayableCategories(
  questions: readonly QuizBankQuestion[],
  minPublished = 1,
): CategoryWithCount[] {
  const counts = countPublishedByCategory(questions);
  return QUIZ_LEAF_CATEGORIES.filter((c) => c.enabled)
    .map((c) => ({
      ...c,
      questionCount: counts[c.id] ?? 0,
    }))
    .filter((c) => c.questionCount >= minPublished)
    .sort((a, b) => a.order - b.order);
}

export function listPublishedQuestions(
  questions: readonly QuizBankQuestion[],
  categoryIds?: readonly string[],
): QuizBankQuestion[] {
  const set = categoryIds ? new Set(categoryIds) : null;
  return questions.filter((q) => {
    if (!isPubliclyVisible(q)) return false;
    if (set && !set.has(q.categoryId)) return false;
    return true;
  });
}

/** بوابة: أي سؤال معلَّم PUBLISHED يجب أن يمر canPublishQuestion */
export function assertPublishedInvariant(
  questions: readonly QuizBankQuestion[],
): void {
  for (const q of questions) {
    if (q.publicationStatus !== "PUBLISHED") continue;
    const gate = canPublishQuestion(q);
    if (!gate.ok) {
      throw new Error(
        `quiz-bank: PUBLISHED بدون أهلية (${q.id}): ${gate.reason}`,
      );
    }
  }
}

export function assertNoUlamaCategory(categories: readonly QuizCategory[]): void {
  for (const c of categories) {
    if (c.id === "ulama" || /علماء/.test(c.title)) {
      throw new Error(`quiz-bank: فئة أشخاص محظورة: ${c.id}`);
    }
  }
}
