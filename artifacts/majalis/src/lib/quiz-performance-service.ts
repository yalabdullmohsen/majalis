import { supabase } from "@/lib/supabase";
import { GAME_CATEGORIES } from "@/data/islamicQuizData";

export type QuizAttemptSource = "section_quiz" | "team_game";

/** يُسجَّل بصمت — فشل التسجيل لا يجب أن يُعطّل تجربة الاختبار نفسها. */
export async function recordQuizAttempt(
  categoryId: string,
  questionId: string,
  isCorrect: boolean,
  source: QuizAttemptSource = "section_quiz",
): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return; // لا تتبّع بلا تسجيل دخول — لا معنى لـ"نقاط ضعف" مجهولة الهوية عبر الزمن
    await supabase.from("quiz_attempts").insert({
      user_id: userId,
      category_id: categoryId,
      question_id: questionId,
      is_correct: isCorrect,
      source,
    });
  } catch {
    // تجاهل — التسجيل ثانوي، لا يوقف اللعبة
  }
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  total: number;
  correct: number;
  accuracy: number; // 0-100
}

const MIN_ATTEMPTS_FOR_VERDICT = 4;

/**
 * يحسب الأداء لكل تصنيف من الوقائع الخام مباشرة (لا قيمة مخزَّنة جاهزة).
 * يعيد فقط التصنيفات التي وصلت الحد الأدنى من المحاولات — أقل من ذلك لا
 * يكفي لإصدار أي حكم "أنت ضعيف في كذا" بلا مبالغة إحصائية.
 */
export async function fetchUserCategoryPerformance(): Promise<CategoryPerformance[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("category_id, is_correct")
    .eq("user_id", userId);
  if (error || !data) return [];

  const byCategory = new Map<string, { total: number; correct: number }>();
  for (const row of data) {
    const entry = byCategory.get(row.category_id) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (row.is_correct) entry.correct += 1;
    byCategory.set(row.category_id, entry);
  }

  const nameOf = (id: string) => GAME_CATEGORIES.find((c) => c.id === id)?.name ?? id;

  return [...byCategory.entries()]
    .filter(([, v]) => v.total >= MIN_ATTEMPTS_FOR_VERDICT)
    .map(([categoryId, v]) => ({
      categoryId,
      categoryName: nameOf(categoryId),
      total: v.total,
      correct: v.correct,
      accuracy: Math.round((v.correct / v.total) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

const WEAK_THRESHOLD = 60; // أقل من 60% صحيحة تُعتبر نقطة تحتاج مراجعة

export function weakestCategories(perf: CategoryPerformance[], limit = 3): CategoryPerformance[] {
  return perf.filter((p) => p.accuracy < WEAK_THRESHOLD).slice(0, limit);
}

export function strongestCategories(perf: CategoryPerformance[], limit = 3): CategoryPerformance[] {
  return [...perf].sort((a, b) => b.accuracy - a.accuracy).slice(0, limit);
}
