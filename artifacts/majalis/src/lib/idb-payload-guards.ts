/**
 * Runtime type guards for IndexedDB / offline payloads.
 * Reject corrupt rows instead of casting with `as` / `any`.
 * Logic-only — no UI.
 */

import { isPlainObject, type SchemaGuard } from "@/lib/safe-json";

export type IdBMetaRow = {
  key: string;
  updatedAt?: string;
  value: unknown;
};

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

export function isIsoDateString(v: unknown): v is string {
  return typeof v === "string" && v.length >= 8 && !Number.isNaN(Date.parse(v));
}

/** Surah detail shape used by offline Quran packs. */
export type GuardedSurahDetail = {
  number: number;
  name: string;
  numberOfAyahs: number;
  ayahs: Array<{ numberInSurah: number; text: string }>;
};

export const isGuardedSurahDetail: SchemaGuard<GuardedSurahDetail> = (
  v: unknown,
): v is GuardedSurahDetail => {
  if (!isPlainObject(v)) return false;
  if (!isFiniteNumber(v.number) || v.number < 1 || v.number > 114) return false;
  if (!isNonEmptyString(v.name)) return false;
  if (!isFiniteNumber(v.numberOfAyahs) || v.numberOfAyahs < 1) return false;
  if (!Array.isArray(v.ayahs)) return false;
  return v.ayahs.every(
    (a) =>
      isPlainObject(a) &&
      isFiniteNumber(a.numberInSurah) &&
      typeof a.text === "string",
  );
};

export type GuardedAudioResume = {
  surah: number;
  ayah: number;
  currentTime: number;
  updatedAt: number;
  reciterId?: string;
};

export const isGuardedAudioResume: SchemaGuard<GuardedAudioResume> = (
  v: unknown,
): v is GuardedAudioResume => {
  if (!isPlainObject(v)) return false;
  return (
    isFiniteNumber(v.surah) &&
    v.surah >= 1 &&
    v.surah <= 114 &&
    isFiniteNumber(v.ayah) &&
    v.ayah >= 1 &&
    isFiniteNumber(v.currentTime) &&
    v.currentTime >= 0 &&
    isFiniteNumber(v.updatedAt)
  );
};

export type GuardedFlashReview = {
  key: string;
  user_id: string;
  card_type: string;
  card_id: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
};

export const isGuardedFlashReview: SchemaGuard<GuardedFlashReview> = (
  v: unknown,
): v is GuardedFlashReview => {
  if (!isPlainObject(v)) return false;
  return (
    isNonEmptyString(v.key) &&
    isNonEmptyString(v.user_id) &&
    isNonEmptyString(v.card_type) &&
    isNonEmptyString(v.card_id) &&
    typeof v.next_review_at === "string" &&
    isFiniteNumber(v.interval_days) &&
    isFiniteNumber(v.ease_factor) &&
    isFiniteNumber(v.repetitions)
  );
};

/**
 * Parse unknown IDB value with a guard; returns null on mismatch (never throws).
 */
export function guardIdbValue<T>(value: unknown, guard: SchemaGuard<T>): T | null {
  try {
    return guard(value) ? value : null;
  } catch {
    return null;
  }
}
