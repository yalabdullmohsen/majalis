import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BookOpen, ScrollText, Moon, Star, Scale, Building2, Landmark, Gem,
  Flame, Target, Trophy, ListChecks, Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { fetchHomeQuizStats, type HomeQuizStats } from "@/lib/quiz-performance-service";
import { getDailyChallenge, totalQuestionBankSize, type DailyChallengeQuestion } from "@/lib/quiz-daily-challenge";

const CATS = [
  { name: "القرآن الكريم",    Icon: BookOpen   },
  { name: "الحديث الشريف",   Icon: ScrollText  },
  { name: "السيرة النبوية",    Icon: Moon        },
  { name: "قصص الأنبياء",    Icon: Star        },
  { name: "الفقه",             Icon: Scale       },
  { name: "العقيدة",           Icon: Building2   },
  { name: "التاريخ الإسلامي", Icon: Landmark     },
  { name: "الأخلاق والصحابة", Icon: Gem          },
];

/**
 * إكمال المرحلة 6 (2026-07-18): إحصاءات حقيقية (لا مصطنعة) + "تحدي اليوم"
 * حتمي. عدد الأسئلة معروض هو العدد الفعلي المقيس (480) من بنك الأسئلة
 * الحالي — لا الرقم التقديري "~1800" الوارد بالمواصفة الأصلية، الذي لم
 * يطابق القياس المباشر لـ src/data/islamicQuizData.ts.
 */
export function HomeQuizCard() {
  const { isLoggedIn } = useAuth();
  const [stats, setStats] = useState<HomeQuizStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [challenge, setChallenge] = useState<DailyChallengeQuestion | null>(null);

  useEffect(() => {
    setChallenge(getDailyChallenge());
  }, []);

  useEffect(() => {
    if (!isLoggedIn) { setStatsLoading(false); return; }
    let cancelled = false;
    fetchHomeQuizStats()
      .then((s) => { if (!cancelled) setStats(s); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const totalQuestions = totalQuestionBankSize();

  return (
    <section className="ds-quiz-home-card" dir="rtl" aria-label="لعبة سؤال وجواب الإسلامية"
      style={{ position: "relative", overflow: "hidden" }}>
      {/* زخرفة هندسية خلفية */}
      <svg aria-hidden="true" style={{
        position: "absolute", top: "-20px", left: "-20px", opacity: 0.05, pointerEvents: "none",
      }} width="120" height="120" viewBox="0 0 120 120">
        <polygon points="60,5 75,40 112,40 82,62 95,97 60,75 25,97 38,62 8,40 45,40" fill="#176B57"/>
      </svg>
      <svg aria-hidden="true" style={{
        position: "absolute", bottom: "-15px", right: "-15px", opacity: 0.04, pointerEvents: "none",
      }} width="100" height="100" viewBox="0 0 100 100">
        <polygon points="50,5 63,37 97,37 71,57 81,89 50,68 19,89 29,57 3,37 37,37" fill="#176B57"/>
      </svg>
      <div className="ds-quiz-home-card__content">
        <div className="ds-quiz-home-card__text">
          <span className="ds-quiz-home-card__badge">تنافسي • جماعي</span>
          <h2 className="ds-quiz-home-card__title">لعبة سؤال وجواب الإسلامية</h2>
          <p className="ds-quiz-home-card__desc">
            اختبر معلوماتك الشرعية وتحدَّ نفسك في أسئلة متنوعة — {totalQuestions} سؤالاً
            عبر {CATS.length} فئات: القرآن والحديث والسيرة والفقه والعقيدة والتاريخ والأخلاق
          </p>
          <Link href="/quiz" className="ds-quiz-home-card__btn">ابدأ اللعبة</Link>
        </div>

        {/* إحصاءات حقيقية — لتسجيلي الدخول فقط، من quiz_attempts الحي */}
        {isLoggedIn && (
          <div className="ds-quiz-home-card__stats" aria-label="إحصاءاتي في اللعبة">
            {statsLoading ? (
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

        {/* تحدي اليوم — نفس السؤال لكل المستخدمين طوال اليوم، اختيار حتمي بلا توليد جديد */}
        {challenge && (
          <Link href="/quiz" className="ds-quiz-home-card__challenge">
            <span className="ds-quiz-home-card__challenge-badge">
              <Sparkles size={13} aria-hidden="true" /> تحدي اليوم
            </span>
            <span className="ds-quiz-home-card__challenge-cat">{challenge.categoryName} · {challenge.points} نقطة</span>
            <span className="ds-quiz-home-card__challenge-q">{challenge.question.q}</span>
          </Link>
        )}

        <div className="ds-quiz-home-card__grid" aria-hidden="true">
          {CATS.map(({ name, Icon }) => (
            <div key={name} className="ds-quiz-home-card__cat">
              <Icon size={15} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
