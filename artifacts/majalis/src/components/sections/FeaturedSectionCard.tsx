import { useLocation } from "wouter";
import type { SectionDef } from "@/config/sections.registry";
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
      onClick={() => {
        setLocation(resolveRoute?.(section) ?? section.route);
        window.scrollTo(0, 0);
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
