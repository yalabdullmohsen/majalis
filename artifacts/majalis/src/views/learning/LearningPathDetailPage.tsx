import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Loading } from "@/components/ui-common";
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
import { applyPageSeo } from "@/lib/seo";

export default function LearningPathDetailPage() {
  const params = useParams();
  const slug = params.slug || "";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/learning/path",
      title: "مسار تعليمي | المجلس العلمي",
      description: "تفاصيل مسار التعلم الإسلامي — الدروس والوحدات والاختبارات وشهادة الإتمام.",
      keywords: ["مسار تعليمي", "تعلم إسلامي", "وحدات دراسية", "شهادة إتمام"],
    });
  }, []);
  const [path, setPath] = useState<any>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [nextModule, setNextModule] = useState<LearningModule | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [insights, setInsights] = useState<any>(null);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchLearningPath(slug)
      .then((data) => {
        setPath(data.path);
        setModules(data.modules || []);
        setNextModule(data.next_module || null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleEnroll = async () => {
    await enrollInLearningPath(slug);
    setEnrolled(true);
  };

  const handleComplete = async (mod: LearningModule) => {
    const result = await updateLearningProgress({
      pathSlug: slug,
      moduleId: mod.id,
      status: "completed",
    });
    setProgressPct(result.progress_pct || 0);

    const ai = await fetchLessonInsights({
      pathSlug: slug,
      moduleId: mod.id,
      moduleTitle: mod.title,
    });
    setInsights(ai);

    if (result.progress_pct >= 100) {
      await issueLearningCertificate(slug, 100);
    }
  };

  if (loading) return <Loading />;
  if (!path) return <div className="page-shell"><p>المسار غير موجود</p></div>;

  return (
    <div className="page-shell narrow">
      <nav className="lpd-breadcrumb">
        <Link href="/learning/paths">المسارات</Link> / {path.title}
      </nav>

      <h1 className="lpd-title">{path.title}</h1>
      <p className="lpd-subtitle">{path.description}</p>

      <div className="lpd-meta">
        <span className="lpd-badge lpd-badge--level">{levelLabel(path.level)}</span>
        {progressPct > 0 && (
          <span className="lpd-badge lpd-badge--progress">{progressPct}% مكتمل</span>
        )}
      </div>

      {!enrolled && (
        <button type="button" onClick={handleEnroll} className="lpd-enroll-btn">
          التسجيل في المسار
        </button>
      )}

      {nextModule && (
        <aside className="lpd-next-module">
          <strong>الدرس التالي:</strong> {nextModule.title}
        </aside>
      )}

      <h2 className="lpd-section-title">محتوى المسار</h2>
      <div className="lpd-modules-grid">
        {modules.map((mod) => (
          <div key={mod.id} className="lpd-module">
            <div>
              <span className="lpd-module__type">{moduleLabel(mod.module_type)}</span>
              <h3 className="lpd-module__title">{mod.title}</h3>
              {mod.description && <p className="lpd-module__desc">{mod.description}</p>}
            </div>
            <div className="lpd-module__actions">
              {mod.module_type === "quiz" ? (
                <Link href={`/learning/quiz/${slug}`} className="lpd-quiz-link">
                  ابدأ الاختبار
                </Link>
              ) : (
                <button type="button" onClick={() => handleComplete(mod)} className="lpd-complete-btn">
                  إكمال
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {insights && (
        <aside className="lpd-insights">
          <h2 className="lpd-insights__title">ملخص الدرس (AI)</h2>
          <p className="lpd-insights__summary">{insights.summary}</p>
          {insights.key_points?.length > 0 && (
            <ul className="lpd-insights__points">
              {insights.key_points.map((p: string) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <p className="lpd-insights__disclaimer">{insights.disclaimer}</p>
        </aside>
      )}
    </div>
  );
}
