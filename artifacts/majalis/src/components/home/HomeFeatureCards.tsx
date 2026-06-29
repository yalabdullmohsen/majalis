import { Link } from "wouter";
import { Icon, resolveIcon } from "@/lib/icons";
import { HOME_FEATURE_CARDS } from "@/lib/navigation";

export function HomeFeatureCards() {
  return (
    <section className="home-section ds-section" aria-labelledby="home-features-heading">
      <div className="ds-section__head">
        <div>
          <p className="home-eyebrow">وصول سريع</p>
          <h2 id="home-features-heading" className="ds-section__title">أقسام المنصة</h2>
          <p className="home-section-desc">أهم أقسام العلم والعبادة في مكان واحد.</p>
        </div>
      </div>
      <div className="home-feature-grid home-feature-grid--v4">
        {HOME_FEATURE_CARDS.map((card) => {
          const IconCmp = resolveIcon(card.icon);
          return (
            <Link key={card.href} href={card.href} className="home-feature-card home-feature-card--v4">
              <span className="home-feature-icon home-feature-icon--v4" aria-hidden="true">
                <IconCmp size={22} strokeWidth={1.75} />
              </span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default HomeFeatureCards;
