import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { SkeletonPage } from "@/components/ui-common";
import {
  fetchLearningPath,
  enrollInLearningPath,
  updateLearningProgress,
  fetchLessonInsights,
  issueLearningCertificate,
  levelLabel,
  moduleLabel,
  type LearningModule,
} from "@/lib/digital-learning-service";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { applyPageSeo } from "@/lib/seo";
import {
  BookOpen, Video, FileQuestion, BookMarked, CheckSquare,
  CheckCircle2, ChevronRight, PlayCircle, Clock, GraduationCap,
  BarChart3, UserPlus, type LucideProps,
} from "lucide-react";

// ── Module type icon map ──────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<Omit<LucideProps, "ref">>;

const MOD_ICONS: Record<string, LucideIcon> = {
  lesson:   BookOpen,
  lecture:  Video,
  quiz:     FileQuestion,
  book:     BookMarked,
  task:     CheckSquare,
  video:    Video,
};

function ModIcon({ type }: { type: string }) {
  const Icon = MOD_ICONS[type] ?? BookOpen;
  return <Icon size={15} strokeWidth={1.6} aria-hidden />;
}

// ── Progress Ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r    = 30;
  const circ = 2 * Math.PI * r;
  const off  = circ - (Math.min(100, pct) / 100) * circ;
  return (
    <div className="lpd2-ring" aria-label={`${Math.round(pct)}% مكتمل`}>
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
        <circle cx="38" cy="38" r={r} strokeWidth="6" className="lpd2-ring__track" fill="none" />
        <circle
          cx="38" cy="38" r={r} strokeWidth="6" className="lpd2-ring__fill" fill="none"
          strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round"
          transform="rotate(-90 38 38)"
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div className="lpd2-ring__pct">{Math.round(pct)}%</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LearningPathDetailPage() {
  const params = useParams();
  const slug = params.slug || "";

  const [loading,    setLoading]    = useState(true);
  const [path,       setPath]       = useState<Record<string, unknown> | null>(null);
  const [modules,    setModules]    = useState<LearningModule[]>([]);
  const [nextModule, setNextModule] = useState<LearningModule | null>(null);
  const [progressPct,setProgressPct]= useState(0);
  const [insights,   setInsights]   = useState<Record<string, unknown> | null>(null);
  const [enrolled,   setEnrolled]   = useState(false);
  const [completed,  setCompleted]  = useState<Set<string>>(new Set());
  const [enrolling,  setEnrolling]  = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/learning/path",
      title: "مسار تعليمي | المجلس العلمي",
      description: "تفاصيل مسار التعلم الإسلامي، الدروس والوحدات والاختبارات وشهادة الإتمام.",
      keywords: ["مسار تعليمي", "تعلم إسلامي", "وحدات دراسية", "شهادة إتمام"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: "مسار تعليمي شرعي",
          url: `https://majlisilm.com/learning/paths/${slug}`,
          description: "تفاصيل مسار التعلم الإسلامي، الدروس والوحدات والاختبارات وشهادة الإتمام",
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
          inLanguage: "ar",
        },
      ],
    });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetchLearningPath(slug)
      .then((data) => {
        setPath(data.path ?? null);
        setModules(data.modules ?? []);
        setNextModule(data.next_module ?? null);
        setProgressPct(data.progress_pct ?? 0);
        setEnrolled(!!data.enrolled);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollInLearningPath(slug);
      setEnrolled(true);
    } finally {
      setEnrolling(false);
    }
  };

  const handleComplete = async (mod: LearningModule) => {
    const result = await updateLearningProgress({
      pathSlug: slug,
      moduleId: mod.id,
      status: "completed",
    });
    const newPct = result.progress_pct ?? 0;
    setProgressPct(newPct);
    setCompleted((prev) => new Set(prev).add(mod.id));
    setNextModule(result.next_module ?? null);

    const ai = await fetchLessonInsights({
      pathSlug: slug,
      moduleId: mod.id,
      moduleTitle: mod.title,
    });
    setInsights(ai ?? null);

    if (newPct >= 100) {
      await issueLearningCertificate(slug, 100);
    }
  };

  if (loading) return <SkeletonPage />;
  if (!path)   return <div className="page-shell"><p>المسار غير موجود.</p></div>;

  const title        = path.title        as string | undefined ?? "";
  const description  = path.description  as string | undefined ?? "";
  const level        = path.level        as string | undefined ?? "";
  const estHours     = path.estimated_hours as number | undefined;

  return (
    <div className="page-shell narrow lpd2-page" dir="rtl">

      {/* ── Hero ── */}
      <div className="lpd2-hero">
        <nav className="lpd2-breadcrumb" aria-label="مسار التنقل">
          <Link href="/learning/paths">المسارات</Link>
          <ChevronRight size={13} aria-hidden="true" />
          <span>{title}</span>
        </nav>

        <div className="lpd2-hero__body">
          <div className="lpd2-hero__info">
            <div className="lpd2-hero__badges">
              <span className="lpd2-badge lpd2-badge--level">
                <BarChart3 size={11} aria-hidden="true" /> {levelLabel(level)}
              </span>
              {estHours && (
                <span className="lpd2-badge lpd2-badge--hours">
                  <Clock size={11} aria-hidden="true" /> {estHours} ساعة
                </span>
              )}
              <span className="lpd2-badge lpd2-badge--mods">
                <BookOpen size={11} aria-hidden="true" /> {modules.length} وحدة
              </span>
            </div>
            <h1 className="lpd2-hero__title">{title}</h1>
            {description && <p className="lpd2-hero__desc">{description}</p>}
          </div>

          <ProgressRing pct={progressPct} />
        </div>

        {/* شريط التقدم */}
        {progressPct > 0 && (
          <div className="lpd2-hero__bar" aria-hidden="true">
            <div className="lpd2-hero__bar-fill" style={{ width: `${Math.min(100, progressPct)}%` }} />
          </div>
        )}
      </div>

      {/* ── زر التسجيل ── */}
      {!enrolled && (
        <button
          type="button"
          onClick={handleEnroll}
          disabled={enrolling}
          className="lpd2-enroll-btn"
          aria-busy={enrolling}
        >
          <UserPlus size={16} aria-hidden="true" />
          {enrolling ? "جارٍ التسجيل…" : "سجّل في المسار مجاناً"}
        </button>
      )}

      {/* ── الدرس التالي ── */}
      {nextModule && (
        <div className="lpd2-next">
          <PlayCircle size={18} strokeWidth={1.6} className="lpd2-next__icon" aria-hidden="true" />
          <div className="lpd2-next__body">
            <p className="lpd2-next__eyebrow">الدرس التالي</p>
            <p className="lpd2-next__title">{nextModule.title}</p>
          </div>
          <button
            type="button"
            className="lpd2-next__btn"
            onClick={() => handleComplete(nextModule)}
          >
            إكمال
          </button>
        </div>
      )}

      {/* ── قائمة الوحدات ── */}
      <h2 className="lpd2-section-title">محتوى المسار</h2>
      <div className="lpd2-modules">
        {modules.map((mod, i) => {
          const isDone = completed.has(mod.id);
          return (
            <div
              key={mod.id}
              className={`lpd2-module${isDone ? " lpd2-module--done" : ""}`}
            >
              {/* رقم + أيقونة النوع */}
              <div className="lpd2-module__num" aria-hidden="true">
                {isDone
                  ? <CheckCircle2 size={18} strokeWidth={2} className="lpd2-module__check" />
                  : <span>{i + 1}</span>
                }
              </div>

              {/* المحتوى */}
              <div className="lpd2-module__body">
                <span className="lpd2-module__type-row">
                  <ModIcon type={mod.module_type} />
                  {moduleLabel(mod.module_type)}
                </span>
                <h3 className="lpd2-module__title">{mod.title}</h3>
                {mod.description && (
                  <p className="lpd2-module__desc">{mod.description}</p>
                )}
              </div>

              {/* الإجراء */}
              <div className="lpd2-module__action">
                {isDone ? (
                  <span className="lpd2-module__done-tag">
                    <GraduationCap size={12} aria-hidden="true" /> مكتمل
                  </span>
                ) : mod.module_type === "quiz" ? (
                  <Link href={`/learning/quiz/${slug}`} className="lpd2-quiz-btn">
                    ابدأ الاختبار
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleComplete(mod)}
                    className="lpd2-complete-btn"
                  >
                    إكمال
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── لوحة AI Insights ── */}
      {insights && (
        <aside className="lpd2-insights">
          <h2 className="lpd2-insights__title">ملخص الدرس</h2>
          <p className="lpd2-insights__summary">{String(insights.summary ?? "")}</p>
          {Array.isArray(insights.key_points) && insights.key_points.length > 0 && (
            <ul className="lpd2-insights__points">
              {(insights.key_points as string[]).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {!!insights.disclaimer && (
            <p className="lpd2-insights__disclaimer">{String(insights.disclaimer)}</p>
          )}
        </aside>
      )}

      <div className="twh-share">
        <ShareButtons
          title="تفاصيل المسار التعليمي — المجلس العلمي"
          url="https://majlisilm.com/learning/paths"
        />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz
          categoryId={["fiqh", "aqeeda", "hadith"]}
          title="اختبر معلوماتك في العلوم الشرعية"
          count={4}
        />
      </div>
    </div>
  );
}
