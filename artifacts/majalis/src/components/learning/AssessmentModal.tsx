import { useEffect, useState } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { fetchAssessment, submitAssessment, type AssessmentQuestion } from "@/lib/learning-assessment-service";

export function AssessmentModal({
  assessmentId,
  learningItemId,
  onClose,
  onPassed,
}: {
  assessmentId: string;
  learningItemId: string;
  onClose: () => void;
  onPassed: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [passPercentage, setPassPercentage] = useState(70);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ scorePct: number; passed: boolean } | null>(null);

  useEffect(() => {
    fetchAssessment(assessmentId).then((res) => {
      if (!res.ok || !res.assessment || !res.questions) {
        setError(res.error || "تعذّر تحميل التقييم");
      } else {
        setTitle(res.assessment.title);
        setPassPercentage(res.assessment.passPercentage);
        setQuestions(res.questions);
      }
      setLoading(false);
    });
  }, [assessmentId]);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [onClose]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await submitAssessment(assessmentId, answers, learningItemId);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || "تعذّر إرسال الإجابات");
      return;
    }
    setResult({ scorePct: res.scorePct ?? 0, passed: !!res.passed });
    if (res.passed) onPassed();
  };

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]?.trim());

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) — مسار وصول
    // بديل كامل بلوحة المفاتيح.
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-static-element-interactions */
    <div className="am-overlay" role="presentation" onClick={onClose}>
      <div className="am-modal" role="dialog" aria-modal="true" aria-label={title || "التقييم"} onClick={(e) => e.stopPropagation()}>
        <div className="am-modal__head">
          <span>{title || "التقييم"}</span>
          <button type="button" onClick={onClose} className="am-modal__close" aria-label="إغلاق"><X size={18} aria-hidden="true" /></button>
        </div>

        <div className="am-modal__body">
          {loading && <p className="am-loading">جارٍ التحميل…</p>}
          {error && <div className="mwc-error" role="alert">{error}</div>}

          {!loading && !error && !result && questions.length === 0 && (
            <p className="am-loading">لا أسئلة معتمدة لهذا التقييم بعد.</p>
          )}

          {!loading && !error && !result && questions.length > 0 && (
            <>
              {questions.map((q, i) => (
                <div key={q.id} className="am-question">
                  <p className="am-question__text">{i + 1}. {q.questionText}</p>
                  {q.questionType === "mcq" && Array.isArray(q.options) && (
                    <div className="am-options">
                      {(q.options as string[]).map((opt, idx) => (
                        <label key={idx} className="am-option">
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.questionType === "true_false" && (
                    <div className="am-options">
                      {["صحيح", "خطأ"].map((opt) => (
                        <label key={opt} className="am-option">
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.questionType === "short_answer" && (
                    <input
                      type="text"
                      className="am-text-input"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="اكتب إجابتك…"
                    />
                  )}
                </div>
              ))}
              <button type="button" className="am-submit-btn" disabled={!allAnswered || submitting} onClick={handleSubmit}>
                {submitting ? "جارٍ التصحيح…" : "إرسال الإجابات"}
              </button>
            </>
          )}

          {result && (
            <div className={`am-result${result.passed ? " am-result--passed" : " am-result--failed"}`}>
              {result.passed ? <CheckCircle2 size={32} aria-hidden="true" /> : <XCircle size={32} aria-hidden="true" />}
              <p className="am-result__score">{result.scorePct}%</p>
              <p className="am-result__msg">
                {result.passed ? "اجتزت التقييم بنجاح" : `لم تبلغ نسبة النجاح المطلوبة (${passPercentage}%)`}
              </p>
              <button type="button" className="am-submit-btn" onClick={onClose}>إغلاق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
