import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Users } from "lucide-react";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { IslamicHeadingOrnament } from "@/components/islamic/IslamicOrnament";
import { getQuranScientificCircles } from "@/lib/quran-scientific-circles-service";
import type { QuranScientificCircle } from "@/lib/quran-scientific-circles-types";
import { displayText } from "@/lib/display-text";

export function HomeCirclesSection() {
  const [circles, setCircles] = useState<QuranScientificCircle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuranScientificCircles({ tab: "all" })
      .then((res) => setCircles((res.data || []).slice(0, 6)))
      .catch(() => setCircles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section" aria-labelledby="home-circles-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">طلب العلم</p>
          <h2 id="home-circles-heading">الحلقات القرآنية والعلمية</h2>
          <IslamicHeadingOrnament />
        </div>
        <Link href="/quran-scientific-circles" className="home-section-link">
          جميع الحلقات
        </Link>
      </div>
      <PageLoadingGuard loading={loading} empty={!loading && circles.length === 0} emptyText="لا حلقات حالياً">
        <div className="home-circles-grid">
          {circles.map((circle) => (
            <Link
              key={circle.id}
              href={`/quran-scientific-circles/${circle.id}`}
              className="home-mini-card ui-card--ornate"
            >
              <Users size={18} strokeWidth={1.75} aria-hidden="true" color="var(--ds-emerald)" />
              <h3>{displayText(circle.title)}</h3>
              <p>
                {[circle.sheikh_name, circle.governorate].filter(Boolean).join(" · ") ||
                  circle.summary?.slice(0, 80)}
              </p>
            </Link>
          ))}
        </div>
      </PageLoadingGuard>
    </section>
  );
}

export default HomeCirclesSection;
