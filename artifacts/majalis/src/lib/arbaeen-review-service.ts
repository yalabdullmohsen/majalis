/**
 * تكرار متباعد (SM-2 الحقيقي) لأحاديث الأربعون النووية — المرحلة 11.
 *
 * يُعيد استخدام محرك SM-2 الفعلي src/lib/spaced-repetition.ts (خوارزمية
 * SuperMemo-2 حرفيًا: ease_factor/interval_days/repetitions، مُختبَر بـ
 * scripts/test-sm2.mjs) وجدول flashcard_reviews الحقيقي الذي يستخدمه
 * src/lib/flashcard-service.ts فعلاً لبطاقات الحديث — بإضافة card_type="arbaeen"
 * جديد بدل جدول موازٍ (تحقّقت من المخطط الحي: card_type نص حر بلا قيد CHECK،
 * والقيد الفريد (user_id, card_type, card_id) يدعم هذا مباشرة، وRLS
 * "auth.uid() = user_id" يحمي الصفوف تلقائيًا لأي card_type).
 *
 * هذا هو التصحيح الفعلي لسياق مؤسسي كان خاطئًا: "src/lib/learning-paths/
 * engine.ts" (المُسمّى سابقًا خطأً "محرك SM-2" في تعليمات هذه المهمة) هو
 * فعليًا محرك تتبّع تقدّم مسارات/دورات (أحداث إنجاز، نسب مئوية، جدولة أيام) لا
 * علاقة له بخوارزمية SM-2 الحقيقية إطلاقًا — لا "ease factor" ولا "تكرار" فيه.
 * محرك SM-2 الحقيقي الوحيد في هذا المشروع هو spaced-repetition.ts، وهو
 * المُستخدَم هنا.
 */
import { supabase } from "@/lib/supabase";
import { sm2, nextReviewDate, type ReviewQuality, type CardState } from "@/lib/spaced-repetition";
import { ARBAEEN_NAWAWI } from "@/lib/arbaeen-nawawi-seed";

const CARD_TYPE = "arbaeen";

type ArbaeenReviewRow = {
  card_id: string;
  next_review_at: string | null;
  interval_days: number | null;
  ease_factor: number | null;
  repetitions: number | null;
};

export type ArbaeenReviewState = {
  hadithId: number;
  nextReviewAt: string | null;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
};

/** حالة المراجعة الحالية لكل الأحاديث الـ42 (غير المُراجَع = فترة صفر/جديد). */
export async function fetchArbaeenReviewStates(userId: string): Promise<Map<number, ArbaeenReviewState>> {
  const { data } = await supabase
    .from("flashcard_reviews")
    .select("card_id,next_review_at,interval_days,ease_factor,repetitions")
    .eq("user_id", userId)
    .eq("card_type", CARD_TYPE);

  const map = new Map<number, ArbaeenReviewState>();
  for (const row of (data ?? []) as ArbaeenReviewRow[]) {
    const hadithId = Number(row.card_id);
    if (!Number.isFinite(hadithId)) continue;
    map.set(hadithId, {
      hadithId,
      nextReviewAt: row.next_review_at,
      intervalDays: row.interval_days ?? 0,
      easeFactor: row.ease_factor ?? 2.5,
      repetitions: row.repetitions ?? 0,
    });
  }
  return map;
}

/** أرقام الأحاديث المستحقة اليوم (مراجعة سابقة حان وقتها، أو لم تُراجَع قط). */
export function dueHadithIds(states: Map<number, ArbaeenReviewState>): number[] {
  const now = Date.now();
  return ARBAEEN_NAWAWI.map((h) => h.id).filter((id) => {
    const s = states.get(id);
    if (!s || !s.nextReviewAt) return true; // لم يُراجَع قط ⇒ مستحق
    return new Date(s.nextReviewAt).getTime() <= now;
  });
}

/** مستوى إتقان حديث بعينه من حالة SM-2 — يُشتقّ من repetitions/interval، لا
 *  حقل مخزَّن منفصل، بنفس منطق "masteredCount" في flashcard-service.ts. */
export type ArbaeenMasteryLevel = "مبتدئ" | "متوسط" | "متقدم" | "حافظ";

export function masteryLevel(state: ArbaeenReviewState | undefined): ArbaeenMasteryLevel {
  if (!state || state.repetitions === 0) return "مبتدئ";
  if (state.intervalDays > 21) return "حافظ";
  if (state.repetitions >= 3) return "متقدم";
  return "متوسط";
}

/** إرسال نتيجة مراجعة حديث — يحدّث جدول SM-2 الحقيقي بالضبط كبطاقات الحديث العادية. */
export async function submitArbaeenReview(
  userId: string,
  hadithId: number,
  currentState: ArbaeenReviewState | undefined,
  quality: ReviewQuality,
): Promise<ArbaeenReviewState> {
  const state: CardState = {
    interval_days: currentState?.intervalDays ?? 0,
    ease_factor: currentState?.easeFactor ?? 2.5,
    repetitions: currentState?.repetitions ?? 0,
  };
  const next = sm2(state, quality);
  const nextDate = nextReviewDate(next.interval_days);

  await supabase.from("flashcard_reviews").upsert(
    {
      user_id: userId,
      card_type: CARD_TYPE,
      card_id: String(hadithId),
      next_review_at: nextDate.toISOString(),
      interval_days: next.interval_days,
      ease_factor: next.ease_factor,
      repetitions: next.repetitions,
      last_quality: quality,
      reviewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,card_type,card_id" },
  );

  return {
    hadithId,
    nextReviewAt: nextDate.toISOString(),
    intervalDays: next.interval_days,
    easeFactor: next.ease_factor,
    repetitions: next.repetitions,
  };
}

export type ArbaeenProgressStats = {
  totalHadiths: number;
  dueToday: number;
  masteredCount: number; // مستوى "حافظ"
  notStartedCount: number;
};

export async function fetchArbaeenProgressStats(userId: string): Promise<ArbaeenProgressStats> {
  const states = await fetchArbaeenReviewStates(userId);
  const total = ARBAEEN_NAWAWI.length;
  let mastered = 0;
  let notStarted = 0;
  for (const h of ARBAEEN_NAWAWI) {
    const s = states.get(h.id);
    const level = masteryLevel(s);
    if (level === "حافظ") mastered += 1;
    if (level === "مبتدئ") notStarted += 1;
  }
  return {
    totalHadiths: total,
    dueToday: dueHadithIds(states).length,
    masteredCount: mastered,
    notStartedCount: notStarted,
  };
}
