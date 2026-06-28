import { BookOpen, CircleDot, Clock, Compass, Gamepad2, Hand, Radio, ScrollText, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { HOME_FEATURE_CARDS } from "@/lib/navigation";

const ICONS = {
  "book-open": BookOpen,
  sparkles: Sparkles,
  hands: Hand,
  clock: Clock,
  "circle-dot": CircleDot,
  radio: Radio,
  scroll: ScrollText,
  compass: Compass,
  gamepad: Gamepad2,
} as const;

export function HomeFeatureCards() {
  return (
    <section className="home-section" aria-labelledby="home-features-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">وصول سريع</p>
          <h2 id="home-features-heading">البطاقات الرئيسية</h2>
          <p>أهم أقسام العبادة والعلم في مكان واحد.</p>
        </div>
      </div>
      <div className="home-feature-grid home-feature-grid--v3">
        {HOME_FEATURE_CARDS.map((card) => {
          const Icon = ICONS[card.icon];
          return (
            <Link key={card.href} href={card.href} className="home-feature-card home-feature-card--v3">
              <span className="home-feature-icon home-feature-icon--v3" aria-hidden="true">
                <Icon size={22} strokeWidth={1.75} />
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
