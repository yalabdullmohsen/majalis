/**
 * Automated Quiz & Word-Fill Generator — omits words from verses/azkar/matn
 * and builds MCQs from saved flashcards. Pure logic; no UI.
 */

import { normalizeArabic } from "@/shared/arabic-normalize";
import type { FlashCard } from "@/lib/flashcard-service";

export type WordFillSourceKind = "quran" | "adhkar" | "matn" | "flashcard" | "custom";

export type WordFillQuestion = {
  id: string;
  kind: "word-fill";
  sourceKind: WordFillSourceKind;
  prompt: string;
  /** Full original text */
  fullText: string;
  blankedText: string;
  answer: string;
  /** Distractors for optional MCQ mode */
  options: string[];
  meta?: Record<string, string | number>;
};

export type FlashcardMcqQuestion = {
  id: string;
  kind: "flashcard-mcq";
  prompt: string;
  answer: string;
  options: string[];
  cardId: string;
};

export type AutoQuizQuestion = WordFillQuestion | FlashcardMcqQuestion;

const STOP_WORDS = new Set(
  [
    "من", "في", "على", "إلى", "عن", "ما", "لا", "إن", "أن", "هذا", "هذه",
    "ذلك", "التي", "الذي", "أو", "ثم", "قد", "لم", "ولا", "وما", "يا",
  ].map((w) => normalizeArabic(w)),
);

function tokenizeArabic(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g, ""))
    .filter(Boolean);
}

function eligibleBlankIndices(tokens: string[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const n = normalizeArabic(tokens[i]);
    if (n.length < 3) continue;
    if (STOP_WORDS.has(n)) continue;
    out.push(i);
  }
  return out.length ? out : tokens.map((_, i) => i).filter((i) => tokens[i].length >= 2);
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickBlankCount(tokenCount: number, requested?: number): number {
  if (requested != null) return Math.max(1, Math.min(requested, Math.max(1, tokenCount - 1)));
  if (tokenCount <= 3) return 1;
  if (tokenCount <= 8) return 1;
  return Math.min(2, Math.floor(tokenCount / 5) || 1);
}

/**
 * Randomly omit 1–N content words from a text for self-assessment.
 */
export function generateWordFillQuestion(
  text: string,
  opts?: {
    sourceKind?: WordFillSourceKind;
    id?: string;
    blankCount?: number;
    distractors?: string[];
    meta?: Record<string, string | number>;
    rng?: () => number;
  },
): WordFillQuestion | null {
  try {
    const fullText = text.trim();
    if (!fullText) return null;
    const tokens = tokenizeArabic(fullText);
    if (tokens.length < 2) return null;

    const rng = opts?.rng ?? Math.random;
    const eligible = eligibleBlankIndices(tokens);
    const blankCount = pickBlankCount(tokens.length, opts?.blankCount);
    const chosen = shuffle(eligible, rng).slice(0, blankCount).sort((a, b) => a - b);
    if (!chosen.length) return null;

    const answers: string[] = [];
    const blanked = tokens.map((t, i) => {
      if (chosen.includes(i)) {
        answers.push(t);
        return "……";
      }
      return t;
    });

    const answer = answers.join(" ");
    const pool = [
      ...(opts?.distractors || []),
      ...eligible
        .filter((i) => !chosen.includes(i))
        .map((i) => tokens[i]),
    ];
    const distractors = shuffle(
      [...new Set(pool.map((w) => w).filter((w) => normalizeArabic(w) !== normalizeArabic(answer)))],
      rng,
    ).slice(0, 3);

    while (distractors.length < 3) {
      distractors.push(`خيار ${distractors.length + 1}`);
    }

    const options = shuffle([answer, ...distractors.slice(0, 3)], rng);

    return {
      id: opts?.id || `wf-${Date.now()}-${Math.floor(rng() * 1e6)}`,
      kind: "word-fill",
      sourceKind: opts?.sourceKind || "custom",
      prompt: "أكمل الفراغ بالكلمة المناسبة",
      fullText,
      blankedText: blanked.join(" "),
      answer,
      options,
      meta: opts?.meta,
    };
  } catch {
    return null;
  }
}

export function generateWordFillFromAyah(
  ayahText: string,
  surah: number,
  ayah: number,
): WordFillQuestion | null {
  return generateWordFillQuestion(ayahText, {
    sourceKind: "quran",
    meta: { surah, ayah },
  });
}

export function generateWordFillFromAdhkar(
  text: string,
  adhkarId: string,
): WordFillQuestion | null {
  return generateWordFillQuestion(text, {
    sourceKind: "adhkar",
    meta: { adhkarId },
  });
}

export function generateWordFillFromMatn(
  matn: string,
  sourceId?: string,
): WordFillQuestion | null {
  return generateWordFillQuestion(matn, {
    sourceKind: "matn",
    meta: sourceId ? { sourceId } : undefined,
  });
}

/**
 * Build an MCQ from a flashcard: show front, pick correct back among distractors
 * drawn from other cards.
 */
export function generateFlashcardMcq(
  card: FlashCard,
  pool: FlashCard[],
  rng: () => number = Math.random,
): FlashcardMcqQuestion | null {
  try {
    const answer = (card.back || "").trim();
    const prompt = (card.front || "").trim();
    if (!prompt || !answer) return null;

    const distractors = shuffle(
      pool.filter((c) => c.id !== card.id && (c.back || "").trim() && normalizeArabic(c.back) !== normalizeArabic(answer)),
      rng,
    )
      .slice(0, 3)
      .map((c) => c.back.trim());

    while (distractors.length < 3) {
      distractors.push(`إجابة بديلة ${distractors.length + 1}`);
    }

    return {
      id: `fc-mcq-${card.id}-${Math.floor(rng() * 1e5)}`,
      kind: "flashcard-mcq",
      prompt: `ما الإجابة الصحيحة؟\n${prompt}`,
      answer,
      options: shuffle([answer, ...distractors.slice(0, 3)], rng),
      cardId: card.id,
    };
  } catch {
    return null;
  }
}

/** Generate a mixed quiz set from texts + flashcards. */
export function generateAutoQuizSet(opts: {
  texts?: Array<{ text: string; sourceKind: WordFillSourceKind; id?: string }>;
  flashcards?: FlashCard[];
  limit?: number;
}): AutoQuizQuestion[] {
  const limit = opts.limit ?? 10;
  const out: AutoQuizQuestion[] = [];

  for (const t of opts.texts || []) {
    if (out.length >= limit) break;
    const q = generateWordFillQuestion(t.text, {
      sourceKind: t.sourceKind,
      id: t.id,
    });
    if (q) out.push(q);
  }

  const cards = opts.flashcards || [];
  const shuffled = shuffle(cards);
  for (const card of shuffled) {
    if (out.length >= limit) break;
    const q = generateFlashcardMcq(card, cards);
    if (q) out.push(q);
  }

  return out.slice(0, limit);
}

export function isAutoQuizAnswerCorrect(
  question: AutoQuizQuestion,
  userAnswer: string,
): boolean {
  return normalizeArabic(userAnswer) === normalizeArabic(question.answer);
}
