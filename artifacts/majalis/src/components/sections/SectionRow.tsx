import { useLocation } from "wouter";
import type { SectionDef } from "@/config/sections.registry";
import { cn } from "@/lib/utils";

type Props = {
  section: SectionDef;
  className?: string;
  onNavigate?: () => void;
};

/**
 * بطاقة مضغوطة لمجموعة الحساب — أيقونة + عنوان في صف واحد.
 */
export function SectionRow({ section, className, onNavigate }: Props) {
  const [, setLocation] = useLocation();
  const Icon = section.icon;
  const subtitle = section.subtitle?.trim();
  const aria = subtitle ? `${section.label} — ${subtitle}` : section.label;

  return (
    <button
      type="button"
      dir="rtl"
      data-section-card="compact"
      data-section-row="1"
      data-section-id={section.id}
      aria-label={aria}
      className={cn("card--compact", className)}
      onClick={() => {
        setLocation(section.route);
        window.scrollTo(0, 0);
        onNavigate?.();
      }}
    >
      <span className="card__icon" aria-hidden>
        <Icon strokeWidth={1.75} aria-hidden />
      </span>
      <span className="card__label">{section.label}</span>
    </button>
  );
}
