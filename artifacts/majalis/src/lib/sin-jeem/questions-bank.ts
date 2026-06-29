import bankJson from "../../../data/sin-jeem/questions-bank.json";
import type { SinJeemQuestion } from "./types";

/** v2 question bank — single source (legacy seed cleared) */
export const SIN_JEEM_BANK: SinJeemQuestion[] = bankJson as SinJeemQuestion[];

let _cache: SinJeemQuestion[] | null = null;

export function getAllSinJeemQuestions(): SinJeemQuestion[] {
  if (_cache) return _cache;
  _cache = [...SIN_JEEM_BANK];
  return _cache;
}

export function getBankQuestionCount(): number {
  return SIN_JEEM_BANK.length;
}

export function getMergedQuestionCount(): number {
  return getAllSinJeemQuestions().length;
}
