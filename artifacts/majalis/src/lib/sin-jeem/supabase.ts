import { supabase } from "@/lib/supabase";
import { requestFetch } from "@/lib/request-manager";
import { isMissingSchemaError } from "@/lib/safe-supabase";
import { MAIN_CATEGORIES } from "@/lib/question-bank-v2/categories";
import { getPlayableQuestions, getMergedQuestionCount } from "./questions-bank";
import type { GameStats, LeaderboardEntry, SinJeemQuestion } from "./types";
import { getPlayerCount, loadLocalStats } from "./storage";

export type QuestionAnswerDbHealth = {
  available: boolean;
  tablesMissing: boolean;
  message?: string;
};

export async function probeQuestionAnswerDb(): Promise<QuestionAnswerDbHealth> {
  if (!supabase) {
    return {
      available: false,
      tablesMissing: true,
      message: "Supabase client not configured",
    };
  }

  try {
    const { error } = await supabase.from("sin_jeem_categories").select("id").limit(1);
    if (error && isMissingSchemaError(error)) {
      return { available: false, tablesMissing: true, message: error.message };
    }
    if (error) {
      return { available: false, tablesMissing: false, message: error.message };
    }
    return { available: true, tablesMissing: false };
  } catch (err) {
    return {
      available: false,
      tablesMissing: true,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchGameQuestions(opts?: {
  difficulty?: string;
  categorySlugs?: string[];
  limit?: number;
}): Promise<SinJeemQuestion[]> {
  if (!supabase) return filterLocalQuestions(opts);

  try {
    let query = supabase
      .from("sin_jeem_questions")
      .select("*")
      .eq("status", "published")
      .limit(opts?.limit || 200);

    if (opts?.difficulty) query = query.eq("difficulty", opts.difficulty);

    const { data, error } = await query;
    if (error && isMissingSchemaError(error)) return filterLocalQuestions(opts);
    if (error || !data?.length) return filterLocalQuestions(opts);

    return data.map((row) => ({
      id: row.id,
      category_id: row.category_id,
      question_type: row.question_type,
      question: row.question,
      options: Array.isArray(row.options) ? row.options : JSON.parse(row.options || "[]"),
      correct_index: row.correct_index,
      correct_answer: row.correct_answer,
      explanation: row.explanation,
      difficulty: row.difficulty,
      keywords: row.keywords,
      image_url: row.image_url,
      audio_url: row.audio_url,
      video_url: row.video_url,
      points: row.points,
    }));
  } catch {
    return filterLocalQuestions(opts);
  }
}

function filterLocalQuestions(opts?: {
  difficulty?: string;
  categorySlugs?: string[];
  limit?: number;
}): SinJeemQuestion[] {
  let q = getPlayableQuestions();
  if (opts?.difficulty) q = q.filter((x) => x.difficulty === opts.difficulty);
  if (opts?.categorySlugs?.length) {
    q = q.filter((x) => opts.categorySlugs!.includes(x.category_slug || ""));
  }
  return q.slice(0, opts?.limit || q.length);
}

export async function fetchGameStats(): Promise<GameStats> {
  const local = loadLocalStats();
  const questionCount = getMergedQuestionCount();
  const categoryCount = MAIN_CATEGORIES.length;
  const playerCount = getPlayerCount();

  if (!supabase) {
    return {
      questionCount,
      categoryCount,
      playerCount,
      matchCount: local.matchCount,
    };
  }

  try {
    const [qRes, cRes] = await Promise.all([
      supabase.from("sin_jeem_questions").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("sin_jeem_categories").select("*", { count: "exact", head: true }).eq("status", "published"),
    ]);

    if (isMissingSchemaError(qRes.error) || isMissingSchemaError(cRes.error)) {
      return { questionCount, categoryCount, playerCount, matchCount: local.matchCount };
    }

    return {
      questionCount: qRes.count || questionCount,
      categoryCount: cRes.count || categoryCount,
      playerCount,
      matchCount: local.matchCount,
    };
  } catch {
    return { questionCount, categoryCount, playerCount, matchCount: local.matchCount };
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await requestFetch("/api/question-answer?action=leaderboard&period=all", { credentials: "same-origin" });
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.players?.length) return data.players;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export async function adminGetQuestions(): Promise<SinJeemQuestion[]> {
  if (!supabase) return getPlayableQuestions();
  const { data, error } = await supabase.from("sin_jeem_questions").select("*").order("created_at", { ascending: false }).limit(500);
  if (error || !data) return getPlayableQuestions();
  return data.map((row) => ({
    id: row.id,
    category_slug: row.category_id,
    question_type: row.question_type,
    question: row.question,
    options: Array.isArray(row.options) ? row.options : [],
    correct_index: row.correct_index,
    explanation: row.explanation,
    difficulty: row.difficulty,
  }));
}

export async function adminUpsertQuestion(q: Partial<SinJeemQuestion> & { question: string }): Promise<boolean> {
  if (!supabase) return false;
  const payload = {
    question: q.question,
    question_type: q.question_type || "multiple_choice",
    options: q.options || [],
    correct_index: q.correct_index ?? 0,
    explanation: q.explanation,
    difficulty: q.difficulty || "متوسط",
    status: "published",
  };
  if (q.id && !q.id.startsWith("sq-")) {
    const { error } = await supabase.from("sin_jeem_questions").update(payload).eq("id", q.id);
    return !error;
  }
  const { error } = await supabase.from("sin_jeem_questions").insert(payload);
  return !error;
}

export async function adminDeleteQuestion(id: string): Promise<boolean> {
  if (!supabase || id.startsWith("sq-")) return false;
  const { error } = await supabase.from("sin_jeem_questions").delete().eq("id", id);
  return !error;
}
