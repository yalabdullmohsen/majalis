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

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link href="/my-learning" style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", background: "var(--emerald-deep, #065f46)", color: "#fff", textDecoration: "none" }}>
          لوحتي التعليمية
        </Link>
        <Link href="/learning/quiz" style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid var(--line)", textDecoration: "none" }}>
          الاختبارات
        </Link>
        <Link href="/learning/calendar" style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid var(--line)", textDecoration: "none" }}>
          التقويم العلمي
        </Link>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>
            {CATEGORY_LABELS[category] || category}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {items.map((path) => (
              <Link key={path.slug} href={`/learning/paths/${path.slug}`} style={{ textDecoration: "none" }}>
                <article style={{ padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid var(--line, #e5e7eb)", background: "var(--panel, #fff)", height: "100%" }}>
                  <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--emerald-deep)" }}>{path.title}</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                    {path.description}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.75rem" }}>
                    <span style={{ padding: "0.125rem 0.5rem", borderRadius: "999px", background: "var(--panel-soft, #f3f4f6)" }}>
                      {levelLabel(path.level)}
                    </span>
                    {path.estimated_hours && (
                      <span style={{ padding: "0.125rem 0.5rem", borderRadius: "999px", background: "var(--panel-soft, #f3f4f6)" }}>
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
