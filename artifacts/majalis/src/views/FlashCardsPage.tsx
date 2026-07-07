import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/ui-common";
import {
  getDueFlashCards,
  submitCardReview,
  getFlashCardStats,
  type FlashCard,
  type FlashCardStats,
} from "@/lib/flashcard-service";
import { QUALITY_OPTIONS, type ReviewQuality } from "@/lib/spaced-repetition";

// ─── Card face ────────────────────────────────────────────────────────────────

function CardFace({
  card,
  flipped,
  onFlip,
}: {
  card: FlashCard;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div
      className={`fc-card${flipped ? " fc-card--flipped" : ""}`}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onFlip()}
      aria-label={flipped ? "انقر لرؤية الوجه" : "انقر لرؤية الإجابة"}
    >
      <div className="fc-card__inner">
        <div className="fc-card__front">
          <span className="fc-card__label">📿 الحديث</span>
          <p className="fc-card__text" dir="rtl">
            {card.front}
          </p>
          <span className="fc-card__hint">اضغط للكشف ←</span>
        </div>
        <div className="fc-card__back">
          <span className="fc-card__label">📖 المصدر</span>
          <p className="fc-card__text fc-card__text--back" dir="rtl">
            {card.back}
          </p>
          {card.category && (
            <span className="fc-card__category">{card.category}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quality buttons ──────────────────────────────────────────────────────────

function QualityBar({
  onRate,
}: {
  onRate: (q: ReviewQuality) => void;
}) {
  return (
    <div className="fc-quality">
      <p className="fc-quality__label">كيف كان مستوى تذكّرك؟</p>
      <div className="fc-quality__buttons">
        {QUALITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="fc-quality__btn"
            style={{ borderColor: opt.color, color: opt.color }}
            onClick={() => onRate(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Session complete ─────────────────────────────────────────────────────────

function SessionComplete({
  reviewed,
  onRestart,
}: {
  reviewed: number;
  onRestart: () => void;
}) {
  return (
    <div className="fc-complete">
      <div className="fc-complete__icon">🎉</div>
      <h2 className="fc-complete__title">انتهت جلسة المراجعة!</h2>
      <p className="fc-complete__sub">راجعت {reviewed} بطاقة اليوم — أحسنت!</p>
      <div className="fc-complete__actions">
        <button type="button" className="fc-complete__btn fc-complete__btn--primary" onClick={onRestart}>
          ↺ مراجعة مجدداً
        </button>
        <Link href="/learning-plan" className="fc-complete__btn">
          خطتي العلمية
        </Link>
        <Link href="/profile" className="fc-complete__btn">
          ملفي الشخصي
        </Link>
      </div>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: FlashCardStats }) {
  return (
    <div className="fc-stats">
      <div className="fc-stats__item">
        <strong>{stats.dueToday}</strong>
        <span>مستحقة اليوم</span>
      </div>
      <div className="fc-stats__item">
        <strong>{stats.totalReviewed}</strong>
        <span>إجمالي المراجَعة</span>
      </div>
      <div className="fc-stats__item">
        <strong>{stats.masteredCount}</strong>
        <span>بطاقة مُتقَنة</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FlashCardsPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [stats, setStats] = useState<FlashCardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionDone, setSessionDone] = useState(false);

  const loadCards = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setSessionDone(false);
    setCurrentIdx(0);
    setFlipped(false);
    setReviewedCount(0);
    try {
      const [newCards, newStats] = await Promise.all([
        getDueFlashCards(user.id, 20),
        getFlashCardStats(user.id),
      ]);
      setCards(newCards);
      setStats(newStats);
      if (newCards.length === 0) setSessionDone(true);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoggedIn && user?.id) loadCards();
    else if (!authLoading) setLoading(false);
  }, [isLoggedIn, user?.id, authLoading, loadCards]);

  const handleRate = async (quality: ReviewQuality) => {
    if (!user?.id || !cards[currentIdx]) return;
    await submitCardReview(user.id, cards[currentIdx], quality);
    setReviewedCount((n) => n + 1);
    const next = currentIdx + 1;
    if (next >= cards.length) {
      setSessionDone(true);
      // Refresh stats
      getFlashCardStats(user.id).then(setStats).catch(() => {});
    } else {
      setCurrentIdx(next);
      setFlipped(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="page-shell narrow" dir="rtl">
        <div className="profile-loading">
          <span className="profile-loading__dot" />
          <span className="profile-loading__dot" />
          <span className="profile-loading__dot" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="page-shell narrow" dir="rtl" style={{ textAlign: "center", paddingTop: "3rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
        <p style={{ color: "var(--majalis-ink-soft)", marginBottom: "1rem" }}>
          سجّل الدخول للوصول إلى بطاقات المراجعة.
        </p>
        <Link href="/login?next=/flashcards" className="ui-card-btn">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const currentCard = cards[currentIdx];
  const progress = cards.length > 0 ? Math.round((currentIdx / cards.length) * 100) : 0;

  return (
    <div className="page-shell narrow fc-page" dir="rtl">
      <PageHeader
        eyebrow="التعلّم الذكي"
        title="📇 بطاقات المراجعة"
        subtitle="راجع الأحاديث الموثّقة بأسلوب التكرار المتباعد، كل يوم بضع دقائق تُرسّخ العلم."
      />

      {stats && <StatsBar stats={stats} />}

      {sessionDone ? (
        <SessionComplete reviewed={reviewedCount} onRestart={loadCards} />
      ) : currentCard ? (
        <div className="fc-session">
          {/* Progress */}
          <div className="fc-progress">
            <div className="fc-progress__bar">
              <div className="fc-progress__fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="fc-progress__text">{currentIdx + 1} / {cards.length}</span>
          </div>

          <CardFace
            card={currentCard}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
          />

          {flipped && <QualityBar onRate={handleRate} />}

          {!flipped && (
            <p className="fc-flip-hint">اضغط على البطاقة للكشف عن المصدر</p>
          )}
        </div>
      ) : (
        <div className="fc-empty">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <p>لا توجد بطاقات مستحقة الآن. تفقّد لاحقاً!</p>
          <Link href="/learning-plan" className="lp-plan__action-btn lp-plan__action-btn--primary" style={{ marginTop: "1.5rem", display: "inline-block" }}>
            خطتي العلمية
          </Link>
        </div>
      )}
    </div>
  );
}
