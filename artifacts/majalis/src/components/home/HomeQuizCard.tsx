import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Flame, Target, Trophy, ListChecks, Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { fetchHomeQuizStats, type HomeQuizStats } from "@/lib/quiz-performance-service";
import { getDailyChallenge, type DailyChallengeQuestion } from "@/lib/quiz-daily-challenge";
import { getPublishedQuestionCount } from "@/data/quiz-bank";
import { GAME_CATEGORIES } from "@/data/islamicQuizData";

/**
 * بطاقة الرئيسية — تحدي الأسئلة
 */
export function HomeQuizCard() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<HomeQuizStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [challenge, setChallenge] = useState<DailyChallengeQuestion | null>(null);

  useEffect(() => {
    setChallenge(getDailyChallenge());
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      setStats(null);
      setStatsLoading(false);
      return;
    }
    let cancelled = false;
    setStatsLoading(true);
    fetchHomeQuizStats()
      .then((s) => { if (!cancelled) setStats(s); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, [authLoading, isLoggedIn]);

  const publishedLocal = getPublishedQuestionCount();

  return (
    <section className="ds-quiz-home-card" dir="rtl" aria-label="تحدي الأسئلة"
      style={{ position: "relative", overflow: "hidden" }}>
      <div className="ds-quiz-home-card__content">
        <div className="ds-quiz-home-card__text">
          <span className="ds-quiz-home-card__badge">تحدي سُنّة</span>
          <h2 className="ds-quiz-home-card__title">تحدي الأسئلة</h2>
          <p className="ds-quiz-home-card__desc">
            اختبر معلوماتك في العلوم الشرعية واللغة العربية من خلال أسئلة متنوعة وموثقة
            {publishedLocal > 0
              ? ` — ${publishedLocal} سؤالًا منشورًا عبر ${GAME_CATEGORIES.length} فئة.`
              : "."}
          </p>
          <Link href="/quiz" className="ds-quiz-home-card__btn">ابدأ التحدي</Link>
        </div>

        {(authLoading || isLoggedIn) && (
          <div className="ds-quiz-home-card__stats" aria-label="إحصاءاتي في التحدي" aria-busy={authLoading || statsLoading}>
            {authLoading || statsLoading ? (
              <div className="ds-quiz-home-card__stats-skel" aria-hidden="true" />
            ) : !stats || stats.totalAttempts === 0 ? (
              <p className="ds-quiz-home-card__stats-empty">العب أول جولة لتبدأ إحصاءاتك بالظهور هنا.</p>
            ) : (
              <>
                <div className="ds-quiz-home-card__stat">
                  <Target size={14} aria-hidden="true" />
                  <strong>{stats.overallAccuracy}%</strong>
                  <span>نسبة الصحيح</span>
                </div>
                {stats.lastDayAccuracy !== null && (
                  <div className="ds-quiz-home-card__stat">
                    <ListChecks size={14} aria-hidden="true" />
                    <strong>{stats.lastDayAccuracy}%</strong>
                    <span>آخر نتيجة</span>
                  </div>
                )}
                {stats.bestDayAccuracy !== null && (
                  <div className="ds-quiz-home-card__stat">
                    <Trophy size={14} aria-hidden="true" />
                    <strong>{stats.bestDayAccuracy}%</strong>
                    <span>أفضل نتيجة</span>
                  </div>
                )}
                {stats.dayStreak > 0 && (
                  <div className="ds-quiz-home-card__stat">
                    <Flame size={14} aria-hidden="true" />
                    <strong>{stats.dayStreak}</strong>
                    <span>يوم متتالٍ</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {challenge && (
          <Link href="/quiz" className="ds-quiz-home-card__challenge">
            <span className="ds-quiz-home-card__challenge-badge">
              <Sparkles size={13} aria-hidden="true" /> تحدي اليوم
            </span>
            <span className="ds-quiz-home-card__challenge-cat">{challenge.categoryName} · {challenge.points} نقطة</span>
            <span className="ds-quiz-home-card__challenge-q">{challenge.question.q}</span>
          </Link>
        )}
      </div>
    </section>
  );
}
