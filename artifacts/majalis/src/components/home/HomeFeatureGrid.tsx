import { Link } from "wouter";
import { HOME_FEATURE_CARDS } from "@/lib/navigation";

const ICONS: Record<string, string> = {
  "book-open": "📖",
  "graduation-cap": "🎓",
  sparkles: "✨",
  hands: "🤲",
  clock: "🕐",
  "circle-dot": "📿",
  radio: "📻",
  scroll: "📜",
  gamepad: "🎯",
  compass: "🧭",
};

export function HomeFeatureGrid() {
  return (
    <section className="home-section home-section--v2026" aria-labelledby="home-features-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">استكشف المنصة</p>
          <h2 id="home-features-heading">أقسام المجلس العلمي</h2>
          <p>وصول سريع إلى أهم الأقسام — دروس، قرآن، عبادة، وعلم.</p>
        </div>
      </div>
      <div className="home-features--v2026">
        {HOME_FEATURE_CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="home-feature-card--v2026">
            <span className="home-feature-card--v2026__icon" aria-hidden="true">
              {ICONS[card.icon] || "📌"}
            </span>
            <span className="home-feature-card--v2026__title">{card.title}</span>
            <span className="home-feature-card--v2026__desc">{card.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeFeatureGrid;
