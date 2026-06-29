import type { SinJeemQuestion } from "./types";

const PLAYER_KEY = "sin-jeem-player-key";
const ANSWERED_KEY = "sin-jeem-answered";
const CYCLE_KEY = "sin-jeem-cycle";
const PROGRESS_KEY = "sin-jeem-category-progress";

export interface AnsweredRecord {
  questionId: string;
  categorySlug: string;
  wasCorrect: boolean | null;
  answeredAt: string;
  cycle: number;
}

export interface CategoryProgress {
  categorySlug: string;
  cycle: number;
  answeredCount: number;
  totalInCategory: number;
  completionPct: number;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function getPlayerKey(): string {
  let key = localStorage.getItem(PLAYER_KEY);
  if (!key) {
    key = `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(PLAYER_KEY, key);
  }
  return key;
}

export function getCurrentCycle(): number {
  return Number(localStorage.getItem(CYCLE_KEY) || "1");
}

export function getAnsweredRecords(): AnsweredRecord[] {
  return readJson<AnsweredRecord[]>(ANSWERED_KEY, []);
}

export function recordAnswer(
  questionId: string,
  categorySlug: string,
  wasCorrect: boolean | null,
): void {
  const cycle = getCurrentCycle();
  const records = getAnsweredRecords();
  if (records.some((r) => r.questionId === questionId && r.cycle === cycle)) return;
  records.push({
    questionId,
    categorySlug,
    wasCorrect,
    answeredAt: new Date().toISOString(),
    cycle,
  });
  writeJson(ANSWERED_KEY, records);
  syncCategoryProgress(categorySlug);
  void syncToServer(questionId, categorySlug, wasCorrect, cycle);
}

function syncCategoryProgress(categorySlug: string): void {
  const cycle = getCurrentCycle();
  const records = getAnsweredRecords().filter(
    (r) => r.categorySlug === categorySlug && r.cycle === cycle,
  );
  const progress = getCategoryProgressMap();
  const existing = progress[categorySlug] || {
    categorySlug,
    cycle,
    answeredCount: 0,
    totalInCategory: 0,
    completionPct: 0,
  };
  existing.answeredCount = records.length;
  if (existing.totalInCategory > 0) {
    existing.completionPct = Math.round((existing.answeredCount / existing.totalInCategory) * 100);
  }
  progress[categorySlug] = existing;
  writeJson(PROGRESS_KEY, progress);
}

export function setCategoryTotals(totals: Record<string, number>): void {
  const progress = getCategoryProgressMap();
  const cycle = getCurrentCycle();
  for (const [slug, total] of Object.entries(totals)) {
    const rec = progress[slug] || { categorySlug: slug, cycle, answeredCount: 0, totalInCategory: 0, completionPct: 0 };
    rec.totalInCategory = total;
    rec.completionPct = total > 0 ? Math.round((rec.answeredCount / total) * 100) : 0;
    progress[slug] = rec;
  }
  writeJson(PROGRESS_KEY, progress);
}

export function getCategoryProgressMap(): Record<string, CategoryProgress> {
  return readJson<Record<string, CategoryProgress>>(PROGRESS_KEY, {});
}

export function getAnsweredIdsForCategory(categorySlug: string, pool: SinJeemQuestion[]): Set<string> {
  const cycle = getCurrentCycle();
  const records = getAnsweredRecords();
  const answered = new Set(
    records.filter((r) => r.cycle === cycle && (!categorySlug || r.categorySlug === categorySlug)).map((r) => r.questionId),
  );

  const categoryQuestions = categorySlug
    ? pool.filter((q) => q.category_slug === categorySlug)
    : pool;

  const allAnsweredInCategory = categoryQuestions.every((q) => answered.has(q.id));
  if (allAnsweredInCategory && categoryQuestions.length > 0) {
    startNewCycle();
    return new Set();
  }

  return answered;
}

export function startNewCycle(): void {
  const next = getCurrentCycle() + 1;
  localStorage.setItem(CYCLE_KEY, String(next));
}

async function syncToServer(
  questionId: string,
  categorySlug: string,
  wasCorrect: boolean | null,
  cycle: number,
): Promise<void> {
  try {
    await fetch("/api/question-answer?action=record_answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        action: "record_answer",
        player_key: getPlayerKey(),
        question_id: questionId,
        category_slug: categorySlug,
        was_correct: wasCorrect,
        cycle,
      }),
    });
  } catch {
    /* offline */
  }
}

export function filterUnseenQuestions(
  pool: SinJeemQuestion[],
  categorySlugs: string[],
): SinJeemQuestion[] {
  if (categorySlugs.length === 0) {
    const answered = getAnsweredIdsForCategory("", pool);
    return pool.filter((q) => !answered.has(q.id));
  }
  return pool.filter((q) => {
    const slug = q.category_slug || "";
    if (!categorySlugs.includes(slug)) return true;
    const answered = getAnsweredIdsForCategory(slug, pool);
    return !answered.has(q.id);
  });
}
