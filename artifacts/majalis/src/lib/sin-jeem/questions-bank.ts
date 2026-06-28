import bankJson from "../../../data/sin-jeem/questions-bank.json";
import { SIN_JEEM_QUESTIONS } from "./questions-seed";
import type { SinJeemQuestion } from "./types";

/** Generated question bank (500+ items) — see scripts/generate-sin-jeem-bank.mjs */
export const SIN_JEEM_BANK: SinJeemQuestion[] = bankJson as SinJeemQuestion[];

let _mergedCache: SinJeemQuestion[] | null = null;

/** Merge generated bank + legacy seed, deduplicated by question text (bank first). */
export function getAllSinJeemQuestions(): SinJeemQuestion[] {
  if (_mergedCache) return _mergedCache;

  const seen = new Set<string>();
  const merged: SinJeemQuestion[] = [];

  for (const q of [...SIN_JEEM_BANK, ...SIN_JEEM_QUESTIONS]) {
    const key = q.question.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(q);
  }

  _mergedCache = merged;
  return merged;
}

export function getBankQuestionCount(): number {
  return SIN_JEEM_BANK.length;
}

export function getMergedQuestionCount(): number {
  return getAllSinJeemQuestions().length;
}
