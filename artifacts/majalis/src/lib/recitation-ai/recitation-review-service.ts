/**
 * recitation-review-service.ts
 * ربط مقاطع التسميع بمحرك SM-2 القائم فعلاً (src/lib/spaced-repetition.ts)
 * عبر جدول flashcard_reviews القائم — لا جدول مراجعة موازٍ (القسم 10،
 * القسم 11: "recitation_review_items: ربط بمحرك SM-2 القائم **أو جدوله
 * الحالي إن كان قابلًا للتوسعة**" — card_type عمود TEXT بلا قيد CHECK،
 * فيقبل قيمة جديدة "quran_recitation_segment" بلا أي migration إضافية).
 *
 * لماذا ملف منفصل لا تعديل flashcard-service.ts؟ منطق "حديث/مستحق" هناك
 * خاص ببنية الحديث (front/back/narrator)، لا يناسب نطاق آيات. هذا الملف
 * يستخدم **نفس الجدول ونفس sm2()** فقط، بمنطق استعلام مستقل لتفادي لمس
 * كود يعمل فعليًا (flashcard-service.ts) بلا داعٍ.
 */
import { supabase } from "@/lib/supabase";
import { sm2, nextReviewDate, type ReviewQuality, type CardState } from "@/lib/spaced-repetition";

export const RECITATION_CARD_TYPE = "quran_recitation_segment" as const;

export type RecitationReviewItem = {
  cardId: string; // مثال: "2:255-260" (سورة:من-إلى) أو "s2:p45" لصفحة
  surahNumber: number;
  ayahFrom: number;
  ayahTo: number;
  label: string; // نص وصفي للعرض، مثال: "البقرة 255-260"
  reason: "frequent_errors" | "long_pause" | "repeated_mistake" | "similar_ayah_confusion" | "manual";
  nextReviewAt?: string;
  intervalDays?: number;
  easeFactor?: number;
  repetitions?: number;
};

function buildCardId(surahNumber: number, ayahFrom: number, ayahTo: number): string {
  return ayahFrom === ayahTo ? `${surahNumber}:${ayahFrom}` : `${surahNumber}:${ayahFrom}-${ayahTo}`;
}

/** يُضيف مقطعًا لخطة المراجعة (يُستدعى تلقائيًا بعد جلسة بها أخطاء متكررة، أو يدويًا من التقرير). */
export async function addRecitationReviewItem(
  userId: string,
  surahNumber: number,
  ayahFrom: number,
  ayahTo: number,
): Promise<void> {
  const cardId = buildCardId(surahNumber, ayahFrom, ayahTo);
  await supabase.from("flashcard_reviews").upsert(
    {
      user_id: userId,
      card_type: RECITATION_CARD_TYPE,
      card_id: cardId,
      next_review_at: new Date().toISOString(), // مستحقة فورًا (أول مرة)
      interval_days: 1,
      ease_factor: 2.5,
      repetitions: 0,
    },
    { onConflict: "user_id,card_type,card_id", ignoreDuplicates: true },
  );
}

/** يُسجّل نتيجة مراجعة مقطع (بعد إعادة تسميعه) — نفس sm2() المستخدَم للحديث/الدروس بالضبط. */
export async function submitRecitationReview(userId: string, cardId: string, quality: ReviewQuality): Promise<void> {
  const { data: existing } = await supabase
    .from("flashcard_reviews")
    .select("interval_days,ease_factor,repetitions")
    .eq("user_id", userId)
    .eq("card_type", RECITATION_CARD_TYPE)
    .eq("card_id", cardId)
    .maybeSingle();

  const state: CardState = {
    interval_days: existing?.interval_days ?? 0,
    ease_factor: existing?.ease_factor ?? 2.5,
    repetitions: existing?.repetitions ?? 0,
  };
  const next = sm2(state, quality);

  await supabase.from("flashcard_reviews").upsert(
    {
      user_id: userId,
      card_type: RECITATION_CARD_TYPE,
      card_id: cardId,
      next_review_at: nextReviewDate(next.interval_days).toISOString(),
      interval_days: next.interval_days,
      ease_factor: next.ease_factor,
      repetitions: next.repetitions,
      last_quality: quality,
      reviewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,card_type,card_id" },
  );
}

/** مقاطع التسميع المستحقة اليوم — لشاشة "مراجعة اليوم" (القسم 10). */
export async function getDueRecitationReviews(userId: string, limit = 20): Promise<RecitationReviewItem[]> {
  const { data } = await supabase
    .from("flashcard_reviews")
    .select("card_id,next_review_at,interval_days,ease_factor,repetitions")
    .eq("user_id", userId)
    .eq("card_type", RECITATION_CARD_TYPE)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })
    .limit(limit);

  return (data ?? []).map((row) => {
    const [surahStr, range] = row.card_id.split(":");
    const [fromStr, toStr] = (range ?? "").split("-");
    const surahNumber = Number(surahStr);
    const ayahFrom = Number(fromStr);
    const ayahTo = toStr ? Number(toStr) : ayahFrom;
    return {
      cardId: row.card_id,
      surahNumber,
      ayahFrom,
      ayahTo,
      label: ayahFrom === ayahTo ? `سورة ${surahNumber} آية ${ayahFrom}` : `سورة ${surahNumber} آيات ${ayahFrom}-${ayahTo}`,
      reason: "manual",
      nextReviewAt: row.next_review_at,
      intervalDays: row.interval_days,
      easeFactor: row.ease_factor,
      repetitions: row.repetitions,
    };
  });
}
