/**
 * بذرة أسئلة الاختبار — البيانات في /public/data/quiz (JSON chunks).
 * لا تُضمَّن المصفوفة في حزمة العميل.
 */
import { loadAllSeedChunks, loadSeedChunksByKey, peekSeedCache } from "./json-seed-loader";

const QUIZ_DATA_BASE = "/data/quiz";

export type QuizQuestion = {
  id?: string;
  section: string;
  category: string;
  level: string;
  question: string;
  answer: string;
  status?: string;
  explanation?: string;
  reference?: string;
  documentation_status?: "sourced" | "unsourced";
  trust_level?: string;
  editorial_review_status?: string;
  last_updated_at?: string;
};

export async function loadDemoQuizQuestions(opts?: { section?: string }): Promise<QuizQuestion[]> {
  if (opts?.section) {
    const key = String(opts.section).replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) || "general";
    return loadSeedChunksByKey<QuizQuestion>(QUIZ_DATA_BASE, key);
  }
  return loadAllSeedChunks<QuizQuestion>(QUIZ_DATA_BASE);
}

export function getDemoQuizQuestionsCached(): QuizQuestion[] {
  return peekSeedCache<QuizQuestion>(QUIZ_DATA_BASE) ?? [];
}

/** @deprecated استخدم loadDemoQuizQuestions */
export const DEMO_QUIZ_QUESTIONS: QuizQuestion[] = new Proxy([] as QuizQuestion[], {
  get(_target, prop, receiver) {
    const data = getDemoQuizQuestionsCached();
    const value = Reflect.get(data, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(data) : value;
  },
  has(_target, prop) {
    return prop in getDemoQuizQuestionsCached();
  },
  ownKeys() {
    return Reflect.ownKeys(getDemoQuizQuestionsCached());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(getDemoQuizQuestionsCached(), prop);
  },
});
