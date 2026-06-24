import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getLessonSeries, seriesProgress } from "@/lib/platform-api";
import type { LessonSeries } from "@/lib/platform-types";
import { SERIES_CATEGORIES } from "@/lib/platform-types";

export function HomeSeriesSection() {
  const [series, setSeries] = useState<LessonSeries[]>([]);

  useEffect(() => {
    getLessonSeries().then(setSeries);
  }, []);

  const grouped = SERIES_CATEGORIES.map((cat) => ({
    category: cat,
    items: series.filter((s) => s.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <section className="home-section" aria-labelledby="series-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">التأصيل العلمي</p>
          <h2 id="series-heading">السلاسل العلمية</h2>
        </div>
        <Link href="/series" className="home-section-link">عرض الكل</Link>
      </div>
      {grouped.map((group) => (
        <div key={group.category} className="series-category-block">
          <h3 className="series-category-title">{group.category}</h3>
          <div className="series-grid">
            {group.items.map((item) => {
              const pct = seriesProgress(item);
              return (
                <Link key={item.id} href="/series" className="ui-card series-card">
                  <h4>{item.title}</h4>
                  <p>{item.sheikh_name}</p>
                  <div className="series-progress-bar" aria-hidden="true">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <p className="series-progress-label">{pct}% مكتمل — {item.completed_lessons} من {item.total_lessons}</p>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
