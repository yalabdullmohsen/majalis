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
        <section key={category} className="tip-section">
          <h2 className="tip-section-title">
            {CATEGORY_LABELS[category] || category}
          </h2>
          <div className="tip-grid">
            {items.map((t) => (
              <Link key={t.slug} href={`/topics/${t.slug}`} className="tip-link">
                {t.title}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
