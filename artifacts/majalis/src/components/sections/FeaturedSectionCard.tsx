import { useLocation } from "wouter";
import type { SectionDef } from "@/config/sections.registry";
import { prefetchRoute } from "@/lib/prefetch-route";
import { cn } from "@/lib/utils";

type Props = {
  section: SectionDef;
  className?: string;
  onNavigate?: () => void;
  /** تجاوز المسار (مثل المصحف بآخر موضع) */
  resolveRoute?: (section: SectionDef) => string;
};

/**
 * مربع مميّز — الخلفية الخضراء ولون الحبر في صنف variant واحد فقط (.card--featured).
 * ممنوع تعيين لون الحبر أبيضًا عبر منفعة Tailwind منفصلة عن الخلفية.
 */
export function FeaturedSectionCard({ section, className, onNavigate, resolveRoute }: Props) {
  const [, setLocation] = useLocation();
  const Icon = section.icon;
  const aria = `${section.label} — ${section.subtitle}`;

  return (
    <button
      type="button"
      dir="rtl"
      data-section-card="featured"
      data-section-id={section.id}
      aria-label={aria}
      className={cn("card--featured", className)}
      onPointerDown={() => prefetchRoute(resolveRoute?.(section) ?? section.route)}
      onClick={() => {
        const href = resolveRoute?.(section) ?? section.route;
        const [path, hash] = href.split("#");
        if (path) setLocation(path);
        window.scrollTo(0, 0);
        if (hash) {
          window.setTimeout(() => {
            document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 40);
        }
        onNavigate?.();
      }}
    >
      <span className="card__icon" aria-hidden>
        <Icon strokeWidth={1.75} aria-hidden />
      </span>
      <span className="card__label">{section.label}</span>
      <span className="card__subtitle">{section.subtitle}</span>
    </button>
  );
}
