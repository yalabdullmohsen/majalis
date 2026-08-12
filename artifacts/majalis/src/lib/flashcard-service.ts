import { supabase } from "@/lib/supabase";
import {
  applyReviewRating,
  type ReviewQuality,
  type ReviewRating,
} from "@/lib/spaced-repetition";
import {
  listDueLocalReviews,
  listDirtyReviews,
  localFlashStats,
  markReviewClean,
  saveLocalReview,
  type LocalFlashReview,
} from "@/lib/flashcard-local-store";
import { isOnline } from "@/lib/offline-db";

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

type HadithRow = {
  id: string;
  text: string;
  narrator?: string;
  source_name?: string;
  collection?: string;
  grade?: string;
};

function hadithToCard(
  h: HadithRow,
  review: null | {
    next_review_at: string;
    interval_days: number;
    ease_factor: number;
    repetitions: number;
  },
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

async function fetchHadithsByIds(ids: string[]): Promise<Map<string, HadithRow>> {
  if (!ids.length) return new Map();
  const { data } = await supabase
    .from("verified_hadith_items")
    .select("id,text,narrator,source_name,collection,grade")
    .in("id", ids);
  return new Map((data ?? []).map((h: HadithRow) => [h.id, h]));
}

// ─── Fetch due cards ─────────────────────────────────────────────────────────

export async function getDueFlashCards(userId: string, limit = 20): Promise<FlashCard[]> {
  // Always merge local due reviews (works offline)
  const localDue = await listDueLocalReviews(userId, limit);
  const cards: FlashCard[] = [];

  if (isOnline()) {
    try {
      const { data: reviews } = await supabase
        .from("flashcard_reviews")
        .select("card_type,card_id,next_review_at,interval_days,ease_factor,repetitions")
        .eq("user_id", userId)
        .lte("next_review_at", new Date().toISOString())
        .order("next_review_at", { ascending: true })
        .limit(limit);

      const dueReviews = reviews ?? [];
      const reviewedIds = dueReviews
        .filter((r: { card_type: string }) => r.card_type === "hadith")
        .map((r: { card_id: string }) => r.card_id);

      const { data: hadiths } = await supabase
        .from("verified_hadith_items")
        .select("id,text,narrator,source_name,collection,grade")
        .eq("verification_status", "verified")
        .not("id", "in", reviewedIds.length ? `(${reviewedIds.join(",")})` : "(null)")
        .limit(Math.max(0, limit - dueReviews.length));

      const dueHadithReviews = dueReviews.filter((r: { card_type: string }) => r.card_type === "hadith");
      const dueHadithIds = [...new Set(dueHadithReviews.map((r: { card_id: string }) => r.card_id))];
      const byId = await fetchHadithsByIds(dueHadithIds);

      for (const r of dueHadithReviews) {
        const h = byId.get(r.card_id as string);
        if (h) cards.push(hadithToCard(h, r as LocalFlashReview));
      }
      for (const h of hadiths ?? []) {
        cards.push(hadithToCard(h as HadithRow, null));
      }

      // Persist remote due states locally for offline continuity
      for (const r of dueReviews) {
        await saveLocalReview({
          key: `${userId}::${r.card_type}:${r.card_id}`,
          user_id: userId,
          card_type: r.card_type,
          card_id: r.card_id,
          next_review_at: r.next_review_at,
          interval_days: r.interval_days,
          ease_factor: r.ease_factor,
          repetitions: r.repetitions,
          last_quality: 4,
          reviewed_at: new Date().toISOString(),
          dirty: false,
        });
      }

      if (cards.length) return cards.slice(0, limit);
    } catch {
      /* fall through to local */
    }
  }

  // Offline / failed network: rebuild from local review keys (placeholder fronts)
  for (const r of localDue) {
    if (r.card_type !== "hadith") continue;
    cards.push({
      id: `${r.card_type}:${r.card_id}`,
      card_type: "hadith",
      card_id: r.card_id,
      front: "بطاقة محفوظة للمراجعة دون اتصال — ستظهر التفاصيل عند الاتصال.",
      back: "أُعيدت مزامنتها من جهازك",
      category: "دون اتصال",
      next_review_at: r.next_review_at,
      interval_days: r.interval_days,
      ease_factor: r.ease_factor,
      repetitions: r.repetitions,
    });
  }
  return cards.slice(0, limit);
}

// ─── Submit review ─────────────────────────────────────────────────────────────

export async function submitCardReview(
  userId: string,
  card: FlashCard,
  quality: ReviewQuality | ReviewRating,
): Promise<void> {
  const metrics = applyReviewRating(
    {
      easeFactor: card.ease_factor ?? 2.5,
      interval: card.interval_days ?? 0,
      repetitions: card.repetitions ?? 0,
      nextReviewDate: card.next_review_at ?? new Date().toISOString(),
    },
    quality,
  );

  const q: ReviewQuality = typeof quality === "number" ? quality : (
    { again: 0, hard: 3, good: 4, easy: 5 } as const
  )[quality];

  const localRow: LocalFlashReview = {
    key: `${userId}::${card.card_type}:${card.card_id}`,
    user_id: userId,
    card_type: card.card_type,
    card_id: card.card_id,
    next_review_at: metrics.nextReviewDate,
    interval_days: metrics.interval,
    ease_factor: metrics.easeFactor,
    repetitions: metrics.repetitions,
    last_quality: q,
    reviewed_at: new Date().toISOString(),
    dirty: true,
  };

  // Always persist locally first (offline-safe)
  await saveLocalReview(localRow);

  try {
    const { enqueueOutbox } = await import("@/lib/sync-outbox");
    await enqueueOutbox("flashcard_review", `${userId}::${card.card_type}:${card.card_id}`, {
      user_id: userId,
      card_type: card.card_type,
      card_id: card.card_id,
      next_review_at: metrics.nextReviewDate,
      interval_days: metrics.interval,
      ease_factor: metrics.easeFactor,
      repetitions: metrics.repetitions,
      last_quality: q,
      reviewed_at: localRow.reviewed_at,
    });
  } catch {
    /* outbox optional */
  }

  if (!isOnline()) return;

  try {
    await supabase.from("flashcard_reviews").upsert(
      {
        user_id: userId,
        card_type: card.card_type,
        card_id: card.card_id,
        next_review_at: metrics.nextReviewDate,
        interval_days: metrics.interval,
        ease_factor: metrics.easeFactor,
        repetitions: metrics.repetitions,
        last_quality: q,
        reviewed_at: localRow.reviewed_at,
      },
      { onConflict: "user_id,card_type,card_id" },
    );
    await markReviewClean(localRow);
  } catch {
    /* stays dirty for later sync */
  }
}

/** Push dirty local reviews to Supabase when back online. */
export async function syncDirtyFlashcardReviews(userId: string): Promise<number> {
  if (!isOnline()) return 0;
  const dirty = await listDirtyReviews(userId);
  let synced = 0;
  for (const row of dirty) {
    try {
      await supabase.from("flashcard_reviews").upsert(
        {
          user_id: row.user_id,
          card_type: row.card_type,
          card_id: row.card_id,
          next_review_at: row.next_review_at,
          interval_days: row.interval_days,
          ease_factor: row.ease_factor,
          repetitions: row.repetitions,
          last_quality: row.last_quality,
          reviewed_at: row.reviewed_at,
        },
        { onConflict: "user_id,card_type,card_id" },
      );
      await markReviewClean(row);
      synced += 1;
    } catch {
      /* keep dirty */
    }
  }
  return synced;
}

/** Register LWW outbox handler once (idempotent). */
let outboxRegistered = false;
export function ensureFlashcardOutboxHandler(): void {
  if (outboxRegistered) return;
  outboxRegistered = true;
  void import("@/lib/sync-outbox").then(({ registerOutboxHandler }) => {
    registerOutboxHandler("flashcard_review", async (item) => {
      const p = item.payload;
      try {
        await supabase.from("flashcard_reviews").upsert(
          {
            user_id: String(p.user_id || ""),
            card_type: String(p.card_type || ""),
            card_id: String(p.card_id || ""),
            next_review_at: String(p.next_review_at || ""),
            interval_days: Number(p.interval_days || 0),
            ease_factor: Number(p.ease_factor || 2.5),
            repetitions: Number(p.repetitions || 0),
            last_quality: p.last_quality as ReviewQuality,
            reviewed_at: String(p.reviewed_at || item.updatedAt),
          },
          { onConflict: "user_id,card_type,card_id" },
        );
        const row: LocalFlashReview = {
          key: String(p.card_type) + ":" + String(p.card_id),
          user_id: String(p.user_id || ""),
          card_type: String(p.card_type || ""),
          card_id: String(p.card_id || ""),
          next_review_at: String(p.next_review_at || ""),
          interval_days: Number(p.interval_days || 0),
          ease_factor: Number(p.ease_factor || 2.5),
          repetitions: Number(p.repetitions || 0),
          last_quality: (p.last_quality as ReviewQuality) || 3,
          reviewed_at: String(p.reviewed_at || item.updatedAt),
          dirty: true,
        };
        await markReviewClean(row);
        return true;
      } catch {
        return false;
      }
    });
  });
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

export type FlashCardStats = {
  totalReviewed: number;
  dueToday: number;
  masteredCount: number; // interval > 21 days
};

export async function getFlashCardStats(userId: string): Promise<FlashCardStats> {
  const local = localFlashStats(userId);

  if (!isOnline()) return local;

  try {
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
      totalReviewed: Math.max(totalRes.count ?? 0, local.totalReviewed),
      dueToday: Math.max(dueRes.count ?? 0, local.dueToday),
      masteredCount: Math.max(masteredRes.count ?? 0, local.masteredCount),
    };
  } catch {
    return local;
  }
}
