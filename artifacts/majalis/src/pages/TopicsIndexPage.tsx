import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchAllTopics } from "@/lib/scholarly-intelligence-service";

const CATEGORY_LABELS: Record<string, string> = {
  fiqh: "الفقه",
  aqeedah: "العقيدة",
  akhlaq: "الأخلاق",
  quran: "القرآن",
  hadith: "الحديث",
};

export default function TopicsIndexPage() {
  const [topics, setTopics] = useState<Array<{ slug: string; title: string; category?: string }>>([]);

  useEffect(() => {
    fetchAllTopics().then(setTopics);
  }, []);

  const grouped = topics.reduce<Record<string, typeof topics>>((acc, t) => {
    const cat = t.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="page-shell narrow">
      <h1 className="search-page-title">الموضوعات العلمية</h1>
      <p className="search-page-hint">
        استكشف المحتوى الشرعي مجمعًا حسب الموضوع — آيات، أحاديث، فتاوى، دروس، كتب، والمزيد.
      </p>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            {CATEGORY_LABELS[category] || category}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
            {items.map((t) => (
              <Link
                key={t.slug}
                href={`/topics/${t.slug}`}
                style={{
                  display: "block",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--line, #e5e7eb)",
                  textDecoration: "none",
                  textAlign: "center",
                  fontWeight: 600,
                  background: "var(--panel, #fff)",
                }}
              >
                {t.title}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
