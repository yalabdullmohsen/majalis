/**
 * واجهة بنك تحدي الأسئلة — مصدر واحد للفئات والأسئلة القابلة للعب.
 * المحتوى القديم يُحمَّل كـ DRAFT؛ اللعب المحلي = PUBLISHED فقط.
 */
import { ALL_QUESTIONS } from "../islamicQuizData";
import { QUIZ_BATCH1_DRAFT_QUESTIONS } from "./batch1-draft";
import {
  QUIZ_ALL_CATEGORIES,
  QUIZ_LEAF_CATEGORIES,
  resolveQuizCategoryPoolId,
} from "./categories";
import { flattenLegacyPools } from "./legacy-adapter";
import {
  assertNoUlamaCategory,
  assertPublishedInvariant,
  listPlayableCategories,
  listPublishedQuestions,
  type CategoryWithCount,
} from "./publication";
import type { QuizBankQuestion } from "./types";

let cachedBank: QuizBankQuestion[] | null = null;

/** بناء البنك الكامل (legacy DRAFT + batch drafts) */
export function buildFullQuizBank(): QuizBankQuestion[] {
  if (cachedBank) return cachedBank;
  const items: QuizBankQuestion[] = [];
  for (const cat of QUIZ_LEAF_CATEGORIES) {
    const pools =
      ALL_QUESTIONS[cat.id] ?? ALL_QUESTIONS[resolveQuizCategoryPoolId(cat.id)];
    if (!pools) continue;
    items.push(
      ...flattenLegacyPools({
        categoryId: cat.id,
        pools: {
          200: pools[200] ?? [],
          400: pools[400] ?? [],
          600: pools[600] ?? [],
        },
      }),
    );
  }
  items.push(...QUIZ_BATCH1_DRAFT_QUESTIONS);
  assertNoUlamaCategory([...QUIZ_ALL_CATEGORIES]);
  assertPublishedInvariant(items);
  cachedBank = items;
  return items;
}

export function getPublishedQuizQuestions(
  categoryIds?: readonly string[],
): QuizBankQuestion[] {
  return listPublishedQuestions(buildFullQuizBank(), categoryIds);
}

export function getPlayableQuizCategories(): CategoryWithCount[] {
  return listPlayableCategories(buildFullQuizBank(), 1);
}

export function getPublishedQuestionCount(): number {
  return getPublishedQuizQuestions().length;
}

export type { CategoryWithCount };
export type { QuizBankQuestion, QuizCategory, QuizPublicationStatus } from "./types";
export {
  canPublishQuestion,
  isPubliclyVisible,
  QUIZ_BANK_SCHEMA_VERSION,
} from "./types";
export {
  QUIZ_CATEGORY_DEFS,
  QUIZ_LEAF_CATEGORIES,
  QUIZ_ALL_CATEGORIES,
  resolveQuizCategoryPoolId,
} from "./categories";
