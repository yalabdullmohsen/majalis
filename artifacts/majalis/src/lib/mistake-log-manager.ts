/**
 * Self-Correction & Mistake Log Manager.
 * Captures missed flashcards / quiz items and adapts reappearance frequency
 * until mastery is confirmed (SM-2-aware prioritization).
 */

import { idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import { listLocalReviews, saveLocalReview, type LocalFlashReview } from "@/lib/flashcard-local-store";
import { applyReviewRating, type Sm2CardMetrics } from "@/lib/spaced-repetition";

export type MistakeSource = "flashcard" | "quiz" | "memorization" | "mutashabihat" | "other";

export type MistakeEntry = {
  id: string;
  source: MistakeSource;
  itemId: string;
  prompt?: string;
  expectedAnswer?: string;
  userAnswer?: string;
  missCount: number;
  correctStreak: number;
  /** Priority weight — higher = show sooner */
  priority: number;
  mastered: boolean;
  firstMissedAt: string;
  lastMissedAt: string;
  lastCorrectAt?: string;
};

export type MistakePrioritizedItem = MistakeEntry & {
  /** Suggested delay hours before next appearance (0 = immediate) */
  suggestedDelayHours: number;
};

const LS_KEY = "majalis-mistake-log-v1";
const IDB_KEY = "mistake-log-v1";
const MASTERY_STREAK = 3;

function uid(): string {
  return `miss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function readLog(): MistakeEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLog(list: MistakeEntry[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 2_000)));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, list).catch(() => undefined);
}

function recomputePriority(entry: MistakeEntry): number {
  if (entry.mastered) return 0;
  // More misses → higher priority; correct streak reduces it
  return Math.max(1, entry.missCount * 3 - entry.correctStreak * 2);
}

function suggestedDelay(entry: MistakeEntry): number {
  if (entry.mastered) return 72;
  if (entry.missCount >= 5) return 0;
  if (entry.missCount >= 3) return 1;
  if (entry.correctStreak >= 1) return 6;
  return 2;
}

export function listMistakes(includeMastered = false): MistakeEntry[] {
  return readLog().filter((m) => includeMastered || !m.mastered);
}

export function logMistake(input: {
  source: MistakeSource;
  itemId: string;
  prompt?: string;
  expectedAnswer?: string;
  userAnswer?: string;
}): MistakeEntry {
  const list = readLog();
  const idx = list.findIndex((m) => m.source === input.source && m.itemId === input.itemId);
  const now = new Date().toISOString();
  let entry: MistakeEntry;
  if (idx >= 0) {
    entry = {
      ...list[idx],
      missCount: list[idx].missCount + 1,
      correctStreak: 0,
      mastered: false,
      lastMissedAt: now,
      prompt: input.prompt ?? list[idx].prompt,
      expectedAnswer: input.expectedAnswer ?? list[idx].expectedAnswer,
      userAnswer: input.userAnswer,
    };
    entry.priority = recomputePriority(entry);
    list[idx] = entry;
  } else {
    entry = {
      id: uid(),
      source: input.source,
      itemId: input.itemId,
      prompt: input.prompt,
      expectedAnswer: input.expectedAnswer,
      userAnswer: input.userAnswer,
      missCount: 1,
      correctStreak: 0,
      priority: 3,
      mastered: false,
      firstMissedAt: now,
      lastMissedAt: now,
    };
    list.unshift(entry);
  }
  writeLog(list);
  return entry;
}

/** Record a correct answer toward mastery. */
export function logMistakeCorrect(source: MistakeSource, itemId: string): MistakeEntry | null {
  const list = readLog();
  const idx = list.findIndex((m) => m.source === source && m.itemId === itemId);
  if (idx < 0) return null;
  const entry = { ...list[idx] };
  entry.correctStreak += 1;
  entry.lastCorrectAt = new Date().toISOString();
  if (entry.correctStreak >= MASTERY_STREAK) {
    entry.mastered = true;
    entry.priority = 0;
  } else {
    entry.priority = recomputePriority(entry);
  }
  list[idx] = entry;
  writeLog(list);
  return entry;
}

/** Adaptive queue: highest priority first, not mastered. */
export function getPrioritizedMistakes(limit = 20): MistakePrioritizedItem[] {
  return listMistakes(false)
    .map((m) => ({ ...m, suggestedDelayHours: suggestedDelay(m) }))
    .sort((a, b) => b.priority - a.priority || b.missCount - a.missCount)
    .slice(0, limit);
}

/**
 * Push mistake items into SM-2 flash reviews as "again" so they resurface sooner.
 */
export async function boostMistakesInSm2(userId = "local"): Promise<number> {
  const queue = getPrioritizedMistakes(30).filter((m) => m.source === "flashcard" && m.suggestedDelayHours <= 2);
  let n = 0;
  const existing = await listLocalReviews(userId);
  for (const miss of queue) {
    const sep = miss.itemId.indexOf(":");
    const card_type = sep > 0 ? miss.itemId.slice(0, sep) : "lesson";
    const card_id = sep > 0 ? miss.itemId.slice(sep + 1) : miss.itemId;
    const prev = existing.find((r) => r.card_type === card_type && r.card_id === card_id);
    const base: Sm2CardMetrics = prev
      ? {
          easeFactor: prev.ease_factor,
          interval: prev.interval_days,
          repetitions: prev.repetitions,
          nextReviewDate: prev.next_review_at,
        }
      : { easeFactor: 2.5, interval: 0, repetitions: 0, nextReviewDate: new Date().toISOString() };

    const next = applyReviewRating(base, "again");
    // Extra urgency: schedule sooner based on miss priority
    const sooner = new Date();
    sooner.setHours(sooner.getHours() + miss.suggestedDelayHours);
    if (new Date(next.nextReviewDate).getTime() > sooner.getTime()) {
      next.nextReviewDate = sooner.toISOString();
    }

    const row: LocalFlashReview = {
      key: `${userId}::${card_type}:${card_id}`,
      user_id: userId,
      card_type,
      card_id,
      next_review_at: next.nextReviewDate,
      interval_days: next.interval,
      ease_factor: next.easeFactor,
      repetitions: next.repetitions,
      last_quality: 0,
      reviewed_at: new Date().toISOString(),
      dirty: true,
    };
    await saveLocalReview(row);
    n += 1;
  }
  return n;
}

export function clearMasteredMistakes(): number {
  const before = readLog();
  const next = before.filter((m) => !m.mastered);
  writeLog(next);
  return before.length - next.length;
}
