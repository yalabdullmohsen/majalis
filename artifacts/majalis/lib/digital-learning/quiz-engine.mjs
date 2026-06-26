/**
 * Quiz engine — grading, error analysis, multiple question types.
 */

import { DEMO_QUIZZES, getQuizForPath } from "./paths-seed.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { localGet, localSet, getLocalUserId } from "./storage.mjs";
import { recordAchievement } from "./progress.mjs";

function normalizeQuizAnswer(text) {
  return String(text || "")
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function gradeQuestion(question, userAnswer) {
  const type = question.question_type || "text";
  const correct = question.correct_answer;

  switch (type) {
    case "multiple_choice": {
      const idx = typeof userAnswer === "number" ? userAnswer : Number(userAnswer);
      const ok = idx === correct.value;
      return { correct: ok, points: ok ? (question.points || 1) : 0 };
    }
    case "true_false": {
      const val = userAnswer === true || userAnswer === "true" || userAnswer === "صح";
      const ok = val === correct.value;
      return { correct: ok, points: ok ? (question.points || 1) : 0 };
    }
    case "ordering": {
      const expected = correct.order || [];
      const given = Array.isArray(userAnswer) ? userAnswer : [];
      const ok = JSON.stringify(expected) === JSON.stringify(given);
      return { correct: ok, points: ok ? (question.points || 1) : 0 };
    }
    case "matching": {
      const expected = correct.pairs || {};
      const given = userAnswer || {};
      const ok = JSON.stringify(expected) === JSON.stringify(given);
      return { correct: ok, points: ok ? (question.points || 1) : 0 };
    }
    case "text":
    default: {
      const input = normalizeQuizAnswer(String(userAnswer || ""));
      const accepted = correct.values || [correct.value];
      const ok = accepted.some((a) => {
        const b = normalizeQuizAnswer(String(a));
        return input === b || (b.includes(input) && input.length >= 3);
      });
      return { correct: ok, points: ok ? (question.points || 1) : 0 };
    }
  }
}

export async function getQuiz(admin, quizIdOrPathSlug) {
  const seed = getQuizForPath(quizIdOrPathSlug.replace("quiz-", "")) ||
    DEMO_QUIZZES.find((q) => q.id === quizIdOrPathSlug);

  if (admin) {
    try {
      const { data: quiz } = await admin
        .from("learning_quizzes")
        .select("*")
        .or(`id.eq.${quizIdOrPathSlug},section.eq.${quizIdOrPathSlug}`)
        .maybeSingle();
      if (quiz) {
        const { data: questions } = await admin
          .from("learning_quiz_questions")
          .select("*")
          .eq("quiz_id", quiz.id)
          .order("sort_order");
        return { ...quiz, questions: questions || [] };
      }
    } catch {
      /* fallback */
    }
  }

  return seed || null;
}

export function gradeQuiz(quiz, answers) {
  const questions = quiz.questions || [];
  let earned = 0;
  let total = 0;
  const results = [];
  const errors = [];

  for (const q of questions) {
    const pts = q.points || 1;
    total += pts;
    const userAnswer = answers[q.id];
    const { correct, points } = gradeQuestion(q, userAnswer);
    earned += points;
    results.push({
      question_id: q.id,
      correct,
      points,
      explanation: q.explanation,
      reference_source: q.reference_source,
      reference_url: q.reference_url,
    });
    if (!correct) {
      errors.push({
        question_id: q.id,
        question: q.question,
        your_answer: userAnswer,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        reference_source: q.reference_source,
      });
    }
  }

  const scorePct = total ? Math.round((earned / total) * 100) : 0;
  const passed = scorePct >= (quiz.passing_score || 70);

  return {
    score_pct: scorePct,
    earned_points: earned,
    total_points: total,
    passed,
    results,
    error_analysis: errors,
  };
}

export async function submitQuizAttempt(admin, userId, quizId, answers) {
  const quiz = await getQuiz(admin, quizId);
  if (!quiz) return { ok: false, error: "quiz_not_found" };

  const graded = gradeQuiz(quiz, answers);
  const uid = userId || getLocalUserId();

  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      await admin.from("learning_quiz_attempts").insert({
        user_id: userId,
        quiz_id: quiz.id,
        score: graded.score_pct,
        total_points: graded.total_points,
        earned_points: graded.earned_points,
        passed: graded.passed,
        answers,
        error_analysis: graded.error_analysis,
      });
    } catch {
      /* fallback */
    }
  }

  const attempts = localGet(`quiz_attempts_${uid}`, []);
  attempts.push({
    quiz_id: quiz.id,
    ...graded,
    completed_at: new Date().toISOString(),
  });
  localSet(`quiz_attempts_${uid}`, attempts);

  if (graded.passed) {
    await recordAchievement(admin, uid, {
      key: `quiz_pass_${quiz.id}`,
      title: `اجتياز ${quiz.title}`,
      description: `حصلت على ${graded.score_pct}% في الاختبار`,
    });
  }

  return { ok: true, ...graded, quiz_title: quiz.title };
}

export async function getAllQuizzes(admin) {
  if (admin) {
    try {
      const { data } = await admin.from("learning_quizzes").select("*").eq("status", "published");
      if (data?.length) return data;
    } catch {
      /* fallback */
    }
  }
  return DEMO_QUIZZES;
}
