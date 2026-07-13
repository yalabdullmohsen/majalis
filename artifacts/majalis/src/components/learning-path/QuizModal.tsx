import { useState } from "react";
import { BookOpen, CheckCircle2, PenLine, Trophy, XCircle } from "lucide-react";
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="qzm-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden qzm-modal">
        {/* رأس النافذة */}
        <div className="px-6 py-4 flex items-center justify-between qzm-modal-head">
          <h2 id="qzm-title" className="font-bold text-lg">اختبر نفسك <PenLine size={16} className="inline ml-1" /></h2>
          <button type="button" onClick={onClose} className="text-xl leading-none opacity-80 hover:opacity-100" aria-label="إغلاق">✕</button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">{score === quizzes.length ? <Trophy size={56} strokeWidth={1.2} /> : score >= quizzes.length / 2 ? <CheckCircle2 size={56} strokeWidth={1.2} /> : <BookOpen size={56} strokeWidth={1.2} />}</div>
              <h3 className="text-xl font-bold mb-2 qzm-ink">
                النتيجة: {score} / {quizzes.length}
              </h3>
              <p className="mb-6 qzm-ink-soft">
                {score === quizzes.length
                  ? "ممتاز! أتقنت الاختبار كاملاً"
                  : score >= quizzes.length / 2
                  ? "جيد! يمكنك المراجعة والمحاولة مجدداً"
                  : "راجع الكتاب ثم حاول مجدداً"}
              </p>
              <button
                        type="button"
                onClick={onClose}
                className="citation-btn citation-btn--primary px-6 py-2.5 rounded-xl"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <>
              {/* تقدم الاختبار */}
              <div className="flex items-center justify-between text-xs mb-4 qzm-ink-soft">
                <span>سؤال {idx + 1} من {quizzes.length}</span>
                <span>النقاط: {score}</span>
              </div>
              <div className="h-1 rounded-full mb-5 qzm-progress-track">
                <div
                  className="h-full rounded-full qzm-progress-fill"
                  style={{ "--qzm-prog-w": `${((idx) / quizzes.length) * 100}%` } as React.CSSProperties}
                />
              </div>

              {/* السؤال */}
              <p className="text-base font-semibold mb-5 leading-relaxed qzm-ink">
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
                      type="button"
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!selected || loading}
                      aria-pressed={isSelected}
                      aria-label={`${opt}${isCorrect ? " — صحيح" : isWrong ? " — خطأ" : ""}`}
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
                  <p className="font-medium mb-1">{result.correct ? <><CheckCircle2 size={13} className="inline ml-1" />إجابة صحيحة</> : <><XCircle size={13} className="inline ml-1" />إجابة خاطئة</>}</p>
                  {result.explanation && <p>{result.explanation}</p>}
                </div>
              )}

              {selected && (
                <button
                          type="button"
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
