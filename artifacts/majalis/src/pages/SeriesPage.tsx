import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { getLessonSeries, seriesProgress } from "@/lib/platform-api";
import type { LessonSeries } from "@/lib/platform-types";
import { SERIES_CATEGORIES } from "@/lib/platform-types";
import { FavoriteButton } from "@/components/platform/FavoriteButton";

export default function SeriesPage() {
  const [series, setSeries] = useState<LessonSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLessonSeries().then(setSeries).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="التأصيل"
        title="السلاسل العلمية"
        subtitle="متابعة السلاسل ونسبة الإنجاز وآخر درس."
      />

      {loading && <Loading />}

      {SERIES_CATEGORIES.map((cat) => {
        const items = series.filter((s) => s.category === cat);
        if (!items.length) return null;
        return (
          <section key={cat} className="home-section">
            <h2 className="series-category-title">{cat}</h2>
            <div className="series-grid">
              {items.map((item) => {
                const pct = seriesProgress(item);
                return (
                  <article key={item.id} className="ui-card series-card series-card--full">
                    <h3>{item.title}</h3>
                    <p>{item.sheikh_name}</p>
                    <p>{item.description}</p>
                    <div className="series-progress-bar"><span style={{ width: `${pct}%` }} /></div>
                    <p className="series-progress-label">{pct}% مكتمل — {item.completed_lessons} درس من {item.total_lessons}</p>
                    <div className="series-card-actions">
                      <FavoriteButton itemType="series" itemId={item.id} />
                      <Link href="/lessons" className="ui-card-btn ui-card-btn--ghost">الدروس</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
