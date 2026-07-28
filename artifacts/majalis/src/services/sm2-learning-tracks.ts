/**
 * SM-2 Learning Tracks + weakness recall + auto flashcard/quiz builder (Module 3).
 */

import {
  applyReviewRating,
  ratingToQuality,
  type CardState,
  type ReviewQuality,
  type ReviewRating,
  type Sm2CardMetrics,
} from "@/lib/spaced-repetition";
import { saveLocalReview, listDueLocalReviews, type LocalFlashReview } from "@/lib/flashcard-local-store";
import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import { normalizeArabic } from "@/shared/arabic-normalize";

export type LearningTag = "#Fiqh" | "#Tafseer" | "#Azkar" | "#Quran" | "#Mutashabihat" | "#Ghareeb" | string;

export type AutoFlashcard = {
  id: string;
  cardType: string;
  front: string;
  back: string;
  tags: LearningTag[];
  sourceRef?: string;
  quizKind: "cloze" | "concept" | "recall";
};

export type WeaknessEntry = {
  itemId: string;
  kind: "flashcard" | "verse_recall" | "ayah";
  cardType: string;
  hesitationMsAvg: number;
  hesitationSamples: number;
  missCount: number;
  priorityScore: number;
  lastSeenAt: string;
};

export type PriorityRecallList = {
  updatedAt: string;
  items: WeaknessEntry[];
};

const WEAK_LS = "majalis-weakness-tracker-v1";
const WEAK_IDB = "weakness-priority-recall-v1";
const CARDS_LS = "majalis-auto-flashcards-v1";
const LOCAL_USER = "local";

export const HESITATION_THRESHOLD_MS = 4_500;

export function reviewWithSm2(
  state: CardState | Sm2CardMetrics,
  rating: ReviewRating | ReviewQuality,
): Sm2CardMetrics {
  return applyReviewRating(state, rating);
}

function readWeakList(): PriorityRecallList {
  try {
    const raw = localStorage.getItem(WEAK_LS);
    if (!raw) return { updatedAt: new Date(0).toISOString(), items: [] };
    return JSON.parse(raw) as PriorityRecallList;
  } catch {
    return { updatedAt: new Date(0).toISOString(), items: [] };
  }
}

function writeWeakList(list: PriorityRecallList): PriorityRecallList {
  const next = { ...list, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(WEAK_LS, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.meta, WEAK_IDB, next).catch(() => undefined);
  void idbPut(OFFLINE_STORES.flashcards, `priority-recall:${LOCAL_USER}`, next).catch(() => undefined);
  return next;
}

export function computePriorityScore(opts: {
  hesitationMsAvg: number;
  missCount: number;
  samples: number;
}): number {
  const hes =
    opts.hesitationMsAvg >= 12_000
      ? 50
      : opts.hesitationMsAvg >= HESITATION_THRESHOLD_MS
        ? 30
        : (opts.hesitationMsAvg / HESITATION_THRESHOLD_MS) * 20;
  return Math.round(Math.min(100, hes + Math.min(40, opts.missCount * 12) + Math.min(10, opts.samples * 2)));
}

export function recordWeaknessSignal(signal: {
  kind: WeaknessEntry["kind"];
  itemId: string;
  cardType?: string;
  hesitationMs: number;
  correct?: boolean;
  quality?: ReviewQuality | ReviewRating;
}): WeaknessEntry {
  const list = readWeakList();
  const cardType = signal.cardType || (signal.kind === "flashcard" ? "flashcard" : "quran_ayah");
  const wasMiss =
    signal.correct === false ||
    signal.quality === 0 ||
    signal.quality === 1 ||
    signal.quality === "again";
  const existing = list.items.find((i) => i.itemId === signal.itemId && i.cardType === cardType);
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
      lastSeenAt: new Date().toISOString(),
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
      lastSeenAt: new Date().toISOString(),
    };
    list.items.push(entry);
  }
  list.items.sort((a, b) => b.priorityScore - a.priorityScore);
  list.items = list.items.slice(0, 200);
  writeWeakList(list);
  return entry;
}

export function getPriorityRecallItems(limit = 30): WeaknessEntry[] {
  return readWeakList().items.slice(0, limit);
}

export function mergePriorityIntoQueue<T extends { card_id?: string; card_type?: string; id?: string }>(
  due: T[],
  minScore = 25,
): T[] {
  const priority = getPriorityRecallItems(100).filter((p) => p.priorityScore >= minScore);
  const scoreOf = (item: T) => {
    const id = item.card_id || item.id || "";
    const hit = priority.find((p) => p.itemId === id);
    return hit?.priorityScore ?? 0;
  };
  return due.slice().sort((a, b) => scoreOf(b) - scoreOf(a));
}

export async function feedWeaknessIntoSm2(
  entry: WeaknessEntry,
  userId = LOCAL_USER,
): Promise<LocalFlashReview> {
  const metrics = applyReviewRating(
    { interval_days: 0, ease_factor: 2.2, repetitions: 0 },
    "hard",
  );
  const row: LocalFlashReview = {
    key: `${userId}::${entry.cardType}:${entry.itemId}`,
    user_id: userId,
    card_type: entry.cardType,
    card_id: entry.itemId,
    next_review_at: entry.priorityScore >= 40 ? new Date().toISOString() : metrics.nextReviewDate,
    interval_days: 1,
    ease_factor: Math.min(metrics.easeFactor, 2.3),
    repetitions: metrics.repetitions,
    last_quality: ratingToQuality("hard"),
    reviewed_at: new Date().toISOString(),
    dirty: true,
  };
  await saveLocalReview(row);
  return row;
}

function saveAutoCards(cards: AutoFlashcard[]): void {
  try {
    const prev = JSON.parse(localStorage.getItem(CARDS_LS) || "[]") as AutoFlashcard[];
    const map = new Map(prev.map((c) => [c.id, c]));
    for (const c of cards) map.set(c.id, c);
    localStorage.setItem(CARDS_LS, JSON.stringify([...map.values()].slice(0, 500)));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.flashcards, "auto-flashcards-v1", cards).catch(() => undefined);
}

export function loadAutoFlashcards(): AutoFlashcard[] {
  try {
    return JSON.parse(localStorage.getItem(CARDS_LS) || "[]") as AutoFlashcard[];
  } catch {
    return [];
  }
}

/** Cloze: hide a middle word from ayah/matn line. */
export function buildClozeCard(opts: {
  id: string;
  text: string;
  sourceRef?: string;
  tags?: LearningTag[];
}): AutoFlashcard | null {
  const words = opts.text.split(/\s+/).filter(Boolean);
  if (words.length < 3) return null;
  const idx = Math.floor(words.length / 2);
  const answer = words[idx]!;
  const frontWords = words.map((w, i) => (i === idx ? "…" : w));
  return {
    id: opts.id,
    cardType: "quran_cloze",
    front: frontWords.join(" "),
    back: answer,
    tags: opts.tags || ["#Quran"],
    sourceRef: opts.sourceRef,
    quizKind: "cloze",
  };
}

/** Concept-linking: prompt ↔ meaning (ghareeb / topic). */
export function buildConceptCard(opts: {
  id: string;
  term: string;
  meaning: string;
  tags?: LearningTag[];
  sourceRef?: string;
}): AutoFlashcard {
  return {
    id: opts.id,
    cardType: "concept_link",
    front: `ما معنى: ${opts.term}؟`,
    back: opts.meaning,
    tags: opts.tags || ["#Ghareeb"],
    sourceRef: opts.sourceRef,
    quizKind: "concept",
  };
}

export function buildCardsFromVerse(opts: {
  surah: number;
  ayah: number;
  text: string;
  tags?: LearningTag[];
}): AutoFlashcard[] {
  const ref = `${opts.surah}:${opts.ayah}`;
  const cards: AutoFlashcard[] = [];
  const cloze = buildClozeCard({
    id: `cloze-${ref}`,
    text: opts.text,
    sourceRef: ref,
    tags: ["#Quran", ...(opts.tags || [])],
  });
  if (cloze) cards.push(cloze);
  cards.push({
    id: `recall-${ref}`,
    cardType: "verse_recall",
    front: `أكمل الآية (${ref})`,
    back: opts.text,
    tags: ["#Quran", ...(opts.tags || [])],
    sourceRef: ref,
    quizKind: "recall",
  });
  saveAutoCards(cards);
  return cards;
}

export function inferTagsFromText(text: string): LearningTag[] {
  const n = normalizeArabic(text);
  const tags: LearningTag[] = ["#Quran"];
  if (/فقه|صلاة|زكاة|صوم|حج/.test(n) || /فقه|صلاه|زكاه/.test(n)) tags.push("#Fiqh");
  if (/تفسير|معنى|يقول/.test(n)) tags.push("#Tafseer");
  if (/سبحان|استغفر|اللهم/.test(n)) tags.push("#Azkar");
  return tags;
}

export async function getPrioritizedDueReviews(userId = LOCAL_USER, limit = 40): Promise<LocalFlashReview[]> {
  const due = await listDueLocalReviews(userId, limit * 2);
  return mergePriorityIntoQueue(due).slice(0, limit);
}

export async function hydrateWeaknessFromIdb(): Promise<PriorityRecallList> {
  try {
    const fromIdb = await idbGetValue<PriorityRecallList>(OFFLINE_STORES.meta, WEAK_IDB);
    if (fromIdb?.items) {
      writeWeakList(fromIdb);
      return fromIdb;
    }
  } catch {
    /* ignore */
  }
  return readWeakList();
}
