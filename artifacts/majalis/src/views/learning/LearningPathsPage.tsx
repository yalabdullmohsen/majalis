import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { fetchLearningPaths, levelLabel, type LearningPath } from "@/lib/digital-learning-service";

const CATEGORY_LABELS: Record<string, string> = {
  aqeedah: "العقيدة",
  hadith: "الحديث",
  fiqh: "الفقه",
  quran: "القرآن",
  seerah: "السيرة",
  akhlaq: "الأخلاق",
  language: "اللغة",
  dawah: "الدعوة",
  tarbiyah: "التربية",
};

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningPaths()
      .then(setPaths)
      .finally(() => setLoading(false));
  }, []);

  const grouped = paths.reduce<Record<string, LearningPath[]>>((acc, p) => {
    const cat = p.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  if (loading) return <Loading />;

  return (
    <div className="page-shell">
      <PageHeader title="المسارات العلمية" subtitle="ابدأ رحلتك في طلب العلم — مسارات منظمة من المبتدئ إلى المتقدم" />

      <div className="lpp-nav-links">
        <Link href="/my-learning" className="lpp-nav-link lpp-nav-link--primary">
          لوحتي التعليمية
        </Link>
        <Link href="/learning/quiz" className="lpp-nav-link lpp-nav-link--outline">
          الاختبارات
        </Link>
        <Link href="/learning/calendar" className="lpp-nav-link lpp-nav-link--outline">
          التقويم العلمي
        </Link>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="lpp-category">
          <h2 className="lpp-category-title">
            {CATEGORY_LABELS[category] || category}
          </h2>
          <div className="lpp-paths-grid">
            {items.map((path) => (
              <Link key={path.slug} href={`/learning/paths/${path.slug}`} className="lpp-path-link">
                <article className="lpp-path-card">
                  <h3 className="lpp-path-card__title">{path.title}</h3>
                  <p className="lpp-path-card__desc">
                    {path.description}
                  </p>
                  <div className="lpp-path-card__meta">
                    <span className="lpp-path-card__badge">
                      {levelLabel(path.level)}
                    </span>
                    {path.estimated_hours && (
                      <span className="lpp-path-card__badge">
                        ~{path.estimated_hours} ساعة
                      </span>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
