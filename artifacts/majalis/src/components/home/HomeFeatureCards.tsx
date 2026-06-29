import {
  BookMarked,
  BookOpen,
  Bot,
  Clock,
  FileText,
  Gamepad2,
  GraduationCap,
  Library,
  Radio,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { IslamicHeadingOrnament } from "@/components/islamic/IslamicOrnament";
import { HOME_FEATURE_CARDS } from "@/lib/navigation";

const ICONS = {
  "book-open": BookOpen,
  sparkles: Sparkles,
  clock: Clock,
  radio: Radio,
  "graduation-cap": GraduationCap,
  users: Users,
  "file-text": FileText,
  "gamepad-2": Gamepad2,
  search: Search,
  library: Library,
  "book-marked": BookMarked,
  bot: Bot,
} as const;

export function HomeFeatureCards() {
  return (
    <section className="home-section" aria-labelledby="home-features-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">وصول سريع</p>
          <h2 id="home-features-heading">أهم أقسام المنصة</h2>
          <IslamicHeadingOrnament />
        </div>
      </div>
      <div className="home-feature-grid home-feature-grid--v3">
        {HOME_FEATURE_CARDS.map((card) => {
          const Icon = ICONS[card.icon as keyof typeof ICONS] || BookOpen;
          return (
            <Link key={card.href} href={card.href} className="home-feature-card home-feature-card--v3 ui-card--ornate">
              <span className="home-feature-icon home-feature-icon--v3" aria-hidden="true">
                <Icon size={20} strokeWidth={1.75} />
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
