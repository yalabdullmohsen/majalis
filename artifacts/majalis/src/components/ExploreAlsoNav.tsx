import { useLocation } from "wouter";
import { InternalLinkCard } from "@/components/ui/InternalCards";
import "@/styles/pages/fiqh-guide.css";
import type { ExploreAlsoLink } from "@/lib/explore-link-types";

export type { ExploreAlsoLink } from "@/lib/explore-link-types";

type Props = {
  title?: string;
  links: ExploreAlsoLink[];
  ariaLabel?: string;
};

function normalizePath(path: string): string {
  const bare = String(path || "/").split("?")[0].split("#")[0].trim() || "/";
  return bare.replace(/\/+$/, "") || "/";
}

/**
 * شبكة روابط داخلية موحّدة («استكشف أيضًا») — تعيد استخدام أسلوب fg-related
 * دون بطاقات جديدة، لربط الصفحات ببعضها.
 * تُسقط روابط الصفحة الحالية وhref المكرّر.
 */
export function ExploreAlsoNav({
  title = "استكشف أيضًا",
  links,
  ariaLabel = "روابط ذات صلة داخل المنصة",
}: Props) {
  const [location] = useLocation();
  const current = normalizePath(location);
  const seen = new Set<string>();
  const filtered = links.filter((g) => {
    const href = normalizePath(g.href);
    if (!href || href === current) return false;
    if (seen.has(href)) return false;
    seen.add(href);
    return true;
  });
  if (!filtered.length) return null;
  return (
    <nav className="fg-related" aria-label={ariaLabel}>
      <h2 className="fg-related__title">{title}</h2>
      <div className="fg-related__grid hub-card-grid">
        {filtered.map((g) => (
          <InternalLinkCard
            key={`${g.href}::${g.label}`}
            href={g.href}
            title={g.label}
            variant="compact"
            className="fg-related__link"
          />
        ))}
      </div>
    </nav>
  );
}
