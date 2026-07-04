import { useState } from "react";
import type { LPQuiz } from "@/lib/learning-path-service";
import { submitQuizAnswer } from "@/lib/learning-path-service";

interface Props {
  quizzes: LPQuiz[];
  token: string | null;
  onClose: () => void;
}

export function QuizModal({ quizzes, token, onClose }: Props) {
  const [idx, setIdx]         = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult]   = useState<{ correct: boolean; explanation: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [score, setScore]     = useState(0);
  const [done, setDone]       = useState(false);

  const current = quizzes[idx];

  async function handleAnswer(answer: string) {
    if (selected || !current) return;
    setSelected(answer);
    if (!token) {
      setResult({ correct: answer === current.options?.[0], explanation: null });
      return;
    }
    setLoading(true);
    try {
      const r = await submitQuizAnswer(token, current.id, answer);
      setResult(r);
      if (r.correct) setScore((s) => s + 1);
    } catch {
      setResult({ correct: false, explanation: null });
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (idx + 1 >= quizzes.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setResult(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ background: "var(--majalis-panel)" }}>
        {/* رأس النافذة */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: "var(--majalis-emerald)", color: "#fff" }}>
          <h2 className="font-bold text-lg">اختبر نفسك 📝</h2>
          <button onClick={onClose} className="text-xl leading-none opacity-80 hover:opacity-100">✕</button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">{score === quizzes.length ? "🏆" : score >= quizzes.length / 2 ? "✅" : "📚"}</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "var(--majalis-ink)" }}>
                النتيجة: {score} / {quizzes.length}
              </h3>
              <p className="mb-6" style={{ color: "var(--majalis-ink-soft)" }}>
                {score === quizzes.length
                  ? "ممتاز! أتقنت الاختبار كاملاً"
                  : score >= quizzes.length / 2
                  ? "جيد! يمكنك المراجعة والمحاولة مجدداً"
                  : "راجع الكتاب ثم حاول مجدداً"}
              </p>
              <button
                onClick={onClose}
                className="citation-btn citation-btn--primary px-6 py-2.5 rounded-xl"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <>
              {/* تقدم الاختبار */}
              <div className="flex items-center justify-between text-xs mb-4" style={{ color: "var(--majalis-ink-soft)" }}>
                <span>سؤال {idx + 1} من {quizzes.length}</span>
                <span>النقاط: {score}</span>
              </div>
              <div className="h-1 rounded-full mb-5" style={{ background: "var(--majalis-line)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${((idx) / quizzes.length) * 100}%`,
                    background: "var(--majalis-emerald)",
                    transition: "width 250ms ease",
                  }}
                />
              </div>

              {/* السؤال */}
              <p className="text-base font-semibold mb-5 leading-relaxed" style={{ color: "var(--majalis-ink)" }}>
                {current?.question}
              </p>

              {/* الخيارات */}
              <div className="space-y-2.5">
                {(current?.options ?? []).map((opt, i) => {
                  const isSelected = selected === opt;
                  const isCorrect  = result && opt === selected && result.correct;
                  const isWrong    = result && opt === selected && !result.correct;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!selected || loading}
                      className={`w-full text-right px-4 py-3 rounded-xl border text-sm font-medium transition-all
                        ${isCorrect ? "quiz-opt--correct"
                          : isWrong ? "quiz-opt--wrong"
                          : isSelected ? "quiz-opt--selected"
                          : "quiz-opt"
                        }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* النتيجة والتوضيح */}
              {result && (
                <div className={`mt-4 p-3 rounded-xl text-sm ${result.correct ? "quiz-result--correct" : "quiz-result--wrong"}`}>
                  <p className="font-medium mb-1">{result.correct ? "✅ إجابة صحيحة" : "❌ إجابة خاطئة"}</p>
                  {result.explanation && <p>{result.explanation}</p>}
                </div>
              )}

              {selected && (
                <button
                  onClick={next}
                  className="citation-btn citation-btn--primary mt-4 w-full py-2.5 rounded-xl"
                >
                  {idx + 1 >= quizzes.length ? "عرض النتيجة النهائية" : "السؤال التالي →"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
