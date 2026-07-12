import { useState } from "react";
import type { LPQuiz } from "@/lib/learning-path-service";
import { submitQuizAnswer } from "@/lib/learning-path-service";

interface Props {
  quizzes: LPQuiz[];
  token: string | null;
  bookTitle?: string;
  onClose: () => void;
  onPass?: () => void;
}

const PASS_THRESHOLD = 0.6; // 60%

export function QuizModal({ quizzes, token, bookTitle, onClose, onPass }: Props) {
  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult]     = useState<{ correct: boolean; explanation: string | null } | null>(null);
  const [loading, setLoading]   = useState(false);
  const [score, setScore]       = useState(0);
  const [done, setDone]         = useState(false);

  const current = quizzes[idx];
  const passed  = score >= Math.ceil(quizzes.length * PASS_THRESHOLD);

  async function handleAnswer(answer: string) {
    if (selected || !current) return;
    setSelected(answer);
    if (!token) {
      // offline: correct answer is always options[0]
      const correct = answer === current.options[0];
      if (correct) setScore((s) => s + 1);
      setResult({ correct, explanation: null });
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

  function handlePassAndClose() {
    onPass?.();
    onClose();
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
          <div>
            <h2 className="font-bold text-lg">اختبر نفسك 📝</h2>
            {bookTitle && <p className="text-emerald-200 text-xs mt-0.5">{bookTitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-emerald-200 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">
                {passed ? "🏆" : score >= quizzes.length / 3 ? "✅" : "📚"}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                النتيجة: {score} / {quizzes.length}
              </h3>

              {passed ? (
                <>
                  <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-4">
                    <p className="text-emerald-800 dark:text-emerald-300 font-bold text-lg mb-1">
                      🎉 تهانينا! اجتزت مقرر الكتاب
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-400 text-sm">
                      سجّلنا إتمامك لهذا الكتاب — انتقل للكتاب التالي في المسار.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePassAndClose}
                    className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
                  >
                    ✓ تسجيل الإتمام والمتابعة
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {score >= quizzes.length / 3
                      ? "جيد! راجع الكتاب ثم حاول مجدداً للاجتياز."
                      : "راجع الكتاب جيداً ثم حاول مجدداً — تحتاج إلى 60% للاجتياز."}
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button
                      type="button"
                      onClick={() => { setIdx(0); setScore(0); setSelected(null); setResult(null); setDone(false); }}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                    >
                      إعادة المحاولة
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                    >
                      إغلاق
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* تقدم الاختبار */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>سؤال {idx + 1} من {quizzes.length}</span>
                <span>النقاط: {score} • للاجتياز: {Math.ceil(quizzes.length * PASS_THRESHOLD)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-5">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(idx / quizzes.length) * 100}%` }}
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
                  const isCorrect  = result && isSelected && result.correct;
                  const isWrong    = result && isSelected && !result.correct;
                  return (
                    <button
                      key={i}
                      type="button"
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

              {/* النتيجة */}
              {result && (
                <div className={`mt-4 p-3 rounded-xl text-sm ${result.correct ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"}`}>
                  <p className="font-medium">{result.correct ? "✅ إجابة صحيحة" : "❌ إجابة خاطئة"}</p>
                  {result.explanation && <p className="mt-1">{result.explanation}</p>}
                </div>
              )}

              {selected && (
                <button
                  type="button"
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
