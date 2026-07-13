import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { CheckCircle2, XCircle, BookOpen, ArrowRight, GraduationCap, RotateCw } from "lucide-react";
import { SkeletonPage } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import {
  fetchLearningQuiz,
  submitLearningQuiz,
  type QuizQuestion,
} from "@/lib/digital-learning-service";
import { applyPageSeo } from "@/lib/seo";

type Phase = "loading" | "playing" | "done" | "error";

// ── Ring Progress ─────────────────────────────────────────────────────────────
function ScoreRing({ pct, passed }: { pct: number; passed: boolean }) {
  const r    = 48;
  const circ = 2 * Math.PI * r;
  const off  = circ - (Math.min(100, pct) / 100) * circ;
  const color = passed ? "#0E6E52" : "#dc2626";
  return (
    <div className="lqp2-ring" aria-label={`النتيجة ${Math.round(pct)}%`}>
      <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} strokeWidth="8" stroke="rgba(0,0,0,.08)" fill="none" />
        <circle
          cx="60" cy="60" r={r} strokeWidth="8" fill="none"
          stroke={color} strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round" transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div className="lqp2-ring__label" style={{ color }}>
        <span className="lqp2-ring__pct">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Linear Progress ───────────────────────────────────────────────────────────
function QuizProgress({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="lqp2-progress" aria-label={`السؤال ${current} من ${total}`}>
      <div className="lqp2-progress__bar">
        <div className="lqp2-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="lqp2-progress__label">{current} / {total}</span>
    </div>
  );
}

// ── Done Screen ───────────────────────────────────────────────────────────────
function DoneScreen({
  result,
  slug,
  onRetry,
}: {
  result: Record<string, unknown>;
  slug: string;
  onRetry: () => void;
}) {
  const scorePct = (result.score_pct as number) ?? 0;
  const passed   = !!(result.passed);
  const errors   = (result.error_analysis as Record<string, unknown>[] | undefined) ?? [];

  return (
    <div className="lqp2-done" dir="rtl">
      <div className="lqp2-done__hero">
        <ScoreRing pct={scorePct} passed={passed} />
        <div className="lqp2-done__verdict">
          {passed ? (
            <>
              <CheckCircle2 size={24} className="lqp2-done__icon lqp2-done__icon--pass" aria-hidden="true" />
              <h2 className="lqp2-done__title lqp2-done__title--pass">مبارك! اجتزت الاختبار</h2>
            </>
          ) : (
            <>
              <XCircle size={24} className="lqp2-done__icon lqp2-done__icon--fail" aria-hidden="true" />
              <h2 className="lqp2-done__title lqp2-done__title--fail">لم تجتز الاختبار هذه المرة</h2>
            </>
          )}
          <p className="lqp2-done__sub">
            {passed
              ? "أحسنت الاستعداد — تُصدر شهادتك رقمياً عند إتمام المسار."
              : "راجع الأخطاء أدناه وأعد المحاولة حين تشاء."}
          </p>
        </div>
      </div>

      {/* تحليل الأخطاء */}
      {errors.length > 0 && (
        <section className="lqp2-errors">
          <h3 className="lqp2-errors__title">تحليل الأخطاء</h3>
          <div className="lqp2-errors__list">
            {errors.map((err, i) => (
              <div key={String(err.question_id ?? i)} className="lqp2-error-card">
                <div className="lqp2-error-card__num">{i + 1}</div>
                <div className="lqp2-error-card__body">
                  <p className="lqp2-error-card__q">{String(err.question ?? "")}</p>
                  {!!err.explanation && (
                    <p className="lqp2-error-card__exp">{String(err.explanation)}</p>
                  )}
                  {!!err.reference_source && (
                    <p className="lqp2-error-card__ref">
                      <BookOpen size={11} aria-hidden="true" /> {String(err.reference_source)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="lqp2-done__actions">
        <button type="button" onClick={onRetry} className="lqp2-btn lqp2-btn--outline">
          <RotateCw size={15} aria-hidden="true" /> إعادة الاختبار
        </button>
        <Link href={`/learning/paths/${slug}`} className="lqp2-btn lqp2-btn--primary">
          <ArrowRight size={15} aria-hidden="true" /> العودة للمسار
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LearningQuizPage() {
  const params = useParams();
  const slug   = params.slug || "aqeedah";

  const [phase,     setPhase]     = useState<Phase>("loading");
  const [quiz,      setQuiz]      = useState<Record<string, unknown> | null>(null);
  const [index,     setIndex]     = useState(0);
  const [answers,   setAnswers]   = useState<Record<string, unknown>>({});
  const [result,    setResult]    = useState<Record<string, unknown> | null>(null);
  const [selected,  setSelected]  = useState<unknown>(null);
  const [textInput, setTextInput] = useState("");
  const [animKey,   setAnimKey]   = useState(0);

  useEffect(() => {
    applyPageSeo({
      path: `/learning/quiz/${slug}`,
      title: "اختبار المسار الشرعي | المجلس العلمي",
      description: "اختبر فهمك لمحتوى المسار الشرعي، أسئلة اختيار من متعدد مع نتيجة فورية وشهادة.",
      keywords: ["اختبار شرعي", "اختبار المسار", "تقييم علمي", "أسئلة إسلامية"],
      robots: "noindex, follow",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "اختبار المسار الشرعي",
          url: `https://majlisilm.com/learning/quiz/${slug}`,
          description: "اختبر فهمك لمحتوى المسار الشرعي بأسئلة اختيار من متعدد",
          educationalLevel: "متعدد المستويات",
          inLanguage: "ar",
        },
      ],
    });
  }, [slug]);

  const loadQuiz = () => {
    setPhase("loading");
    setIndex(0);
    setAnswers({});
    setSelected(null);
    setTextInput("");
    setResult(null);
    fetchLearningQuiz(slug)
      .then((q) => { setQuiz(q ?? null); setPhase(q ? "playing" : "error"); })
      .catch(() => setPhase("error"));
  };

  useEffect(() => {
    setPhase("loading");
    setIndex(0);
    setAnswers({});
    setSelected(null);
    setTextInput("");
    setResult(null);
    fetchLearningQuiz(slug)
      .then((q) => { setQuiz(q ?? null); setPhase(q ? "playing" : "error"); })
      .catch(() => setPhase("error"));
  }, [slug]); // loadQuiz excluded intentionally — it is stable across renders

  const questions: QuizQuestion[] = (quiz?.questions as QuizQuestion[]) || [];
  const total   = questions.length;
  const current = questions[index];

  const goNext = () => {
    if (!current) return;
    const val = current.question_type === "text" ? textInput : selected;
    const newAnswers = { ...answers, [current.id]: val };
    setAnswers(newAnswers);

    if (index + 1 >= total) {
      submitLearningQuiz((quiz?.id as string) || slug, newAnswers)
        .then((r) => { setResult(r as Record<string, unknown>); setPhase("done"); })
        .catch(() => setPhase("done"));
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setTextInput("");
      setAnimKey((k) => k + 1);
    }
  };

  // ── حالة التحميل ──
  if (phase === "loading") return <SkeletonPage />;

  // ── خطأ ──
  if (phase === "error" || !quiz || total === 0) {
    return (
      <div className="page-shell narrow lqp2-wrap" dir="rtl">
        <div className="lqp2-empty">
          <GraduationCap size={48} strokeWidth={1.2} className="lqp2-empty__icon" aria-hidden="true" />
          <p className="lqp2-empty__msg">الاختبار غير متوفر لهذا المسار حالياً.</p>
          <Link href={`/learning/paths/${slug}`} className="lqp2-btn lqp2-btn--primary">
            العودة للمسار
          </Link>
        </div>
      </div>
    );
  }

  // ── نتيجة ──
  if (phase === "done" && result) {
    return (
      <div className="page-shell narrow lqp2-wrap" dir="rtl">
        <DoneScreen result={result} slug={slug} onRetry={loadQuiz} />
        <div className="twh-share">
          <ShareButtons title="اختبار المسار التعليمي — المجلس العلمي" url="https://majlisilm.com/learning/quiz" />
        </div>
      </div>
    );
  }

  // ── اللعب ──
  const isNextDisabled = current.question_type !== "text" && selected === null;

  return (
    <div className="page-shell narrow lqp2-wrap" dir="rtl">
      {/* شريط التنقل */}
      <nav className="lqp2-breadcrumb" aria-label="مسار التنقل">
        <Link href={`/learning/paths/${slug}`}>المسار</Link>
        <span aria-hidden="true"> / </span>
        <span>{(quiz.title as string) || "اختبار"}</span>
      </nav>

      <QuizProgress current={index + 1} total={total} />

      {/* بطاقة السؤال */}
      <div className="lqp2-question-card" key={animKey}>
        <span className="lqp2-q-num">سؤال {index + 1}</span>
        <p className="lqp2-question">{current.question}</p>
      </div>

      {/* الخيارات: اختيار من متعدد */}
      {current.question_type === "multiple_choice" && current.options && (
        <div className="lqp2-mc-grid" role="radiogroup" aria-label="اختر الإجابة">
          {current.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={selected === i}
              onClick={() => setSelected(i)}
              className={`lqp2-mc-option${selected === i ? " lqp2-mc-option--selected" : ""}`}
            >
              <span className="lqp2-mc-letter" aria-hidden="true">
                {["أ", "ب", "ج", "د"][i] ?? String(i + 1)}
              </span>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      )}

      {/* صح / خطأ */}
      {current.question_type === "true_false" && (
        <div className="lqp2-tf-row" role="radiogroup" aria-label="اختر الإجابة">
          {[{ label: "صح", val: true }, { label: "خطأ", val: false }].map(({ label, val }) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={selected === val}
              onClick={() => setSelected(val)}
              className={`lqp2-tf-btn${selected === val ? " lqp2-tf-btn--selected" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* إجابة نصية */}
      {current.question_type === "text" && (
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isNextDisabled && goNext()}
          placeholder="اكتب إجابتك…"
          className="lqp2-text-inp"
          aria-label="الإجابة"
        />
      )}

      <button
        type="button"
        onClick={goNext}
        disabled={isNextDisabled}
        className="lqp2-btn lqp2-btn--primary lqp2-next-btn"
        aria-disabled={isNextDisabled}
      >
        {index + 1 >= total ? "إنهاء الاختبار" : "التالي"}
        <ArrowRight size={15} aria-hidden="true" />
      </button>

      <div className="twh-share">
        <ShareButtons title="اختبار المسار التعليمي — المجلس العلمي" url="https://majlisilm.com/learning/quiz" />
      </div>
    </div>
  );
}
