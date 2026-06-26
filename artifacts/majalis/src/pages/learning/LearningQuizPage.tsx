import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Loading } from "@/components/ui-common";
import { fetchLearningQuiz, submitLearningQuiz, type QuizQuestion } from "@/lib/digital-learning-service";

type Phase = "loading" | "playing" | "done";

export default function LearningQuizPage() {
  const params = useParams();
  const slug = params.slug || "aqeedah";
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

  if (phase === "loading") return <Loading />;

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
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>نتيجة الاختبار</h1>
        <p style={{ fontSize: "2rem", fontWeight: 700, color: result.passed ? "var(--emerald-deep)" : "#dc2626" }}>
          {result.score_pct}%
        </p>
        <p style={{ marginBottom: "1rem" }}>{result.passed ? "مبارك! اجتزت الاختبار" : "حاول مرة أخرى"}</p>

        {result.error_analysis?.length > 0 && (
          <section style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>تحليل الأخطاء</h2>
            {result.error_analysis.map((err: any) => (
              <div key={err.question_id} style={{ padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid var(--line)", marginBottom: "0.5rem" }}>
                <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{err.question}</p>
                {err.explanation && <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>{err.explanation}</p>}
                {err.reference_source && <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>المرجع: {err.reference_source}</p>}
              </div>
            ))}
          </section>
        )}

        <Link href={`/learning/paths/${slug}`} style={{ display: "inline-block", marginTop: "1.5rem" }}>العودة للمسار</Link>
      </div>
    );
  }

  return (
    <div className="page-shell narrow">
      <nav style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
        <Link href={`/learning/paths/${slug}`}>المسار</Link> / {quiz.title}
      </nav>

      <div style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "var(--ink-soft)" }}>
        سؤال {index + 1} من {questions.length}
      </div>

      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.5rem" }}>{current.question}</h2>

      {current.question_type === "multiple_choice" && current.options && (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {current.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelected(i)}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "0.375rem",
                border: selected === i ? "2px solid var(--emerald-deep)" : "1px solid var(--line)",
                background: selected === i ? "var(--emerald-light, #d1fae5)" : "var(--panel)",
                cursor: "pointer",
                textAlign: "start",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {current.question_type === "true_false" && (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {["صح", "خطأ"].map((opt) => (
            <button key={opt} type="button" onClick={() => setSelected(opt === "صح")} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.375rem", border: "1px solid var(--line)", cursor: "pointer" }}>
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
          style={{ width: "100%", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid var(--line)" }}
        />
      )}

      <button
        type="button"
        onClick={submitAnswer}
        disabled={current.question_type !== "text" && selected === null}
        style={{ marginTop: "1.5rem", padding: "0.625rem 1.5rem", borderRadius: "0.375rem", background: "var(--emerald-deep)", color: "#fff", border: "none", cursor: "pointer" }}
      >
        {index + 1 >= questions.length ? "إنهاء الاختبار" : "التالي"}
      </button>
    </div>
  );
}
