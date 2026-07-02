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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* رأس النافذة */}
        <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-lg">اختبر نفسك 📝</h2>
          <button onClick={onClose} className="text-emerald-200 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">{score === quizzes.length ? "🏆" : score >= quizzes.length / 2 ? "✅" : "📚"}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                النتيجة: {score} / {quizzes.length}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {score === quizzes.length
                  ? "ممتاز! أتقنت الاختبار كاملاً"
                  : score >= quizzes.length / 2
                  ? "جيد! يمكنك المراجعة والمحاولة مجدداً"
                  : "راجع الكتاب ثم حاول مجدداً"}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <>
              {/* تقدم الاختبار */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>سؤال {idx + 1} من {quizzes.length}</span>
                <span>النقاط: {score}</span>
              </div>
              <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full mb-5">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${((idx) / quizzes.length) * 100}%` }}
                />
              </div>

              {/* السؤال */}
              <p className="text-base font-semibold text-gray-900 dark:text-white mb-5 leading-relaxed">
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
                        ${isCorrect ? "bg-green-50 border-green-400 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : isWrong ? "bg-red-50 border-red-400 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : isSelected ? "bg-emerald-50 border-emerald-400 dark:bg-emerald-900/20"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                        }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* النتيجة والتوضيح */}
              {result && (
                <div className={`mt-4 p-3 rounded-xl text-sm ${result.correct ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"}`}>
                  <p className="font-medium mb-1">{result.correct ? "✅ إجابة صحيحة" : "❌ إجابة خاطئة"}</p>
                  {result.explanation && <p>{result.explanation}</p>}
                </div>
              )}

              {selected && (
                <button
                  onClick={next}
                  className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
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
