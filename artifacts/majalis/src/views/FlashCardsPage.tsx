import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, CheckCircle2, Lock, PartyPopper, RotateCw,
  Layers, Trophy, CalendarCheck,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { ShareButtons } from "@/components/ContentActions";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import {
  getDueFlashCards,
  submitCardReview,
  getFlashCardStats,
  type FlashCard,
  type FlashCardStats,
} from "@/lib/flashcard-service";
import {
  QUALITY_OPTIONS,
  sm2,
  type ReviewQuality,
  type CardState,
} from "@/lib/spaced-repetition";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

// ── Helpers ───────────────────────────────────────────────────────────────────

function previewDays(card: FlashCard, quality: ReviewQuality): number {
  const state: CardState = {
    interval_days: card.interval_days ?? 0,
    ease_factor:   card.ease_factor   ?? 2.5,
    repetitions:   card.repetitions   ?? 0,
  };
  return sm2(state, quality).interval_days;
}

function daysLabel(d: number): string {
  if (d <= 1) return "غداً";
  if (d < 7)  return `${d} أيام`;
  if (d < 30) return `${Math.round(d / 7)} أسبوع`;
  return `${Math.round(d / 30)} شهر`;
}

// ── Ring Progress ─────────────────────────────────────────────────────────────

function RingProgress({ current, total }: { current: number; total: number }) {
  const r    = 28;
  const circ = 2 * Math.PI * r;
  const pct  = total > 0 ? current / total : 0;
  const off  = circ - pct * circ;
  return (
    <div className="fc-ring" aria-label={`${current} من ${total}`}>
      <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
        <circle cx="34" cy="34" r={r} strokeWidth="5" className="fc-ring__track" fill="none" />
        <circle
          cx="34" cy="34" r={r} strokeWidth="5" className="fc-ring__fill" fill="none"
          strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round"
          transform="rotate(-90 34 34)"
          style={{ transition: "stroke-dashoffset .4s ease" }}
        />
      </svg>
      <div className="fc-ring__label">
        <span className="fc-ring__cur">{current}</span>
        <span className="fc-ring__sep">/</span>
        <span className="fc-ring__tot">{total}</span>
      </div>
    </div>
  );
}

// ── Card Face ─────────────────────────────────────────────────────────────────

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
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onFlip()}
      aria-label={flipped ? "انقر لرؤية الوجه" : "انقر لرؤية الإجابة"}
    >
      <div className="fc-card__inner">
        {/* وجه البطاقة */}
        <div className="fc-card__front">
          <div className="fc-card__top-row">
            <span className="fc-card__label">
              <RotateCw size={12} strokeWidth={2} aria-hidden="true" /> الحديث
            </span>
            {card.category && (
              <span className="fc-card__cat-badge">{card.category}</span>
            )}
          </div>
          <p className="fc-card__text" dir="rtl">{card.front}</p>
          {card.hint && (
            <p className="fc-card__hint-text">{card.hint}</p>
          )}
          <span className="fc-card__hint">
            اضغط للكشف <kbd className="fc-kbd">Space</kbd>
          </span>
        </div>
        {/* ظهر البطاقة */}
        <div className="fc-card__back">
          <div className="fc-card__top-row">
            <span className="fc-card__label">
              <BookOpen size={12} strokeWidth={2} aria-hidden="true" /> المصدر
            </span>
            {card.category && (
              <span className="fc-card__cat-badge">{card.category}</span>
            )}
          </div>
          <p className="fc-card__text fc-card__text--back" dir="rtl">{card.back}</p>
        </div>
      </div>
    </div>
  );
}

// ── Quality Bar ───────────────────────────────────────────────────────────────

const FC_Q_MOD: Record<number, string> = {
  0: "fc-q--0",
  2: "fc-q--2",
  4: "fc-q--4",
  5: "fc-q--5",
};

const KEY_LABELS: Record<number, string> = { 0: "1", 2: "2", 4: "3", 5: "4" };

function QualityBar({
  card,
  onRate,
}: {
  card: FlashCard;
  onRate: (q: ReviewQuality) => void;
}) {
  return (
    <div className="fc-quality">
      <p className="fc-quality__label">كيف كان مستوى تذكّرك؟</p>
      <div className="fc-quality__buttons">
        {QUALITY_OPTIONS.map((opt) => {
          const days = previewDays(card, opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              className={`fc-quality__btn ${FC_Q_MOD[opt.value] ?? ""}`}
              onClick={() => onRate(opt.value)}
            >
              <span className="fc-q__main">{opt.label}</span>
              <span className="fc-q__meta">
                <kbd className="fc-kbd">{KEY_LABELS[opt.value]}</kbd>
                <span className="fc-q__days">{daysLabel(days)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Session Complete ──────────────────────────────────────────────────────────

function SessionComplete({
  reviewed,
  onRestart,
}: {
  reviewed: number;
  onRestart: () => void;
}) {
  return (
    <div className="fc-complete">
      <div className="fc-complete__icon">
        <PartyPopper size={44} strokeWidth={1.3} />
      </div>
      <h2 className="fc-complete__title">انتهت جلسة المراجعة!</h2>
      <p className="fc-complete__sub">راجعت <strong>{reviewed}</strong> بطاقة اليوم، أحسنت!</p>
      <div className="fc-complete__actions">
        <button
          type="button"
          className="fc-complete__btn fc-complete__btn--primary"
          onClick={onRestart}
        >
          ↺ مراجعة مجدداً
        </button>
        <Link href="/learning-plan" className="fc-complete__btn">خطتي العلمية</Link>
        <Link href="/my-learning"   className="fc-complete__btn">حسابي التعليمي</Link>
      </div>
    </div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: FlashCardStats }) {
  return (
    <div className="fc-stats">
      <div className="fc-stats__item">
        <CalendarCheck size={16} strokeWidth={1.6} className="fc-stats__icon" aria-hidden="true" />
        <strong>{stats.dueToday}</strong>
        <span>مستحقة اليوم</span>
      </div>
      <div className="fc-stats__item">
        <Layers size={16} strokeWidth={1.6} className="fc-stats__icon" aria-hidden="true" />
        <strong>{stats.totalReviewed}</strong>
        <span>مجموع المراجَعة</span>
      </div>
      <div className="fc-stats__item">
        <Trophy size={16} strokeWidth={1.6} className="fc-stats__icon" aria-hidden="true" />
        <strong>{stats.masteredCount}</strong>
        <span>بطاقة مُتقَنة</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FlashCardsPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [cards,         setCards]        = useState<FlashCard[]>([]);
  const [currentIdx,    setCurrentIdx]   = useState(0);
  const [flipped,       setFlipped]      = useState(false);
  const [reviewedCount, setReviewedCount]= useState(0);
  const [stats,         setStats]        = useState<FlashCardStats | null>(null);
  const [loading,       setLoading]      = useState(true);
  const [sessionDone,   setSessionDone]  = useState(false);

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

  const handleRate = useCallback(async (quality: ReviewQuality) => {
    if (!user?.id || !cards[currentIdx]) return;
    await submitCardReview(user.id, cards[currentIdx], quality);
    setReviewedCount((n) => n + 1);
    const next = currentIdx + 1;
    if (next >= cards.length) {
      setSessionDone(true);
      getFlashCardStats(user.id).then(setStats).catch(() => {});
    } else {
      setCurrentIdx(next);
      setFlipped(false);
    }
  }, [user?.id, cards, currentIdx]);

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (sessionDone || loading) return;
      if ((e.code === "Space" || e.key === " ") && !flipped) {
        e.preventDefault();
        setFlipped(true);
        return;
      }
      if (flipped) {
        if (e.key === "1") handleRate(0);
        if (e.key === "2") handleRate(2);
        if (e.key === "3") handleRate(4);
        if (e.key === "4") handleRate(5);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, sessionDone, loading, handleRate]);

  useEffect(() => {
    applyPageSeo({
      path: "/flashcards",
      title: "بطاقات المراجعة التعليمية | المجلس العلمي",
      description: "بطاقات مراجعة تعتمد نظام التكرار المتباعد لتثبيت المعلومات الشرعية في الذاكرة، مثالية لطلاب العلم.",
      keywords: ["بطاقات مراجعة", "تعلم", "مراجعة شرعية", "حفظ", "تكرار متباعد"],
      robots: "noindex, follow",
    });
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.id) loadCards();
    else if (!authLoading) setLoading(false);
  }, [isLoggedIn, user?.id, authLoading, loadCards]);

  // حالة التحميل
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

  // غير مسجّل
  if (!isLoggedIn) {
    return (
      <div className="page-shell narrow flc-login-prompt" dir="rtl">
        <div className="flc-login-icon"><Lock size={40} strokeWidth={1.3} /></div>
        <p className="flc-login-msg">سجّل الدخول للوصول إلى بطاقات المراجعة.</p>
        <Link href="/login?next=/flashcards" className="ui-card-btn">تسجيل الدخول</Link>
      </div>
    );
  }

  const currentCard = cards[currentIdx];

  return (
    <div className="page-shell narrow fc-page" dir="rtl">
      <PageHeader
        eyebrow="التعلّم الذكي"
        title="بطاقات المراجعة"
        subtitle="راجع الأحاديث الموثّقة بأسلوب التكرار المتباعد، كل يوم بضع دقائق تُرسّخ العلم."
      />

      {stats && <StatsBar stats={stats} />}

      {sessionDone ? (
        <SessionComplete reviewed={reviewedCount} onRestart={loadCards} />
      ) : currentCard ? (
        <div className="fc-session">
          {/* حلقة التقدم الدائرية */}
          <div className="fc-session__top">
            <RingProgress current={currentIdx + 1} total={cards.length} />
            <p className="fc-kbd-hint">
              <kbd className="fc-kbd">Space</kbd> قلب · <kbd className="fc-kbd">1</kbd>–<kbd className="fc-kbd">4</kbd> تقييم
            </p>
          </div>

          <CardFace
            card={currentCard}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
          />

          {flipped
            ? <QualityBar card={currentCard} onRate={handleRate} />
            : <p className="fc-flip-hint">اضغط على البطاقة أو اضغط <kbd className="fc-kbd">Space</kbd> للكشف</p>
          }
        </div>
      ) : (
        <div className="fc-empty">
          <div className="flc-empty-icon"><CheckCircle2 size={48} strokeWidth={1.4} aria-hidden="true" /></div>
          <p>لا توجد بطاقات مستحقة الآن. تفقّد لاحقاً!</p>
          <Link href="/learning-plan" className="lp-plan__action-btn lp-plan__action-btn--primary flc-empty-link">
            خطتي العلمية
          </Link>
        </div>
      )}

      <div className="twh-share">
        <ShareButtons title="البطاقات التعليمية الإسلامية — المجلس العلمي" url="https://majlisilm.com/flashcards" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["quran", "hadith", "fiqh"]} title="اختبر معلوماتك في العلوم الشرعية" count={4} />
      </div>
    </div>
  );
}
