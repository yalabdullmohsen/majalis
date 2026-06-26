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

export default function LearningPathDetailPage() {
  const params = useParams();
  const slug = params.slug || "";
  const [loading, setLoading] = useState(true);
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
      <nav style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
        <Link href="/learning/paths">المسارات</Link> / {path.title}
      </nav>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>{path.title}</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: "1rem" }}>{path.description}</p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <span style={{ padding: "0.25rem 0.75rem", borderRadius: "999px", background: "var(--panel-soft)" }}>{levelLabel(path.level)}</span>
        {progressPct > 0 && (
          <span style={{ padding: "0.25rem 0.75rem", borderRadius: "999px", background: "var(--emerald-light, #d1fae5)" }}>
            {progressPct}% مكتمل
          </span>
        )}
      </div>

      {!enrolled && (
        <button type="button" onClick={handleEnroll} style={{ marginBottom: "1.5rem", padding: "0.625rem 1.25rem", borderRadius: "0.375rem", background: "var(--emerald-deep)", color: "#fff", border: "none", cursor: "pointer" }}>
          التسجيل في المسار
        </button>
      )}

      {nextModule && (
        <aside style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)", marginBottom: "1.5rem", background: "var(--panel-soft, #f9fafb)" }}>
          <strong>الدرس التالي:</strong> {nextModule.title}
        </aside>
      )}

      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>محتوى المسار</h2>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {modules.map((mod) => (
          <div key={mod.id} style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>{moduleLabel(mod.module_type)}</span>
              <h3 style={{ fontWeight: 600, marginTop: "0.125rem" }}>{mod.title}</h3>
              {mod.description && <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>{mod.description}</p>}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
              {mod.module_type === "quiz" ? (
                <Link href={`/learning/quiz/${slug}`} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", background: "var(--emerald-deep)", color: "#fff", textDecoration: "none", fontSize: "0.875rem" }}>
                  ابدأ الاختبار
                </Link>
              ) : (
                <button type="button" onClick={() => handleComplete(mod)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--emerald-deep)", background: "transparent", cursor: "pointer", fontSize: "0.875rem" }}>
                  إكمال
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {insights && (
        <aside style={{ marginTop: "2rem", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>ملخص الدرس (AI)</h2>
          <p style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>{insights.summary}</p>
          {insights.key_points?.length > 0 && (
            <ul style={{ fontSize: "0.8125rem", paddingInlineStart: "1.25rem" }}>
              {insights.key_points.map((p: string) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <p style={{ fontSize: "0.7rem", color: "var(--ink-soft)", marginTop: "0.75rem" }}>{insights.disclaimer}</p>
        </aside>
      )}
    </div>
  );
}
