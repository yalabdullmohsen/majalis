import { useLocation } from "wouter";
import type { SectionDef } from "@/config/sections.registry";
import { cn } from "@/lib/utils";

type Props = {
  section: SectionDef;
  className?: string;
  onNavigate?: () => void;
};

/**
 * بطاقة متوسطة محايدة (شبكة عمودين) — بلا تدرّج أخضر.
 */
export function SectionCard({ section, className, onNavigate }: Props) {
  const [, setLocation] = useLocation();
  const Icon = section.icon;
  const aria = `${section.label} — ${section.subtitle}`;

  return (
    <button
      type="button"
      dir="rtl"
      data-section-card="1"
      data-section-id={section.id}
      aria-label={aria}
      className={cn("section-card", className)}
      onClick={() => {
        setLocation(section.route);
        onNavigate?.();
      }}
    >
      <span className="section-card__icon-chip" aria-hidden>
        <Icon strokeWidth={1.75} aria-hidden />
      </span>
      <span className="section-card__label">{section.label}</span>
      <span className="section-card__subtitle">{section.subtitle}</span>
    </button>
  );
}
