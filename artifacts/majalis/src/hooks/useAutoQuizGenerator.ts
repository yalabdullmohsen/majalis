import { useCallback, useMemo, useState } from "react";
import {
  generateAutoQuizSet,
  generateFlashcardMcq,
  generateWordFillQuestion,
  isAutoQuizAnswerCorrect,
  type AutoQuizQuestion,
  type WordFillSourceKind,
} from "@/lib/auto-quiz-generator";
import type { FlashCard } from "@/lib/flashcard-service";

/** Dynamic quiz generator hook — no UI chrome. */
export function useAutoQuizGenerator() {
  const [questions, setQuestions] = useState<AutoQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const current = questions[index] ?? null;

  const buildFromTexts = useCallback(
    (
      texts: Array<{ text: string; sourceKind: WordFillSourceKind; id?: string }>,
      flashcards?: FlashCard[],
      limit = 10,
    ) => {
      const set = generateAutoQuizSet({ texts, flashcards, limit });
      setQuestions(set);
      setIndex(0);
      setScore(0);
      setAnswered(0);
      return set;
    },
    [],
  );

  const buildFromFlashcards = useCallback((flashcards: FlashCard[], limit = 10) => {
    const set = generateAutoQuizSet({ flashcards, limit });
    setQuestions(set);
    setIndex(0);
    setScore(0);
    setAnswered(0);
    return set;
  }, []);

  const submit = useCallback(
    (answer: string): boolean => {
      if (!current) return false;
      const ok = isAutoQuizAnswerCorrect(current, answer);
      setAnswered((n) => n + 1);
      if (ok) setScore((s) => s + 1);
      setIndex((i) => (i < questions.length - 1 ? i + 1 : i));
      return ok;
    },
    [current, questions.length],
  );

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(0, questions.length - 1)));
  }, [questions.length]);

  const makeWordFill = useCallback(
    (text: string, sourceKind: WordFillSourceKind = "custom") =>
      generateWordFillQuestion(text, { sourceKind }),
    [],
  );

  const makeFlashMcq = useCallback(
    (card: FlashCard, pool: FlashCard[]) => generateFlashcardMcq(card, pool),
    [],
  );

  const progress = useMemo(
    () => ({
      index,
      total: questions.length,
      score,
      answered,
      done: questions.length > 0 && answered >= questions.length,
    }),
    [index, questions.length, score, answered],
  );

  return {
    questions,
    current,
    progress,
    buildFromTexts,
    buildFromFlashcards,
    submit,
    next,
    makeWordFill,
    makeFlashMcq,
  };
}
