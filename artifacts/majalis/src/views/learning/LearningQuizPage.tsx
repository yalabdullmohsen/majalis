import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { SkeletonPage } from "@/components/ui-common";
import { fetchLearningQuiz, submitLearningQuiz, type QuizQuestion } from "@/lib/digital-learning-service";
import { applyPageSeo } from "@/lib/seo";

type Phase = "loading" | "playing" | "done";

export default function LearningQuizPage() {
  const params = useParams();
  const slug = params.slug || "aqeedah";

  useEffect(() => {
    applyPageSeo({
      path: "/learning/quiz",
      title: "اختبار المسار الشرعي | المجلس العلمي",
      description: "اختبر فهمك لمحتوى المسار الشرعي، أسئلة اختيار من متعدد مع نتيجة فورية وشهادة.",
      keywords: ["اختبار شرعي", "اختبار المسار", "تقييم علمي", "أسئلة إسلامية"],
    });
  }, []);
  const [phase, setPhase] = useState<Phase>("loading");
  const [quiz, setQuiz] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<any>(null);
  const [selected, setSelected] = useState<unknown>(null);
  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    fetchLearningQuiz(slug)
      .then((q) => {
        setQuiz(q);
        setPhase("playing");
      })
      .catch(() => setPhase("done"));
  }, [slug]);

  const questions: QuizQuestion[] = quiz?.questions || [];
  const current = questions[index];

  const submitAnswer = () => {
    if (!current) return;
    const val = current.question_type === "text" ? textInput : selected;
    const newAnswers = { ...answers, [current.id]: val };
    setAnswers(newAnswers);

    if (index + 1 >= questions.length) {
      submitLearningQuiz(quiz.id || slug, newAnswers).then((r) => {
        setResult(r);
        setPhase("done");
      });
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setTextInput("");
    }
  };

  if (phase === "loading") return <SkeletonPage />;

  if (!quiz || questions.length === 0) {
    return (
      <div className="page-shell narrow">
        <p>الاختبار غير متوفر</p>
        <Link href="/learning/paths">العودة للمسارات</Link>
      </div>
    );
  }

  if (phase === "done" && result) {
    return (
      <div className="page-shell narrow">
        <h1 className="lqp-title">نتيجة الاختبار</h1>
        <p className={`lqp-score ${result.passed ? "lqp-score--pass" : "lqp-score--fail"}`}>
          {result.score_pct}%
        </p>
        <p className="lqp-pass-msg">{result.passed ? "مبارك! اجتزت الاختبار" : "حاول مرة أخرى"}</p>

        {result.error_analysis?.length > 0 && (
          <section className="lqp-error-section">
            <h2 className="lqp-error-section__title">تحليل الأخطاء</h2>
            {result.error_analysis.map((err: any) => (
              <div key={err.question_id} className="lqp-error-item">
                <p className="lqp-error-item__q">{err.question}</p>
                {err.explanation && <p className="lqp-error-item__exp">{err.explanation}</p>}
                {err.reference_source && <p className="lqp-error-item__ref">المرجع: {err.reference_source}</p>}
              </div>
            ))}
          </section>
        )}

        <Link href={`/learning/paths/${slug}`} className="lqp-back-link">العودة للمسار</Link>
      </div>
    );
  }

  return (
    <div className="page-shell narrow">
      <nav className="lqp-breadcrumb" aria-label="مسار التنقل">
        <Link href={`/learning/paths/${slug}`}>المسار</Link> / {quiz.title}
      </nav>

      <div className="lqp-progress">
        سؤال {index + 1} من {questions.length}
      </div>

      <h2 className="lqp-question">{current.question}</h2>

      {current.question_type === "multiple_choice" && current.options && (
        <div className="lqp-mc-grid">
          {current.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelected(i)}
              className={`lqp-mc-btn${selected === i ? " is-selected" : ""}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {current.question_type === "true_false" && (
        <div className="lqp-tf-row">
          {["صح", "خطأ"].map((opt) => (
            <button key={opt} type="button" onClick={() => setSelected(opt === "صح")} className="lqp-tf-btn">
              {opt}
            </button>
          ))}
        </div>
      )}

      {current.question_type === "text" && (
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="اكتب إجابتك..."
          className="lqp-text-inp"
        />
      )}

      <button
        type="button"
        onClick={submitAnswer}
        disabled={current.question_type !== "text" && selected === null}
        className="lqp-next-btn"
      >
        {index + 1 >= questions.length ? "إنهاء الاختبار" : "التالي"}
      </button>
    </div>
  );
}
