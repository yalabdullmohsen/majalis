import { Link } from "wouter";
import { LIBRARY_ROUTES, PUBLIC_ALIASES } from "@/lib/library/content-types";

const CARDS = [
  {
    contentType: "book" as const,
    href: LIBRARY_ROUTES.books,
    alias: PUBLIC_ALIASES.books,
    icon: "📚",
    title: "الكتب",
    description: "كتب شرعية · متون · شروح · موسوعات",
    theme: "books",
  },
  {
    contentType: "article" as const,
    href: LIBRARY_ROUTES.articles,
    alias: PUBLIC_ALIASES.articles,
    icon: "📝",
    title: "المقالات",
    description: "مقالات علمية · دعوية · فكرية · تربوية",
    theme: "articles",
  },
  {
    contentType: "research" as const,
    href: LIBRARY_ROUTES.research,
    alias: PUBLIC_ALIASES.research,
    icon: "🎓",
    title: "الأبحاث العلمية",
    description: "رسائل جامعية · أبحاث محكمة · أوراق علمية",
    theme: "research",
  },
];

type Props = {
  compact?: boolean;
};

export function LibraryHubCards({ compact }: Props) {
  return (
    <div className={`library-hub-cards${compact ? " library-hub-cards--compact" : ""}`}>
      {CARDS.map((card) => (
        <Link key={card.contentType} href={card.href} className={`library-hub-card library-hub-card--${card.theme}`}>
          <span className="library-hub-card__icon" aria-hidden>{card.icon}</span>
          <h3 className="library-hub-card__title">{card.title}</h3>
          <p className="library-hub-card__desc">{card.description}</p>
          <span className="library-hub-card__cta">استكشف ←</span>
        </Link>
      ))}
    </div>
  );
}

export default LibraryHubCards;
