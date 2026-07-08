import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SkeletonCardGrid } from "@/components/ui-common";
import {
  loadIslamicOccasions,
  sortOccasionsByUpcoming,
  type IslamicOccasionView,
} from "@/lib/islamic-occasions";

export function HomeIslamicOccasions() {
  const [items, setItems] = useState<IslamicOccasionView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadIslamicOccasions()
      .then((rows) => {
        if (active) setItems(sortOccasionsByUpcoming(Array.isArray(rows) ? rows : []).slice(0, 4));
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="home-section" aria-labelledby="occasions-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">تذكير</p>
          <h2 id="occasions-heading">المناسبات الإسلامية</h2>
          <p>مناسبات معتمدة مع الأعمال المستحبة والأدلة.</p>
        </div>
        <Link href="/occasions" className="home-section-link">كل المناسبات</Link>
      </div>
      {loading ? (
        <SkeletonCardGrid count={4} />
      ) : (
        <div className="home-occasions-grid">
          {items.map((occasion) => (
            <Link key={occasion.id} href="/occasions" className="home-occasion-card ui-card">
              <strong>{occasion.name}</strong>
              <p>{occasion.summary}</p>
              <span className="home-occasion-card__meta">
                {occasion.daysRemaining != null
                  ? occasion.daysRemaining === 0
                    ? "اليوم أو قريب"
                    : `بعد ${occasion.daysRemaining} يوم تقريباً`
                  : "موسمية"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default HomeIslamicOccasions;
