import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { ChevronRight, ChevronLeft, BookOpen, Lightbulb } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ARBAEEN_NAWAWI } from "@/lib/arbaeen-nawawi-seed";
import { generateAllQuestionsForHadith } from "@/lib/arbaeen-quiz";
import { isMcqAnswerCorrect } from "@/lib/answer-grading";
import {
  fetchArbaeenReviewStates, submitArbaeenReview, masteryLevel,
  type ArbaeenReviewState,
} from "@/lib/arbaeen-review-service";
import { QUALITY_OPTIONS, type ReviewQuality } from "@/lib/spaced-repetition";
import { useAuth } from "@/components/AuthProvider";
import "@/styles/pages/arbaeen-detail.css";

/**
 * صفحة تعلّم كاملة لحديث واحد من الأربعين النووية (المرحلة 11) — نص/شرح/فائدة/
 * مصدر، ثم "اختبر نفسك" (أنواع أسئلة من src/lib/arbaeen-quiz.ts، كلها مُشتقّة من
 * نفس نص الحديث المعتمد)، وفي النهاية تقييم SM-2 حقيقي (src/lib/
 * arbaeen-review-service.ts) يحدّث جدول flashcard_reviews الفعلي.
 */
export default function ArbaeenHadithDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, isLoggedIn } = useAuth();
  const hadithId = Math.min(42, Math.max(1, Number(params.id) || 1));
  const hadith = ARBAEEN_NAWAWI.find((h) => h.id === hadithId) ?? ARBAEEN_NAWAWI[0];

  const [reviewState, setReviewState] = useState<ArbaeenReviewState | undefined>(undefined);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [quizDone, setQuizDone] = useState(false);
  const [savingReview, setSavingReview] = useState(false);

  const questions = useMemo(() => generateAllQuestionsForHadith(hadith), [hadith]);

  useEffect(() => {
    applyPageSeo({
      path: `/arbaeen-nawawi/${hadith.id}`,
      title: `${hadith.title} — الحديث ${hadith.id} من الأربعين النووية | المجلس العلمي`,
      description: `${hadith.title}: نص الحديث وشرحه وفوائده مع اختبار تفاعلي لمراجعته — الحديث ${hadith.id} من الأربعين النووية.`,
      keywords: ["الأربعون النووية", hadith.title, "شرح حديث", "اختبار حديث"],
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: hadith.title,
        articleSection: "الأربعون النووية",
        position: hadith.id,
        url: `https://www.majlisilm.com/arbaeen-nawawi/${hadith.id}`,
        inLanguage: "ar",
      }],
    });
  }, [hadith]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    let cancelled = false;
    fetchArbaeenReviewStates(user.id).then((states) => {
      if (!cancelled) setReviewState(states.get(hadith.id));
    });
    return () => { cancelled = true; };
  }, [isLoggedIn, user?.id, hadith.id]);

  function startQuiz() {
    setQuizOpen(true);
    setQuizIdx(0);
    setSelected(null);
    setRevealed(false);
    setQuizScore({ correct: 0, total: 0 });
    setQuizDone(false);
  }

  function answer(option: string) {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);
    const q = questions[quizIdx];
    const ok = isMcqAnswerCorrect(q.correctAnswer, option);
    setQuizScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
  }

  function nextQuestion() {
    if (quizIdx + 1 < questions.length) {
      setQuizIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setQuizDone(true);
    }
  }

  async function rate(quality: ReviewQuality) {
    if (!isLoggedIn || !user?.id) { setQuizOpen(false); return; }
    setSavingReview(true);
    try {
      const next = await submitArbaeenReview(user.id, hadith.id, reviewState, quality);
      setReviewState(next);
    } finally {
      setSavingReview(false);
      setQuizOpen(false);
    }
  }

  const level = masteryLevel(reviewState);
  const prevId = hadith.id > 1 ? hadith.id - 1 : null;
  const nextId = hadith.id < 42 ? hadith.id + 1 : null;

  return (
    <div className="ahd-page" dir="rtl">
      <Link href="/arbaeen-nawawi" className="ahd-back">
        <ChevronRight size={16} aria-hidden="true" /> فهرس الأربعين النووية
      </Link>

      <header className="ahd-header">
        <span className="ahd-header__num">الحديث {hadith.id} من 42</span>
        <h1 className="ahd-header__title">{hadith.title}</h1>
        {isLoggedIn && <span className={`ahd-level ahd-level--${level === "حافظ" ? "mastered" : level === "متقدم" ? "advanced" : level === "متوسط" ? "mid" : "new"}`}>{level}</span>}
      </header>

      <blockquote className="ahd-text" style={{ fontFamily: "var(--font-quran, serif)" }}>«{hadith.text}»</blockquote>
      <p className="ahd-source">{hadith.source}</p>

      <section className="ahd-section" aria-label="الشرح">
        <h2 className="ahd-section__title"><BookOpen size={16} aria-hidden="true" /> الشرح</h2>
        <p className="ahd-section__body">{hadith.explanation}</p>
      </section>

      <section className="ahd-section" aria-label="الفائدة">
        <h2 className="ahd-section__title"><Lightbulb size={16} aria-hidden="true" /> الفائدة</h2>
        <p className="ahd-section__body">{hadith.benefits}</p>
      </section>

      {!quizOpen ? (
        <button type="button" className="ahd-quiz-cta" onClick={startQuiz}>
          اختبر نفسك في هذا الحديث ({questions.length} أسئلة)
        </button>
      ) : quizDone ? (
        <div className="ahd-quiz-result">
          <p className="ahd-quiz-result__score">{quizScore.correct} / {quizScore.total} صحيحة</p>
          {isLoggedIn ? (
            <>
              <p className="ahd-quiz-result__prompt">كيف كان مستوى تذكّرك لهذا الحديث؟</p>
              <div className="ahd-quiz-result__buttons">
                {QUALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="ahd-quiz-result__btn"
                    style={{ borderColor: opt.color, color: opt.color }}
                    disabled={savingReview}
                    onClick={() => rate(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="ahd-quiz-result__login">
              <Link href="/login">سجّل الدخول</Link> لحفظ تقدّمك وجدولة مراجعتك القادمة تلقائيًا.
            </p>
          )}
        </div>
      ) : (
        <div className="ahd-quiz" role="group" aria-label="اختبر نفسك">
          <p className="ahd-quiz__progress">سؤال {quizIdx + 1} من {questions.length}</p>
          <p className="ahd-quiz__prompt">{questions[quizIdx].prompt}</p>
          <div className="ahd-quiz__options">
            {questions[quizIdx].options.map((opt) => {
              const isCorrectOpt = revealed && isMcqAnswerCorrect(questions[quizIdx].correctAnswer, opt);
              const isWrongSelected = revealed && selected === opt && !isCorrectOpt;
              return (
                <button
                  key={opt}
                  type="button"
                  className={`ahd-quiz__opt${isCorrectOpt ? " ahd-quiz__opt--correct" : ""}${isWrongSelected ? " ahd-quiz__opt--wrong" : ""}`}
                  onClick={() => answer(opt)}
                  disabled={revealed}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {revealed && (
            <button type="button" className="ahd-quiz__next" onClick={nextQuestion}>
              {quizIdx + 1 < questions.length ? "السؤال التالي" : "عرض النتيجة"}
            </button>
          )}
        </div>
      )}

      <nav className="ahd-nav" aria-label="التنقل بين الأحاديث">
        {prevId && <Link href={`/arbaeen-nawawi/${prevId}`} className="ahd-nav__link">الحديث السابق <ChevronRight size={14} aria-hidden="true" /></Link>}
        {nextId && <Link href={`/arbaeen-nawawi/${nextId}`} className="ahd-nav__link">الحديث التالي <ChevronLeft size={14} aria-hidden="true" /></Link>}
      </nav>
    </div>
  );
}
