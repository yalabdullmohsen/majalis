import { Suspense, lazy, useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { LPScience, LPLevel, LPProgress, LPQuiz } from "@/lib/learning-path-service";
import { fetchScienceDetail, fetchProgress } from "@/lib/learning-path-service";
import { STATIC_SCIENCE_DETAILS, STATIC_BOOK_QUIZZES } from "@/lib/learning-path-static-data";
import { useLocalProgress } from "@/hooks/useLocalProgress";

const LevelTimeline = lazy(() =>
  import("@/components/learning-path/LevelTimeline").then((m) => ({ default: m.LevelTimeline }))
);

const QuizModal = lazy(() =>
  import("@/components/learning-path/QuizModal").then((m) => ({ default: m.QuizModal }))
);

export default function LearningPathSciencePage() {
  const { scienceSlug } = useParams<{ scienceSlug: string }>();
  const { isLoggedIn } = useAuth();
  const [science, setScience]     = useState<LPScience | null>(null);
  const [levels, setLevels]       = useState<LPLevel[]>([]);
  const [apiProgress, setApiProgress] = useState<LPProgress[]>([]);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [isStaticMode, setIsStaticMode] = useState(false);

  // quiz state
  const [quizBookId, setQuizBookId]     = useState<string | null>(null);
  const [quizBookTitle, setQuizBookTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<LPQuiz[]>([]);

  // local progress (used in static mode)
  const { getStatus, startBook, completeBook, progressList: localProgress } = useLocalProgress();

  useEffect(() => {
    if (!scienceSlug) return;
    setLoading(true);
    setNotFound(false);
    setIsStaticMode(false);

    const detailP = fetchScienceDetail(scienceSlug);
    const progressP = isLoggedIn
      ? supabase.auth.getSession().then(({ data }) =>
          data.session?.access_token
            ? fetchProgress(data.session.access_token).catch(() => [] as LPProgress[])
            : [] as LPProgress[])
      : Promise.resolve([] as LPProgress[]);

    Promise.all([detailP, progressP])
      .then(([d, p]) => { setScience(d.science); setLevels(d.levels); setApiProgress(p); })
      .catch(() => {
        const fallback = STATIC_SCIENCE_DETAILS[scienceSlug];
        if (fallback) {
          setScience(fallback.science);
          setLevels(fallback.levels);
          setIsStaticMode(true);
        } else {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [scienceSlug, isLoggedIn]);

  function handleOpenQuiz(bookId: string, bookTitle: string) {
    const qs = STATIC_BOOK_QUIZZES[bookId];
    if (!qs || qs.length === 0) {
      // no quiz — mark directly as completed
      completeBook(bookId);
      return;
    }
    setQuizBookId(bookId);
    setQuizBookTitle(bookTitle);
    setQuizQuestions(qs);
  }

  function handleQuizPass() {
    if (quizBookId) completeBook(quizBookId);
    setQuizBookId(null);
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">جارٍ التحميل…</div>
      </div>
    );
  }

  if (notFound || !science) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">📚</div>
        <p className="text-gray-500">العلم غير موجود</p>
        <Link href="/learning-path">
          <span className="text-emerald-600 hover:underline cursor-pointer text-sm">← العودة للخارطة</span>
        </Link>
      </div>
    );
  }

  // progress source: API when logged in with live data, local otherwise
  const effectiveProgress = isStaticMode ? localProgress : apiProgress;
  const allBooks   = levels.flatMap((l) => l.books);
  const completedCount = isStaticMode
    ? allBooks.filter((b) => getStatus(b.id) === "completed").length
    : allBooks.filter((b) => effectiveProgress.find((p) => p.book_id === b.id && p.status === "completed")).length;
  const pct = allBooks.length > 0 ? Math.round((completedCount / allBooks.length) * 100) : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Hero */}
      <div
        className="relative py-10 px-4"
        style={{ background: `linear-gradient(135deg, ${science.color}ee, ${science.color}99)` }}
      >
        <div className="max-w-4xl mx-auto">
          <Link href="/learning-path">
            <span className="text-white/80 hover:text-white text-sm cursor-pointer inline-flex items-center gap-1 mb-4">
              ← خارطة طالب العلم
            </span>
          </Link>
          <div className="flex items-start gap-4">
            <span className="text-5xl">{science.icon}</span>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">{science.name}</h1>
              {science.description && (
                <p className="text-white/80 text-sm leading-relaxed max-w-xl">{science.description}</p>
              )}
              {allBooks.length > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 max-w-xs h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-white/80 text-xs">{completedCount}/{allBooks.length} كتاب</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* لماذا تدرس هذا العلم */}
      {science.why_study && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
            <p className="text-emerald-800 dark:text-emerald-300 text-sm leading-relaxed">
              <strong>💡 لماذا تدرس {science.name}؟ </strong>
              {science.why_study}
            </p>
          </div>
        </div>
      )}

      {/* دليل الاستخدام في الوضع الثابت */}
      {isStaticMode && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
            📖 اضغط <strong>«ابدأ القراءة»</strong> لتسجيل بدء الكتاب، ثم بعد الإنتهاء اضغط <strong>«اختبر نفسك»</strong> — اجتز 60% من الأسئلة لإتمام المقرر. يُحفظ تقدّمك في المتصفح.
          </div>
        </div>
      )}

      {/* المستويات */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <h2 className="font-bold text-gray-800 dark:text-white text-lg mb-6">مسار التعلم</h2>
        {levels.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">📖</div>
            <p>لم تُضَف كتب لهذا العلم بعد</p>
          </div>
        ) : (
          <Suspense fallback={<div className="text-gray-400 text-center py-8">جارٍ التحميل…</div>}>
            <LevelTimeline
              levels={levels}
              _scienceSlug={science.slug}
              progress={effectiveProgress}
              onStartBook={isStaticMode ? startBook : undefined}
              onOpenQuiz={isStaticMode ? handleOpenQuiz : undefined}
            />
          </Suspense>
        )}
      </div>

      {/* نافذة الاختبار */}
      {quizBookId && quizQuestions.length > 0 && (
        <Suspense fallback={null}>
          <QuizModal
            quizzes={quizQuestions}
            token={null}
            bookTitle={quizBookTitle}
            onClose={() => setQuizBookId(null)}
            onPass={handleQuizPass}
          />
        </Suspense>
      )}
    </div>
  );
}
