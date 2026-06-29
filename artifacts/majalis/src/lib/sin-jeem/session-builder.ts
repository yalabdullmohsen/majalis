import type { MatchConfig, SinJeemQuestion } from "./types";
import { getAllSinJeemQuestions } from "./questions-bank";
import { requestFetch } from "@/lib/request-manager";

export type QuestionHistoryRow = {
  question_id: string;
  attempts?: number;
  correct_count?: number;
  wrong_count?: number;
  skip_count?: number;
  last_shown_at?: string;
  avg_response_ms?: number;
  mastery_level?: number;
  cycle_seen?: number;
};

export type SessionBuildMeta = {
  adaptiveDifficulty: string;
  cycleNumber: number;
  allSeen: boolean;
  source: "api" | "local";
};

export async function buildSessionQuestions(
  config: MatchConfig,
  userId?: string | null,
): Promise<{ questions: SinJeemQuestion[]; meta: SessionBuildMeta }> {
  if (userId) {
    try {
      const res = await requestFetch("/api/question-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "build_session",
          config,
          user_id: userId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.questions?.length) {
          return {
            questions: data.questions,
            meta: {
              adaptiveDifficulty: data.meta?.adaptiveDifficulty || config.difficulty,
              cycleNumber: data.meta?.cycleNumber || 0,
              allSeen: Boolean(data.meta?.allSeen),
              source: "api",
            },
          };
        }
      }
    } catch {
      /* fall through to local smart build */
    }
  }

  const { buildSmartSessionLocal } = await import("./session-builder-local");
  const result = buildSmartSessionLocal(config, []);
  return { ...result, meta: { ...result.meta, source: "local" } };
}

export async function recordAnswerProgress(payload: {
  userId: string;
  questionId: string;
  isCorrect: boolean | null;
  responseMs: number;
  difficulty?: string;
  categorySlug?: string;
}): Promise<void> {
  try {
    await requestFetch("/api/question-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "record_answer", ...payload }),
    });
  } catch {
    /* non-blocking */
  }
}

export function getLocalQuestionPool(): SinJeemQuestion[] {
  return getAllSinJeemQuestions();
}
