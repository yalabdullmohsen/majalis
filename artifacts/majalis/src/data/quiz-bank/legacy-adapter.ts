/**
 * محوّل البنك القديم → عقد المراجعة.
 * كل المحتوى المحلي الحالي يُعامَل كـ DRAFT / NEEDS_SOURCE حتى المراجعة البشرية.
 * لا يُنشر تلقائيًا.
 */
import type { QuizQuestion } from "../islamicQuizData";
import {
  QUIZ_BANK_SCHEMA_VERSION,
  mapLegacyKindToType,
  type QuizBankQuestion,
  type QuizDifficulty,
} from "./types";

const TS = "2026-09-20T00:00:00.000Z";

function difficultyFromPoints(pts: 200 | 400 | 600): QuizDifficulty {
  if (pts === 200) return "easy";
  if (pts === 400) return "medium";
  return "hard";
}

export function legacyQuestionToBank(
  q: QuizQuestion,
  categoryId: string,
  pointValue: 200 | 400 | 600,
): QuizBankQuestion {
  const hasSource = Boolean(q.source && q.source.trim());
  return {
    id: q.id,
    categoryId,
    type: mapLegacyKindToType(q.kind),
    difficulty: difficultyFromPoints(pointValue),
    questionText: q.q,
    choices: q.choices,
    correctIndex: q.correctIndex,
    correctChoiceId:
      q.correctIndex != null && q.choices
        ? `${q.id}:c${q.correctIndex}`
        : undefined,
    acceptedAnswers: q.a ? [q.a] : undefined,
    explanation: q.a,
    hint: q.hint,
    items: q.items,
    pairs: q.pairs,
    pointValue,
    sourceTitle: hasSource ? q.source : undefined,
    sourceReference: hasSource ? q.source : undefined,
    sourceType: "project_internal",
    quotationStatus: "NONE",
    licenseStatus: "UNKNOWN",
    shariaReviewStatus: "PENDING",
    languageReviewStatus: "PENDING",
    factualReviewStatus: "PENDING",
    /** مسار المنتج: لا ظهور للعامة قبل HUMAN_REVIEWED → PUBLISHED */
    publicationStatus: hasSource ? "NEEDS_SOURCE" : "DRAFT",
    createdAt: TS,
    updatedAt: TS,
    schemaVersion: QUIZ_BANK_SCHEMA_VERSION,
  };
}

export function flattenLegacyPools(input: {
  categoryId: string;
  pools: { 200: QuizQuestion[]; 400: QuizQuestion[]; 600: QuizQuestion[] };
}): QuizBankQuestion[] {
  const out: QuizBankQuestion[] = [];
  for (const pts of [200, 400, 600] as const) {
    for (const q of input.pools[pts] ?? []) {
      out.push(legacyQuestionToBank(q, input.categoryId, pts));
    }
  }
  return out;
}
