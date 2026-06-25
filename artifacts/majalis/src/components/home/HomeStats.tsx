import { ADHKAR_ITEMS } from "@/lib/adhkar-seed";
import { SEED_FAWAID } from "@/lib/fawaid-seed";
import { SEED_QA } from "@/lib/qa-seed";
import { lessonAds } from "@/lib/lesson-ads";
import { DEMO_SHEIKHS } from "@/lib/demo-content";

const STATS = [
  { label: "دروس وإعلانات", value: () => lessonAds.length + 3 },
  { label: "فوائد", value: () => SEED_FAWAID.length },
  { label: "أسئلة وأجوبة", value: () => SEED_QA.length },
  { label: "أذكار", value: () => ADHKAR_ITEMS.length },
  { label: "مشايخ", value: () => DEMO_SHEIKHS.length },
];

export function HomeStats() {
  return (
    <section className="home-section home-stats-section" aria-labelledby="home-stats-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">المنصة</p>
          <h2 id="home-stats-heading">إحصائيات المنصة</h2>
        </div>
      </div>
      <div className="home-stats-grid">
        {STATS.map((stat) => (
          <article key={stat.label} className="ui-card home-stat-card">
            <strong>{stat.value()}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
