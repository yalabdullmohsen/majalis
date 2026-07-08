import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { applyPageSeo } from "@/lib/seo";
import { supabase } from "@/lib/supabase";
import type { LPBookDetail, LPExplanation, LPBenefit, LPQuiz, LPProgress } from "@/lib/learning-path-service";
import { fetchBook, fetchProgress, updateProgress, DIFFICULTY_LABELS } from "@/lib/learning-path-service";

const QuizModal = lazy(() =>
  import("@/components/learning-path/QuizModal").then((m) => ({ default: m.QuizModal }))
);

const EXPLANATION_ICONS = { audio: "🎙️", video: "📹", text: "📝" };

export default function LearningPathBookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    applyPageSeo({
      path: "/learning-path/book",
      title: "كتاب في مسار التعلم | المجلس العلمي",
      description: "تصفّح محتوى الكتاب في مسار التعلم الشرعي — شروح وملاحظات وتتبع تقدمك في القراءة.",
      keywords: ["كتاب شرعي", "مسار تعلم", "قراءة علمية", "شرح كتاب", "تعليم إسلامي"],
    });
  }, []);
  const tokenRef = useRef<string | null>(null);
  const [book, setBook]             = useState<LPBookDetail | null>(null);
  const [explanations, setExp]      = useState<LPExplanation[]>([]);
  const [benefits, setBenefits]     = useState<LPBenefit[]>([]);
  const [quizzes, setQuizzes]       = useState<LPQuiz[]>([]);
  const [progress, setProgress]     = useState<LPProgress | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [quizOpen, setQuizOpen]     = useState(false);
  const [saveMsg, setSaveMsg]       = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);

    const bookP = fetchBook(bookId);
    const progP = isLoggedIn
      ? supabase.auth.getSession().then(({ data }) => {
          tokenRef.current = data.session?.access_token ?? null;
          return tokenRef.current
            ? fetchProgress(tokenRef.current).catch(() => [] as LPProgress[])
            : [] as LPProgress[];
        })
      : Promise.resolve([] as LPProgress[]);

    Promise.all([bookP, progP])
      .then(([d, p]) => {
        setBook(d.book);
        setExp(d.explanations);
        setBenefits(d.benefits);
        setQuizzes(d.quizzes);
        const mine = p.find((x) => x.book_id === bookId) ?? null;
        setProgress(mine);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [bookId, isLoggedIn]);

  const handleStatus = useCallback(async (status: LPProgress["status"]) => {
    if (!isLoggedIn || !bookId || saving) return;
    const token = tokenRef.current ?? (await supabase.auth.getSession()).data.session?.access_token ?? null;
    if (!token) return;
    setSaving(true);
    try {
      await updateProgress(token, bookId, status);
      setProgress((prev) => ({ ...(prev ?? { book_id: bookId, progress_percent: 0, started_at: null, completed_at: null }), status }));
      setSaveMsg(status === "completed" ? "✅ تم تسجيل إتمام الكتاب!" : "✅ تم تسجيل البدء!");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg("❌ حدث خطأ، حاول مجدداً");
      setTimeout(() => setSaveMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [isLoggedIn, bookId, saving]);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)] flex items-center justify-center">
        <div className="text-[var(--majalis-ink-soft)] opacity-60">جارٍ التحميل…</div>
      </div>
    );
  }

  if (notFound || !book) {
    return (
      <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)] flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">📚</div>
        <p className="text-[var(--majalis-ink-soft)]">الكتاب غير موجود</p>
        <Link href="/learning-path">
          <span className="text-[var(--majalis-emerald)] hover:underline cursor-pointer text-sm">← العودة للخارطة</span>
        </Link>
      </div>
    );
  }

  const status = progress?.status ?? "not_started";

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)] pb-24">
      {/* Breadcrumb */}
      <div className="bg-[var(--majalis-panel)] border-b border-[var(--majalis-line)] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-[var(--majalis-ink-soft)] flex-wrap">
          <Link href="/learning-path"><span className="hover:text-[var(--majalis-emerald)] cursor-pointer">الخارطة</span></Link>
          <span>›</span>
          <Link href={`/learning-path/${book.science.slug}`}>
            <span className="hover:text-[var(--majalis-emerald)] cursor-pointer">{book.science.name}</span>
          </Link>
          <span>›</span>
          <span className="text-[var(--majalis-ink)] font-medium line-clamp-1">{book.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* العمود الأيسر — معلومات الكتاب */}
          <div className="md:col-span-1">
            {/* غلاف */}
            <div
              className="rounded-2xl h-52 flex items-center justify-center mb-4 overflow-hidden lpb-cover"
              style={{ "--book-color": book.science.color } as React.CSSProperties}
            >
              {book.cover_image_url ? (
                <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-7xl opacity-50">📗</span>
              )}
            </div>

            {/* بيانات الكتاب */}
            <div className="bg-[var(--majalis-panel)] rounded-2xl border border-[var(--majalis-line)] p-4 space-y-3">
              {[
                { label: "العلم",      value: book.science.name },
                { label: "المستوى",   value: book.level.name },
                { label: "الصعوبة",   value: DIFFICULTY_LABELS[book.difficulty] },
                book.estimated_hours > 0 && { label: "الوقت التقديري", value: `${book.estimated_hours} ساعة` },
                book.pages_count > 0    && { label: "عدد الصفحات",    value: `${book.pages_count} صفحة` },
              ].filter(Boolean).map((item) => item && (
                <div key={item.label} className="flex justify-between items-center text-sm">
                  <span className="text-[var(--majalis-ink-soft)]">{item.label}</span>
                  <span className="font-medium text-[var(--majalis-ink)]">{item.value}</span>
                </div>
              ))}
            </div>

            {/* روابط */}
            <div className="mt-3 flex flex-col gap-2">
              {book.pdf_url && (
                <a href={book.pdf_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 rounded-xl border border-[var(--majalis-emerald)] text-[var(--majalis-emerald)] text-sm hover:bg-[var(--majalis-emerald-muted)] transition-colors">
                  📄 تحميل PDF
                </a>
              )}
              {book.audio_url && (
                <a href={book.audio_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 rounded-xl border border-blue-200 text-blue-700 dark:text-blue-400 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  🎧 الاستماع الصوتي
                </a>
              )}
            </div>
          </div>

          {/* العمود الأيمن — المحتوى */}
          <div className="md:col-span-2 space-y-6">
            {/* العنوان والحالة */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-[var(--majalis-ink)] leading-tight">
                  {book.title}
                </h1>
                <span
                  className={`flex-shrink-0 text-xs font-medium px-3 py-1 rounded-full lpb-status lpb-status--${status === "completed" ? "completed" : status === "in_progress" ? "in-progress" : "pending"}`}
                >
                  {status === "completed" ? "✓ مكتمل" : status === "in_progress" ? "⏳ جاري" : "لم يبدأ"}
                </span>
              </div>
              {book.author && (
                <p className="text-sm text-gray-500 mb-3">✍️ {book.author}</p>
              )}
              {book.summary && (
                <p className="text-sm text-[var(--majalis-ink-soft)] leading-relaxed">{book.summary}</p>
              )}
            </div>

            {/* أزرار التقدم */}
            {isLoggedIn ? (
              <div className="flex flex-wrap gap-2">
                {status !== "in_progress" && status !== "completed" && (
                  <button
                    type="button"
                    onClick={() => handleStatus("in_progress")}
                    disabled={saving}
                    className="px-5 py-2 citation-btn citation-btn--primary text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    ▶ ابدأ قراءة الكتاب
                  </button>
                )}
                {status !== "completed" && (
                  <button
                    type="button"
                    onClick={() => handleStatus("completed")}
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    ✓ أنهيت الكتاب
                  </button>
                )}
                {quizzes.length > 0 && (
                  <button
                    onClick={() => setQuizOpen(true)}
                    className="px-5 py-2 border border-purple-300 text-purple-700 dark:text-purple-400 dark:border-purple-700 text-sm font-medium rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    📝 اختبر نفسك ({quizzes.length} سؤال)
                  </button>
                )}
              </div>
            ) : (
              <Link href="/login">
                <span className="inline-block px-5 py-2 border border-gray-200 text-[var(--majalis-ink-soft)] text-sm rounded-xl hover:bg-[var(--mn-surface-hover)] transition-colors cursor-pointer">
                  سجّل الدخول لتتبع تقدمك
                </span>
              </Link>
            )}
            {saveMsg && (
              <p className="text-sm font-medium text-[var(--majalis-emerald)]">{saveMsg}</p>
            )}

            {/* الشروحات */}
            {explanations.length > 0 && (
              <section>
                <h2 className="font-bold text-[var(--majalis-ink)] text-base mb-3">🎙️ شروحات الكتاب</h2>
                <div className="space-y-2">
                  {explanations.map((exp) => (
                    <div key={exp.id} className="flex items-center gap-3 p-3 bg-[var(--majalis-panel)] rounded-xl border border-[var(--majalis-line)]">
                      <span className="text-lg">{EXPLANATION_ICONS[exp.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--majalis-ink)]">{exp.sheikh_name}</p>
                        {exp.notes && <p className="text-xs text-[var(--majalis-ink-soft)] mt-0.5">{exp.notes}</p>}
                      </div>
                      {exp.url && (
                        <a href={exp.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[var(--majalis-emerald)] hover:underline flex-shrink-0">
                          اذهب →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* الفوائد */}
            {benefits.length > 0 && (
              <section>
                <h2 className="font-bold text-[var(--majalis-ink)] text-base mb-3">💡 فوائد من الكتاب</h2>
                <ul className="space-y-2">
                  {benefits.map((b) => (
                    <li key={b.id} className="flex gap-2 items-start text-sm text-[var(--majalis-ink-soft)]">
                      <span className="text-[var(--majalis-emerald)] mt-0.5 flex-shrink-0">•</span>
                      <span className="leading-relaxed">{b.content}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* نافذة الاختبار */}
      {quizOpen && (
        <Suspense fallback={null}>
          <QuizModal
            quizzes={quizzes}
            token={tokenRef.current}
            onClose={() => setQuizOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
