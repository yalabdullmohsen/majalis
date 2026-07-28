/**
 * Local persistence for flashcard SM-2 review states (IndexedDB + localStorage mirror).
 * Used offline-first; syncs to Supabase when the user is authenticated.
 */
import { idbGetAll, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import type { ReviewQuality } from "@/lib/spaced-repetition";
import { readLocalJson, writeLocalJson, isPlainObject } from "@/lib/safe-json";

const LS_KEY = "majalis-flashcard-reviews-v1";

export type LocalFlashReview = {
  key: string; // `${card_type}:${card_id}`
  user_id: string;
  card_type: string;
  card_id: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  last_quality: ReviewQuality;
  reviewed_at: string;
  /** Pending remote upsert when offline. */
  dirty?: boolean;
};

function reviewKey(userId: string, cardType: string, cardId: string): string {
  return `${userId}::${cardType}:${cardId}`;
}

function isFlashReview(v: unknown): v is LocalFlashReview {
  return (
    isPlainObject(v) &&
    typeof v.key === "string" &&
    typeof v.user_id === "string" &&
    typeof v.card_type === "string" &&
    typeof v.card_id === "string" &&
    typeof v.next_review_at === "string" &&
    typeof v.interval_days === "number" &&
    typeof v.ease_factor === "number" &&
    typeof v.repetitions === "number"
  );
}

function isFlashReviewList(v: unknown): v is LocalFlashReview[] {
  return Array.isArray(v) && v.every(isFlashReview);
}

function readLs(): LocalFlashReview[] {
  if (typeof window === "undefined") return [];
  return readLocalJson<LocalFlashReview[]>(LS_KEY, [], isFlashReviewList);
}

function writeLs(rows: LocalFlashReview[]): void {
  if (typeof window === "undefined") return;
  writeLocalJson(LS_KEY, rows.slice(0, 2_000));
}

export async function saveLocalReview(row: LocalFlashReview): Promise<void> {
  const key = reviewKey(row.user_id, row.card_type, row.card_id);
  const full = { ...row, key };
  const list = readLs().filter((r) => r.key !== key);
  list.unshift(full);
  writeLs(list);
  try {
    await idbPut(OFFLINE_STORES.flashcards, key, full);
  } catch {
    /* IDB optional */
  }
}

export async function listLocalReviews(userId: string): Promise<LocalFlashReview[]> {
  const fromLs = readLs().filter((r) => r.user_id === userId);
  try {
    const idbRows = await idbGetAll<LocalFlashReview>(OFFLINE_STORES.flashcards);
    const map = new Map<string, LocalFlashReview>();
    for (const r of fromLs) map.set(r.key, r);
    for (const rec of idbRows) {
      const v = rec.value;
      if (v?.user_id === userId) map.set(v.key, v);
    }
    return [...map.values()];
  } catch {
    return fromLs;
  }
}

export async function listDueLocalReviews(userId: string, limit = 50): Promise<LocalFlashReview[]> {
  const now = Date.now();
  const all = await listLocalReviews(userId);
  return all
    .filter((r) => new Date(r.next_review_at).getTime() <= now)
    .sort((a, b) => a.next_review_at.localeCompare(b.next_review_at))
    .slice(0, limit);
}

export async function listDirtyReviews(userId: string): Promise<LocalFlashReview[]> {
  return (await listLocalReviews(userId)).filter((r) => r.dirty);
}

export async function markReviewClean(row: LocalFlashReview): Promise<void> {
  await saveLocalReview({ ...row, dirty: false });
}

export function localFlashStats(userId: string): {
  totalReviewed: number;
  dueToday: number;
  masteredCount: number;
} {
  const all = readLs().filter((r) => r.user_id === userId);
  const now = Date.now();
  return {
    totalReviewed: all.length,
    dueToday: all.filter((r) => new Date(r.next_review_at).getTime() <= now).length,
    masteredCount: all.filter((r) => r.interval_days > 21).length,
  };
}
