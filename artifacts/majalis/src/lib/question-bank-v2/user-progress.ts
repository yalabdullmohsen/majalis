import type { UserQuestionProgress } from "./types";

const PROGRESS_KEY = "majalis-qb-v2-progress";

export function loadUserProgress(): UserQuestionProgress[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as UserQuestionProgress[]) : [];
  } catch {
    return [];
  }
}

export function saveUserProgress(entries: UserQuestionProgress[]): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

export function recordAnswer(
  questionId: string,
  categorySlug: string,
  correct: boolean,
): UserQuestionProgress[] {
  const prev = loadUserProgress();
  const idx = prev.findIndex((p) => p.questionId === questionId);
  const now = new Date().toISOString();

  if (idx >= 0) {
    const p = prev[idx];
    const attempts = p.attempts + 1;
    const wrongCount = p.wrongCount + (correct ? 0 : 1);
    const mastery = Math.min(100, Math.round((p.mastery + (correct ? 15 : -10)) ));
    prev[idx] = {
      ...p,
      answered: true,
      correct: correct || p.correct,
      attempts,
      wrongCount,
      mastery: Math.max(0, mastery),
      lastAttemptAt: now,
    };
  } else {
    prev.push({
      questionId,
      categorySlug,
      answered: true,
      correct,
      attempts: 1,
      wrongCount: correct ? 0 : 1,
      mastery: correct ? 50 : 20,
      lastAttemptAt: now,
    });
  }

  saveUserProgress(prev);
  return prev;
}

export function getAnsweredIds(categorySlug?: string): Set<string> {
  const entries = loadUserProgress();
  return new Set(
    entries
      .filter((e) => !categorySlug || e.categorySlug === categorySlug)
      .map((e) => e.questionId),
  );
}

export function getWeakCategorySlugs(): string[] {
  return loadUserProgress()
    .filter((p) => p.wrongCount >= 2 && p.mastery < 60)
    .map((p) => p.categorySlug);
}

export function getMasteryLevel(categorySlug: string): number {
  const entries = loadUserProgress().filter((p) => p.categorySlug === categorySlug);
  if (!entries.length) return 0;
  return Math.round(entries.reduce((s, p) => s + p.mastery, 0) / entries.length);
}
