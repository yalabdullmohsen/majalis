import { supabase } from "@/lib/supabase";
import { sm2, nextReviewDate, type ReviewQuality, type CardState } from "@/lib/spaced-repetition";

// ─── Card type ─────────────────────────────────────────────────────────────────

export type FlashCard = {
  id: string;          // card_type:card_id
  card_type: "hadith" | "lesson";
  card_id: string;
  front: string;       // ما يظهر أمام المستخدم
  back: string;        // الإجابة / المصدر
  hint?: string;
  category?: string;
  // review state (null = لم يُراجَع بعد)
  next_review_at?: string;
  interval_days?: number;
  ease_factor?: number;
  repetitions?: number;
};

// ─── Fetch due cards ─────────────────────────────────────────────────────────

export async function getDueFlashCards(userId: string, limit = 20): Promise<FlashCard[]> {
  // 1. Get user's review states for cards that are due
  const { data: reviews } = await supabase
    .from("flashcard_reviews")
    .select("card_type,card_id,next_review_at,interval_days,ease_factor,repetitions")
    .eq("user_id", userId)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })
    .limit(limit);

  const dueReviews = reviews ?? [];

  // 2. Get new hadith cards (not yet reviewed by this user)
  const reviewedIds = dueReviews
    .filter((r: any) => r.card_type === "hadith")
    .map((r: any) => r.card_id);

  const { data: hadiths } = await supabase
    .from("verified_hadith_items")
    .select("id,text,narrator,source_name,collection,grade")
    .eq("verification_status", "verified")
    .not("id", "in", reviewedIds.length ? `(${reviewedIds.join(",")})` : "(null)")
    .limit(Math.max(0, limit - dueReviews.length));

  const cards: FlashCard[] = [];

  // Map due reviews → cards (fetch source content)
  for (const r of dueReviews) {
    if (r.card_type === "hadith") {
      const { data: h } = await supabase
        .from("verified_hadith_items")
        .select("id,text,narrator,source_name,collection,grade")
        .eq("id", r.card_id)
        .maybeSingle();
      if (h) {
        cards.push(hadithToCard(h as any, r as any));
      }
    }
  }

  // New hadith cards (first time)
  for (const h of hadiths ?? []) {
    cards.push(hadithToCard(h as any, null));
  }

  return cards.slice(0, limit);
}

function hadithToCard(
  h: { id: string; text: string; narrator?: string; source_name?: string; collection?: string; grade?: string },
  review: null | { next_review_at: string; interval_days: number; ease_factor: number; repetitions: number },
): FlashCard {
  const back = [
    h.narrator ? `رواه: ${h.narrator}` : null,
    h.source_name ? `المصدر: ${h.source_name}` : null,
    h.collection ? `المجموعة: ${h.collection}` : null,
    h.grade ? `الدرجة: ${h.grade}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return {
    id: `hadith:${h.id}`,
    card_type: "hadith",
    card_id: h.id,
    front: h.text,
    back: back || "حديث موثّق",
    category: h.collection ?? "الحديث",
    next_review_at: review?.next_review_at,
    interval_days: review?.interval_days,
    ease_factor: review?.ease_factor,
    repetitions: review?.repetitions,
  };
}

// ─── Submit review ─────────────────────────────────────────────────────────────

export async function submitCardReview(
  userId: string,
  card: FlashCard,
  quality: ReviewQuality,
): Promise<void> {
  const state: CardState = {
    interval_days: card.interval_days ?? 0,
    ease_factor: card.ease_factor ?? 2.5,
    repetitions: card.repetitions ?? 0,
  };

  const next = sm2(state, quality);
  const nextDate = nextReviewDate(next.interval_days);

  await supabase.from("flashcard_reviews").upsert(
    {
      user_id: userId,
      card_type: card.card_type,
      card_id: card.card_id,
      next_review_at: nextDate.toISOString(),
      interval_days: next.interval_days,
      ease_factor: next.ease_factor,
      repetitions: next.repetitions,
      last_quality: quality,
      reviewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,card_type,card_id" },
  );
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

export type FlashCardStats = {
  totalReviewed: number;
  dueToday: number;
  masteredCount: number; // interval > 21 days
};

export async function getFlashCardStats(userId: string): Promise<FlashCardStats> {
  const [totalRes, dueRes, masteredRes] = await Promise.all([
    supabase
      .from("flashcard_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("flashcard_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("next_review_at", new Date().toISOString()),
    supabase
      .from("flashcard_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("interval_days", 21),
  ]);

  return {
    totalReviewed: totalRes.count ?? 0,
    dueToday: dueRes.count ?? 0,
    masteredCount: masteredRes.count ?? 0,
  };
}
