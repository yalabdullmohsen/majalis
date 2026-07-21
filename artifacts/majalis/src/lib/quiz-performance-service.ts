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

export type HomeQuizStats = {
  totalAttempts: number;
  overallAccuracy: number | null; // 0-100، null إن لم توجد محاولات بعد
  /** نسبة الصحيح ليوم آخر محاولة فعلية (بديل صادق لمفهوم "آخر نتيجة" — لا
   *  توجد جلسات لعب مُسجَّلة في quiz_attempts، فقط وقائع أسئلة فردية). */
  lastDayAccuracy: number | null;
  /** أفضل نسبة صحيحة ضمن يوم واحد تاريخيًا (حد أدنى 3 محاولات لذلك اليوم
   *  كي لا يُعتبر يوم بسؤال واحد صحيح "أفضل نتيجة" مبالغًا فيها). */
  bestDayAccuracy: number | null;
  /** أيام متتالية (تنتهي اليوم أو أمس) بها محاولة واحدة على الأقل. */
  dayStreak: number;
};

const MIN_DAY_ATTEMPTS_FOR_BEST = 3;

/**
 * إحصاءات بطاقة "سؤال وجواب" بالرئيسية (المرحلة 6) — كلها محسوبة من
 * quiz_attempts الحقيقي (created_at لكل وقعة)، لا من جدول جلسات منفصل
 * (غير موجود) ولا بيانات مصطنعة. "آخر/أفضل نتيجة" مُعرَّفتان صراحةً هنا
 * كنسبة صحيح على مستوى اليوم التقويمي، بديلًا صادقًا لمفهوم "نتيجة الجلسة"
 * الذي لا يدعمه المخطط الحالي للجدول.
 */
export async function fetchHomeQuizStats(): Promise<HomeQuizStats | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("is_correct, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error || !data) return null;
  if (data.length === 0) {
    return { totalAttempts: 0, overallAccuracy: null, lastDayAccuracy: null, bestDayAccuracy: null, dayStreak: 0 };
  }

  const dayKey = (iso: string) => iso.slice(0, 10); // "YYYY-MM-DD" — كافٍ لتجميع يومي بدون مكتبة تواريخ
  const byDay = new Map<string, { total: number; correct: number }>();
  let totalCorrect = 0;
  for (const row of data) {
    const key = dayKey(row.created_at);
    const entry = byDay.get(key) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (row.is_correct) { entry.correct += 1; totalCorrect += 1; }
    byDay.set(key, entry);
  }

  const days = [...byDay.keys()].sort(); // تصاعديًا
  const lastDayKey = days[days.length - 1];
  const lastDay = byDay.get(lastDayKey)!;

  let bestDayAccuracy: number | null = null;
  for (const [, v] of byDay) {
    if (v.total < MIN_DAY_ATTEMPTS_FOR_BEST) continue;
    const acc = Math.round((v.correct / v.total) * 100);
    if (bestDayAccuracy === null || acc > bestDayAccuracy) bestDayAccuracy = acc;
  }

  // سلسلة الأيام: نعدّ من اليوم (أو أمس إن لم يُلعَب اليوم بعد) رجوعًا، طالما
  // كل يوم سابق متتالٍ موجود في byDay.
  const daySet = new Set(days);
  const toKey = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  let cursor = daySet.has(toKey(today)) ? today : new Date(today.getTime() - 86_400_000);
  let dayStreak = 0;
  while (daySet.has(toKey(cursor))) {
    dayStreak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }

  return {
    totalAttempts: data.length,
    overallAccuracy: Math.round((totalCorrect / data.length) * 100),
    lastDayAccuracy: Math.round((lastDay.correct / lastDay.total) * 100),
    bestDayAccuracy,
    dayStreak,
  };
}
