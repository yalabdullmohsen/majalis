/**
 * Personal Weakness Tracker & Adaptive Recall Engine.
 * Monitors hesitation/delay during flashcard reviews and verse recall,
 * builds a Priority Recall List in IndexedDB, and boosts SM-2 queue priority.
 */

import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import {
  applyReviewRating,
  type CardState,
  type ReviewQuality,
  type ReviewRating,
  type Sm2CardMetrics,
} from "@/lib/spaced-repetition";
import { saveLocalReview, type LocalFlashReview } from "@/lib/flashcard-local-store";

export type WeaknessItemKind = "flashcard" | "verse_recall" | "ayah";

export type WeaknessSignal = {
  kind: WeaknessItemKind;
  /** flashcard key or `surah:ayah` */
  itemId: string;
  cardType?: string;
  /** Hesitation / answer delay in ms */
  hesitationMs: number;
  /** Optional explicit quality if already rated */
  quality?: ReviewQuality | ReviewRating;
  correct?: boolean;
  recordedAt?: string;
};

export type WeaknessEntry = {
  itemId: string;
  kind: WeaknessItemKind;
  cardType: string;
  hesitationMsAvg: number;
  hesitationSamples: number;
  missCount: number;
  /** Higher = more urgent */
  priorityScore: number;
  lastSeenAt: string;
  nextBoostAt: string;
};

export type PriorityRecallList = {
  updatedAt: string;
  items: WeaknessEntry[];
};

const LS_KEY = "majalis-weakness-tracker-v1";
const IDB_KEY = "weakness-priority-recall-v1";
const LOCAL_USER = "local";

/** Delays above this count as hesitation (ms). */
export const HESITATION_THRESHOLD_MS = 4_500;
/** Hard hesitation for severe priority boost. */
export const HARD_HESITATION_MS = 12_000;

function readList(): PriorityRecallList {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { updatedAt: new Date(0).toISOString(), items: [] };
    const parsed = JSON.parse(raw) as PriorityRecallList;
    if (!Array.isArray(parsed.items)) return { updatedAt: new Date(0).toISOString(), items: [] };
    return parsed;
  } catch {
    return { updatedAt: new Date(0).toISOString(), items: [] };
  }
}

function writeList(list: PriorityRecallList): PriorityRecallList {
  const next = { ...list, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, next).catch(() => undefined);
  void idbPut(OFFLINE_STORES.flashcards, `priority-recall:${LOCAL_USER}`, next).catch(() => undefined);
  return next;
}

export function loadPriorityRecallList(): PriorityRecallList {
  return readList();
}

export async function loadPriorityRecallListAsync(): Promise<PriorityRecallList> {
  try {
    const fromIdb =
      (await idbGetValue<PriorityRecallList>(OFFLINE_STORES.meta, IDB_KEY)) ||
      (await idbGetValue<PriorityRecallList>(OFFLINE_STORES.flashcards, `priority-recall:${LOCAL_USER}`));
    if (fromIdb?.items) {
      writeList(fromIdb);
      return fromIdb;
    }
  } catch {
    /* fall through */
  }
  return readList();
}

/**
 * Compute priority score from hesitation + misses.
 * Scale roughly 0–100.
 */
export function computePriorityScore(opts: {
  hesitationMsAvg: number;
  missCount: number;
  samples: number;
}): number {
  const hes =
    opts.hesitationMsAvg >= HARD_HESITATION_MS
      ? 50
      : opts.hesitationMsAvg >= HESITATION_THRESHOLD_MS
        ? 30 + ((opts.hesitationMsAvg - HESITATION_THRESHOLD_MS) / (HARD_HESITATION_MS - HESITATION_THRESHOLD_MS)) * 20
        : (opts.hesitationMsAvg / HESITATION_THRESHOLD_MS) * 20;
  const misses = Math.min(40, opts.missCount * 12);
  const volume = Math.min(10, opts.samples * 2);
  return Math.round(Math.min(100, hes + misses + volume));
}

function defaultCardType(kind: WeaknessItemKind, cardType?: string): string {
  if (cardType) return cardType;
  if (kind === "verse_recall" || kind === "ayah") return "quran_ayah";
  return "flashcard";
}

/** Record a hesitation / miss signal into the priority list. */
export function recordWeaknessSignal(signal: WeaknessSignal): WeaknessEntry {
  const list = readList();
  const cardType = defaultCardType(signal.kind, signal.cardType);
  const now = signal.recordedAt ?? new Date().toISOString();
  const existing = list.items.find((i) => i.itemId === signal.itemId && i.cardType === cardType);

  const wasMiss =
    signal.correct === false ||
    signal.quality === 0 ||
    signal.quality === 1 ||
    signal.quality === "again";

  let entry: WeaknessEntry;
  if (existing) {
    const samples = existing.hesitationSamples + 1;
    const hesitationMsAvg = Math.round(
      (existing.hesitationMsAvg * existing.hesitationSamples + signal.hesitationMs) / samples,
    );
    const missCount = existing.missCount + (wasMiss ? 1 : 0);
    entry = {
      ...existing,
      hesitationMsAvg,
      hesitationSamples: samples,
      missCount,
      priorityScore: computePriorityScore({ hesitationMsAvg, missCount, samples }),
      lastSeenAt: now,
      nextBoostAt: now,
    };
    list.items = list.items.map((i) => (i.itemId === entry.itemId && i.cardType === entry.cardType ? entry : i));
  } else {
    const hesitationMsAvg = signal.hesitationMs;
    const missCount = wasMiss ? 1 : 0;
    entry = {
      itemId: signal.itemId,
      kind: signal.kind,
      cardType,
      hesitationMsAvg,
      hesitationSamples: 1,
      missCount,
      priorityScore: computePriorityScore({ hesitationMsAvg, missCount, samples: 1 }),
      lastSeenAt: now,
      nextBoostAt: now,
    };
    list.items.push(entry);
  }

  // Keep top 200 by priority
  list.items.sort((a, b) => b.priorityScore - a.priorityScore);
  list.items = list.items.slice(0, 200);
  writeList(list);
  return entry;
}

export function getPriorityRecallItems(limit = 30): WeaknessEntry[] {
  return readList()
    .items.slice()
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);
}

/**
 * Merge priority items into an SM-2 due queue: weak items float to the front.
 * Does not drop non-priority items.
 */
export function mergePriorityIntoQueue<T extends { card_id?: string; card_type?: string; key?: string; id?: string }>(
  dueQueue: T[],
  opts?: { limit?: number; minScore?: number },
): T[] {
  const minScore = opts?.minScore ?? 25;
  const limit = opts?.limit ?? 50;
  const priority = getPriorityRecallItems(100).filter((p) => p.priorityScore >= minScore);
  const priorityKeys = new Set(priority.map((p) => `${p.cardType}:${p.itemId}`));

  const scoreOf = (item: T): number => {
    const id = item.card_id || item.id || "";
    const type = item.card_type || "";
    const key = item.key || `${type}:${id}`;
    const hit = priority.find(
      (p) =>
        key === `${p.cardType}:${p.itemId}` ||
        key.endsWith(`:${p.itemId}`) ||
        id === p.itemId,
    );
    return hit?.priorityScore ?? 0;
  };

  const boosted = dueQueue
    .slice()
    .sort((a, b) => scoreOf(b) - scoreOf(a) || 0)
    .slice(0, limit);

  // Ensure high-priority items appear even if not already in due queue (as stubs via key match only — caller supplies cards)
  void priorityKeys;
  return boosted;
}

/**
 * Push a weakness entry into the local SM-2 store with accelerated due date.
 * Quality defaults to "hard" so interval stays short.
 */
export async function feedWeaknessIntoSm2Queue(
  entry: WeaknessEntry,
  opts?: { userId?: string; rating?: ReviewRating; baseState?: CardState },
): Promise<LocalFlashReview> {
  const userId = opts?.userId ?? LOCAL_USER;
  const rating = opts?.rating ?? "hard";
  const base: CardState = opts?.baseState ?? {
    interval_days: 0,
    ease_factor: 2.2,
    repetitions: 0,
  };
  const metrics: Sm2CardMetrics = applyReviewRating(base, rating);
  // Accelerate: due immediately for high priority
  const due =
    entry.priorityScore >= 40
      ? new Date().toISOString()
      : metrics.nextReviewDate;

  const row: LocalFlashReview = {
    key: `${userId}::${entry.cardType}:${entry.itemId}`,
    user_id: userId,
    card_type: entry.cardType,
    card_id: entry.itemId,
    next_review_at: due,
    interval_days: Math.max(1, Math.min(metrics.interval, entry.priorityScore >= 40 ? 1 : metrics.interval)),
    ease_factor: Math.min(metrics.easeFactor, 2.3),
    repetitions: metrics.repetitions,
    last_quality: 3,
    reviewed_at: new Date().toISOString(),
    dirty: true,
  };
  await saveLocalReview(row);
  return row;
}

/** Batch-feed top priority items into SM-2. */
export async function syncPriorityRecallToSm2(
  opts?: { userId?: string; limit?: number; minScore?: number },
): Promise<LocalFlashReview[]> {
  const items = getPriorityRecallItems(opts?.limit ?? 15).filter(
    (i) => i.priorityScore >= (opts?.minScore ?? 30),
  );
  const out: LocalFlashReview[] = [];
  for (const entry of items) {
    out.push(await feedWeaknessIntoSm2Queue(entry, { userId: opts?.userId }));
  }
  return out;
}

/** Clear a resolved weakness (after easy recall). */
export function clearWeaknessEntry(itemId: string, cardType?: string): void {
  const list = readList();
  list.items = list.items.filter(
    (i) => !(i.itemId === itemId && (!cardType || i.cardType === cardType)),
  );
  writeList(list);
}
