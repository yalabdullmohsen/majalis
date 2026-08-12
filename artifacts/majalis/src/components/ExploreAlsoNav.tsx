import { Link } from "wouter";
import "@/styles/pages/fiqh-guide.css";
import type { ExploreAlsoLink } from "@/lib/explore-link-types";

export type { ExploreAlsoLink } from "@/lib/explore-link-types";

type Props = {
  title?: string;
  links: ExploreAlsoLink[];
  ariaLabel?: string;
};

/**
 * شبكة روابط داخلية موحّدة («استكشف أيضًا») — تعيد استخدام أسلوب fg-related
 * دون بطاقات جديدة، لربط الصفحات ببعضها.
 */
export function ExploreAlsoNav({
  title = "استكشف أيضًا",
  links,
  ariaLabel = "روابط ذات صلة داخل المنصة",
}: Props) {
  if (!links.length) return null;
  return (
    <nav className="fg-related" aria-label={ariaLabel}>
      <h2 className="fg-related__title">{title}</h2>
      <div className="fg-related__grid">
        {links.map((g) => (
          <Link key={`${g.href}::${g.label}`} href={g.href} className="fg-related__link">
            {g.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
