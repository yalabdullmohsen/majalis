import { Link } from "wouter";
import {
  daysUntilOccasion,
  estimateHijriDate,
  ISLAMIC_OCCASIONS,
} from "@/lib/islamic-occasions-seed";

export function HomeIslamicOccasions() {
  const today = estimateHijriDate();
  const items = ISLAMIC_OCCASIONS.slice(0, 4);

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
      <div className="home-occasions-grid">
        {items.map((occasion) => {
          const remaining = daysUntilOccasion(occasion, today);
          return (
            <Link key={occasion.id} href="/occasions" className="home-occasion-card ui-card">
              <strong>{occasion.name}</strong>
              <p>{occasion.summary}</p>
              <span className="home-occasion-card__meta">
                {remaining != null
                  ? remaining === 0
                    ? "اليوم أو قريب"
                    : `بعد ${remaining} يوم تقريباً`
                  : "موسمية"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default HomeIslamicOccasions;
