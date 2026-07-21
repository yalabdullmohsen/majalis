import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SkeletonCardGrid } from "@/components/ui-common";
import {
  loadIslamicOccasions,
  sortOccasionsByUpcoming,
  type IslamicOccasionView,
} from "@/lib/islamic-occasions";
import { Widget } from "@/components/widgets/Widget";

const OccasionsIcon = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" style={{ marginTop: "0.15rem", flexShrink: 0 }}>
    <polygon points="9,1 11,6.5 17,6.5 12.5,10 14.5,16 9,12.5 3.5,16 5.5,10 1,6.5 7,6.5" fill="none" stroke="#173D35" strokeWidth="1.2"/>
  </svg>
);

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

  if (!loading && items.length === 0) return null;

  return (
    <Widget
      id="occasions"
      icon={<OccasionsIcon />}
      eyebrow="تذكير"
      title="المناسبات الإسلامية"
      description="مناسبات معتمدة مع الأعمال المستحبة والأدلة."
      moreHref="/occasions"
      moreLabel="كل المناسبات"
      state="ready"
    >
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
    </Widget>
  );
}

export default HomeIslamicOccasions;
