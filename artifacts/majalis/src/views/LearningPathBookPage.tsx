import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, CheckCircle2, Clock, Download, Headphones, HelpCircle, Lightbulb, Mic2, Music2, PenLine, ScrollText, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { supabase } from "@/lib/supabase";
import type { LPBookDetail, LPExplanation, LPBenefit, LPQuiz, LPProgress } from "@/lib/learning-path-service";
import { fetchBook, fetchProgress, updateProgress, DIFFICULTY_LABELS } from "@/lib/learning-path-service";

const QuizModal = lazy(() =>
  import("@/components/learning-path/QuizModal").then((m) => ({ default: m.QuizModal }))
);

const EXPLANATION_ICONS: Record<string, LucideIcon> = { audio: Mic2, video: Video, text: Music2 };

export default function LearningPathBookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { isLoggedIn } = useAuth();

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
        applyPageSeo({
          path: `/learning-path/book/${bookId}`,
          title: `${d.book.title} — مسار التعلم | المجلس العلمي`,
          description: d.book.summary
            ?? `تعلم كتاب ${d.book.title} في علم ${d.book.science.name} مع شروح وملاحظات وتتبع التقدم.`,
          keywords: [d.book.title, d.book.science.name, "مسار تعلم", "كتاب شرعي"],
          jsonLd: [{
            "@context": "https://schema.org",
            "@type": "Book",
            name: d.book.title,
            author: d.book.author ? { "@type": "Person", name: d.book.author } : undefined,
            url: `https://majlisilm.com/learning-path/book/${bookId}`,
            description: d.book.summary ?? `كتاب ${d.book.title} في ${d.book.science.name}`,
            inLanguage: "ar",
            publisher: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
          }],
        });
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
      setSaveMsg(status === "completed" ? "تم تسجيل إتمام الكتاب!" : "تم تسجيل البدء!");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg("حدث خطأ، حاول مجدداً");
      setTimeout(() => setSaveMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [isLoggedIn, bookId, saving]);

  if (loading) {
    return (
      <div dir="rtl" className="lpb-loading">
        <span className="txt-muted opacity-60">جارٍ التحميل…</span>
      </div>
    );
  }

  if (notFound || !book) {
    return (
      <div dir="rtl" className="lpb-not-found">
        <ScrollText size={48} strokeWidth={1.3} aria-hidden="true" />
        <p className="txt-muted">الكتاب غير موجود</p>
        <Link href="/learning-path">
          <span className="lpb-not-found__link cursor-pointer">← العودة للخارطة</span>
        </Link>
      </div>
    );
  }

  const status = progress?.status ?? "not_started";

  return (
    <div dir="rtl" className="lpb-shell">
      {/* Breadcrumb */}
      <nav className="lpb-breadcrumb" aria-label="مسار التنقل">
        <div className="lpb-breadcrumb__inner">
          <Link href="/learning-path">
            <span className="lpb-breadcrumb__link">الخارطة</span>
          </Link>
          <span>›</span>
          <Link href={`/learning-path/${book.science.slug}`}>
            <span className="lpb-breadcrumb__link">{book.science.name}</span>
          </Link>
          <span>›</span>
          <span className="lpb-breadcrumb__cur">{book.title}</span>
        </div>
      </nav>

      <div className="lpb-body">
        <div className="lpb-grid">

          {/* العمود الجانبي، معلومات الكتاب */}
          <div className="lpb-sidebar">
            {/* غلاف */}
            <div
              className="lpb-cover"
              style={{ "--book-color": book.science.color } as React.CSSProperties}
            >
              {book.cover_image_url ? (
                <img src={book.cover_image_url} alt={book.title} loading="lazy" />
              ) : (
                <BookOpen size={56} strokeWidth={1.2} className="opacity-50" />
              )}
            </div>

            {/* بيانات الكتاب */}
            <div className="lpb-info-card">
              {([
                { label: "العلم",            value: book.science.name },
                { label: "المستوى",          value: book.level.name },
                { label: "الصعوبة",          value: DIFFICULTY_LABELS[book.difficulty] },
                book.estimated_hours > 0 ? { label: "الوقت التقديري", value: `${book.estimated_hours} ساعة` } : null,
                book.pages_count > 0    ? { label: "عدد الصفحات",    value: `${book.pages_count} صفحة` }    : null,
              ] as ({ label: string; value: string } | null)[]).filter(Boolean).map((item) => item && (
                <div key={item.label} className="lpb-info-row">
                  <span className="lpb-info-label">{item.label}</span>
                  <span className="lpb-info-value">{item.value}</span>
                </div>
              ))}
            </div>

            {/* روابط الكتاب */}
            <div className="lpb-links">
              {book.pdf_url && (
                <a href={book.pdf_url} target="_blank" rel="noopener noreferrer" className="lpb-link-btn">
                  <Download size={14} aria-hidden="true" />تحميل PDF
                </a>
              )}
              {book.audio_url && (
                <a href={book.audio_url} target="_blank" rel="noopener noreferrer" className="lpb-link-btn lpb-link-btn--audio">
                  <Headphones size={14} aria-hidden="true" />الاستماع الصوتي
                </a>
              )}
            </div>
          </div>

          {/* المحتوى الرئيسي */}
          <div className="lpb-content">
            {/* العنوان والحالة */}
            <div>
              <div className="lpb-title-row">
                <h1 className="lpb-title">{book.title}</h1>
                <span className={`lpb-status-badge lpb-status--${status === "completed" ? "completed" : status === "in_progress" ? "in-progress" : "pending"}`}>
                  {status === "completed"
                    ? <><CheckCircle2 size={12} strokeWidth={2} aria-hidden="true" /> مكتمل</>
                    : status === "in_progress"
                    ? <><Clock size={12} strokeWidth={2} aria-hidden="true" /> جاري</>
                    : "لم يبدأ"}
                </span>
              </div>
              {book.author && (
                <p className="lpb-author"><PenLine size={13} aria-hidden="true" />{book.author}</p>
              )}
              {book.summary && <p className="lpb-summary">{book.summary}</p>}
            </div>

            {/* أزرار التقدم */}
            {isLoggedIn ? (
              <div className="lpb-actions">
                {status !== "in_progress" && status !== "completed" && (
                  <button type="button" onClick={() => handleStatus("in_progress")} disabled={saving}
                    className="lpb-btn-start citation-btn citation-btn--primary">
                    ▶ ابدأ قراءة الكتاب
                  </button>
                )}
                {status !== "completed" && (
                  <button type="button" onClick={() => handleStatus("completed")} disabled={saving}
                    className="lpb-btn-complete">
                    ✓ أنهيت الكتاب
                  </button>
                )}
                {quizzes.length > 0 && (
                  <button type="button" onClick={() => setQuizOpen(true)} className="lpb-btn-quiz">
                    <HelpCircle size={14} strokeWidth={1.8} aria-hidden="true" />
                    اختبر نفسك ({quizzes.length} سؤال)
                  </button>
                )}
              </div>
            ) : (
              <Link href="/login">
                <span className="lpb-login-btn">سجّل الدخول لتتبع تقدمك</span>
              </Link>
            )}
            {saveMsg && <p className="lpb-save-msg">{saveMsg}</p>}

            {/* الشروحات */}
            {explanations.length > 0 && (
              <section>
                <h2 className="lpb-section-title">
                  <Mic2 size={16} strokeWidth={1.8} aria-hidden="true" /> شروحات الكتاب
                </h2>
                <div className="lpb-exp-list">
                  {explanations.map((exp) => {
                    const I = EXPLANATION_ICONS[exp.type] ?? Music2;
                    return (
                      <div key={exp.id} className="lpb-exp-item">
                        <span className="lpb-exp-icon" aria-hidden="true"><I size={18} strokeWidth={1.6} /></span>
                        <div className="lpb-exp-info">
                          <p className="lpb-exp-sheikh">{exp.sheikh_name}</p>
                          {exp.notes && <p className="lpb-exp-notes">{exp.notes}</p>}
                        </div>
                        {exp.url && (
                          <a href={exp.url} target="_blank" rel="noopener noreferrer" className="lpb-exp-link">
                            اذهب →
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* الفوائد */}
            {benefits.length > 0 && (
              <section>
                <h2 className="lpb-section-title">
                  <Lightbulb size={16} strokeWidth={1.8} aria-hidden="true" /> فوائد من الكتاب
                </h2>
                <ul className="lpb-benefits">
                  {benefits.map((b) => (
                    <li key={b.id} className="lpb-benefit">
                      <span className="lpb-benefit__dot" aria-hidden="true">•</span>
                      <span className="lpb-benefit__txt">{b.content}</span>
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
      <div className="twh-share">
        <ShareButtons title="كتاب المسار التعليمي — المجلس العلمي" url="https://majlisilm.com/learning/books" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["fiqh", "aqeeda", "hadith"]} title="اختبر معلوماتك في العلوم الشرعية" count={4} />
      </div>
    </div>
  );
}
