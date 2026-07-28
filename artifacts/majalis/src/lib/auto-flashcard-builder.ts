/**
 * Automated Contextual Flashcard Builder.
 * Converts verse / rare vocab / matn into SM-2 flashcard objects with tags.
 */

import { INITIAL_CARD_STATE, nextReviewDate } from "@/lib/spaced-repetition";
import { saveLocalReview, type LocalFlashReview } from "@/lib/flashcard-local-store";
import { addCard } from "@/lib/quran-memorization";
import { getSurahMeta } from "@/lib/quran-api";
import { idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type FlashcardSourceKind = "verse" | "ghareeb" | "matn" | "mutashabihat" | "adhkar" | "custom";

export type FlashcardTag =
  | "Mutashabihat"
  | "Azkar"
  | "Fiqh Matn"
  | "Ghareeb"
  | "Quran"
  | "Hifz"
  | "Tadabbur"
  | string;

export type BuiltFlashcard = {
  id: string;
  card_type: "quran" | "hadith" | "lesson" | "vocab" | "matn" | "adhkar";
  card_id: string;
  front: string;
  back: string;
  hint?: string;
  tags: FlashcardTag[];
  sourceKind: FlashcardSourceKind;
  sm2: {
    interval_days: number;
    ease_factor: number;
    repetitions: number;
    next_review_at: string;
  };
  createdAt: string;
};

const VAULT_LS = "majalis-built-flashcards-v1";
const IDB_PREFIX = "built-fc:";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function defaultTags(kind: FlashcardSourceKind, extra?: FlashcardTag[]): FlashcardTag[] {
  const base: FlashcardTag[] = [];
  switch (kind) {
    case "verse":
      base.push("Quran", "Hifz");
      break;
    case "ghareeb":
      base.push("Ghareeb", "Quran");
      break;
    case "matn":
      base.push("Fiqh Matn");
      break;
    case "mutashabihat":
      base.push("Mutashabihat", "Hifz", "Quran");
      break;
    case "adhkar":
      base.push("Azkar");
      break;
    default:
      base.push("Quran");
  }
  return [...new Set([...(extra || []), ...base])];
}

function persistBuilt(card: BuiltFlashcard): void {
  try {
    const raw = localStorage.getItem(VAULT_LS);
    const list: BuiltFlashcard[] = raw ? JSON.parse(raw) : [];
    const next = [card, ...list.filter((c) => c.id !== card.id)].slice(0, 1_000);
    localStorage.setItem(VAULT_LS, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.flashcards, `${IDB_PREFIX}${card.id}`, card).catch(() => undefined);
}

export function listBuiltFlashcards(): BuiltFlashcard[] {
  try {
    const raw = localStorage.getItem(VAULT_LS);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function registerSm2Review(
  userId: string,
  card: BuiltFlashcard,
): Promise<LocalFlashReview> {
  const review: LocalFlashReview = {
    key: `${userId}::${card.card_type}:${card.card_id}`,
    user_id: userId,
    card_type: card.card_type,
    card_id: card.card_id,
    next_review_at: card.sm2.next_review_at,
    interval_days: card.sm2.interval_days,
    ease_factor: card.sm2.ease_factor,
    repetitions: card.sm2.repetitions,
    last_quality: 0,
    reviewed_at: new Date().toISOString(),
    dirty: true,
  };
  await saveLocalReview(review);
  return review;
}

function makeSm2Block() {
  const state = { ...INITIAL_CARD_STATE, interval_days: 0 };
  return {
    interval_days: state.interval_days,
    ease_factor: state.ease_factor,
    repetitions: state.repetitions,
    next_review_at: nextReviewDate(0).toISOString(),
  };
}

/** Build SM-2 card from a Quran verse. */
export async function buildFlashcardFromVerse(opts: {
  surah: number;
  ayah: number;
  text: string;
  userId?: string;
  tags?: FlashcardTag[];
  /** Also push into quran-memorization AyahCard store */
  alsoMemorizationDeck?: boolean;
}): Promise<BuiltFlashcard> {
  const surahName = getSurahMeta(opts.surah).name;
  const card_id = `${opts.surah}:${opts.ayah}`;
  const card: BuiltFlashcard = {
    id: uid("fc-ayah"),
    card_type: "quran",
    card_id,
    front: `أكمل / اذكر الآية ${opts.surah}:${opts.ayah} — سورة ${surahName}`,
    back: opts.text.trim(),
    hint: `${surahName} ${opts.ayah}`,
    tags: defaultTags("verse", opts.tags),
    sourceKind: "verse",
    sm2: makeSm2Block(),
    createdAt: new Date().toISOString(),
  };
  persistBuilt(card);
  if (opts.alsoMemorizationDeck !== false) {
    try {
      addCard(opts.surah, surahName, opts.ayah, opts.text);
    } catch {
      /* ignore */
    }
  }
  await registerSm2Review(opts.userId || "local", card);
  return card;
}

/** Build card from rare Quranic vocabulary (Ghareeb). */
export async function buildFlashcardFromGhareeb(opts: {
  word: string;
  meaning: string;
  exampleRef?: string;
  userId?: string;
  tags?: FlashcardTag[];
}): Promise<BuiltFlashcard> {
  const card: BuiltFlashcard = {
    id: uid("fc-gh"),
    card_type: "vocab",
    card_id: `ghareeb:${opts.word}`,
    front: `ما معنى «${opts.word}» في غريب القرآن؟`,
    back: opts.meaning,
    hint: opts.exampleRef,
    tags: defaultTags("ghareeb", opts.tags),
    sourceKind: "ghareeb",
    sm2: makeSm2Block(),
    createdAt: new Date().toISOString(),
  };
  persistBuilt(card);
  await registerSm2Review(opts.userId || "local", card);
  return card;
}

/** Build card from a matn line (Fiqh / Hadith matn). */
export async function buildFlashcardFromMatn(opts: {
  matnLine: string;
  answer: string;
  sourceId?: string;
  userId?: string;
  tags?: FlashcardTag[];
}): Promise<BuiltFlashcard> {
  const card: BuiltFlashcard = {
    id: uid("fc-matn"),
    card_type: "matn",
    card_id: opts.sourceId || uid("matn"),
    front: opts.matnLine.trim(),
    back: opts.answer.trim(),
    tags: defaultTags("matn", opts.tags),
    sourceKind: "matn",
    sm2: makeSm2Block(),
    createdAt: new Date().toISOString(),
  };
  persistBuilt(card);
  await registerSm2Review(opts.userId || "local", card);
  return card;
}

/** Build card emphasizing a mutashabihat discrepancy. */
export async function buildFlashcardFromMutashabihat(opts: {
  prompt: string;
  answer: string;
  leftRef: string;
  rightRef: string;
  userId?: string;
  tags?: FlashcardTag[];
}): Promise<BuiltFlashcard> {
  const card: BuiltFlashcard = {
    id: uid("fc-msh"),
    card_type: "quran",
    card_id: `mutashabihat:${opts.leftRef}:${opts.rightRef}`,
    front: opts.prompt,
    back: opts.answer,
    hint: `${opts.leftRef} ↔ ${opts.rightRef}`,
    tags: defaultTags("mutashabihat", opts.tags),
    sourceKind: "mutashabihat",
    sm2: makeSm2Block(),
    createdAt: new Date().toISOString(),
  };
  persistBuilt(card);
  await registerSm2Review(opts.userId || "local", card);
  return card;
}

/** Build card from an azkar line. */
export async function buildFlashcardFromAdhkar(opts: {
  text: string;
  answer?: string;
  adhkarId?: string;
  userId?: string;
  tags?: FlashcardTag[];
}): Promise<BuiltFlashcard> {
  const card: BuiltFlashcard = {
    id: uid("fc-adhkar"),
    card_type: "adhkar",
    card_id: opts.adhkarId || uid("adhkar"),
    front: "أتمّ الذكر / ما بقية النص؟",
    back: opts.answer?.trim() || opts.text.trim(),
    hint: opts.text.slice(0, 40),
    tags: defaultTags("adhkar", opts.tags),
    sourceKind: "adhkar",
    sm2: makeSm2Block(),
    createdAt: new Date().toISOString(),
  };
  persistBuilt(card);
  await registerSm2Review(opts.userId || "local", card);
  return card;
}
