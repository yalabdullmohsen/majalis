import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getQuranScientificCircles } from "@/lib/quran-scientific-circles-service";
import { Icon } from "@/lib/icons";

export function HomeCirclesSpotlight() {
  const [circles, setCircles] = useState<{ id: string; title: string; circle_type?: string }[]>([]);

  useEffect(() => {
    void getQuranScientificCircles({ tab: "all" })
      .then((list) => setCircles((list || []).slice(0, 4)))
      .catch(() => setCircles([]));
  }, []);

  if (circles.length === 0) return null;

  return (
    <section className="home-section ds-section" aria-labelledby="home-circles-heading">
      <div className="ds-section__head">
        <div>
          <p className="home-eyebrow">طلب العلم</p>
          <h2 id="home-circles-heading" className="ds-section__title">الحلقات القرآنية والعلمية</h2>
        </div>
        <Link href="/quran-scientific-circles" className="ds-section__link">عرض الكل</Link>
      </div>
      <div className="home-circles-grid">
        {circles.map((c) => (
          <Link key={c.id} href={`/quran-scientific-circles/${c.id}`} className="home-circle-card ui-card">
            <Icon name="graduationCap" size={18} className="home-circle-card__icon" />
            <h3>{c.title}</h3>
            {c.circle_type && <span className="page-tag">{c.circle_type}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeCirclesSpotlight;
