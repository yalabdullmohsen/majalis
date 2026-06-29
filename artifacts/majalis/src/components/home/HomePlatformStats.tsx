import { useEffect, useState } from "react";
import { IslamicHeadingOrnament } from "@/components/islamic/IslamicOrnament";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { getSheikhs } from "@/lib/supabase";
import { getResearchPapers } from "@/lib/scientific-research/service";
import { getQuranScientificCircles } from "@/lib/quran-scientific-circles-service";

type Stats = {
  lessons: number;
  sheikhs: number;
  research: number;
  circles: number;
};

export function HomePlatformStats() {
  const [stats, setStats] = useState<Stats>({ lessons: 0, sheikhs: 0, research: 0, circles: 0 });

  useEffect(() => {
    Promise.all([
      getUnifiedActiveLessons().then((r) => (Array.isArray(r.lessons) ? r.lessons.length : 0)),
      getSheikhs().then((r) => (Array.isArray(r.data) ? r.data.length : 0)),
      getResearchPapers({ limit: 200 }).then((r) => (Array.isArray(r.data) ? r.data.length : 0)),
      getQuranScientificCircles({ tab: "all" }).then((r) => (r.data || []).length),
    ])
      .then(([lessons, sheikhs, research, circles]) => setStats({ lessons, sheikhs, research, circles }))
      .catch(() => {});
  }, []);

  const items = [
    { label: "درس نشط", value: stats.lessons },
    { label: "شيخ", value: stats.sheikhs },
    { label: "بحث علمي", value: stats.research },
    { label: "حلقة علمية", value: stats.circles },
  ];

  return (
    <section className="home-section" aria-labelledby="home-stats-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">منصة متنامية</p>
          <h2 id="home-stats-heading">إحصائيات المنصة</h2>
          <IslamicHeadingOrnament />
        </div>
      </div>
      <div className="home-stats-grid">
        {items.map((item) => (
          <div key={item.label} className="home-stat-card ui-card--ornate">
            <strong>{item.value > 0 ? item.value.toLocaleString("ar") : "—"}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HomePlatformStats;
