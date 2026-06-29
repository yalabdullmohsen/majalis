import bankV2Json from "../../../data/sin-jeem/questions-bank-v2.json";
import { toSinJeemQuestion } from "@/lib/question-bank-v2/selector";
import type { QuestionBankItem } from "@/lib/question-bank-v2/types";
import type { SinJeemQuestion } from "./types";

const V2_BANK: QuestionBankItem[] = bankV2Json as unknown as QuestionBankItem[];

let _playableCache: SinJeemQuestion[] | null = null;
let _allCache: SinJeemQuestion[] | null = null;

/** Published + review items for offline play (legacy bank disabled). */
export function getPlayableQuestions(): SinJeemQuestion[] {
  if (_playableCache) return _playableCache;
  _playableCache = V2_BANK.filter((q) => q.status === "published" || q.status === "review").map(toSinJeemQuestion);
  return _playableCache;
}

/** All v2 bank items (admin). */
export function getAllQuestionBankItems(): QuestionBankItem[] {
  return V2_BANK;
}

/** @deprecated Use getPlayableQuestions — legacy merge removed in v2 rebuild */
export function getAllSinJeemQuestions(): SinJeemQuestion[] {
  return getPlayableQuestions();
}

export function getBankQuestionCount(): number {
  return V2_BANK.length;
}

export function getPublishedQuestionCount(): number {
  return V2_BANK.filter((q) => q.status === "published").length;
}

export function getMergedQuestionCount(): number {
  return getPlayableQuestions().length;
}

export function getQuestionBankV2Report(): { total: number; published: number; review: number } {
  return {
    total: V2_BANK.length,
    published: V2_BANK.filter((q) => q.status === "published").length,
    review: V2_BANK.filter((q) => q.status === "review").length,
  };
}
