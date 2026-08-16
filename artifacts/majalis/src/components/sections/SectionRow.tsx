import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import type { SectionDef } from "@/config/sections.registry";
import { cn } from "@/lib/utils";

type Props = {
  section: SectionDef;
  className?: string;
  onNavigate?: () => void;
};

/**
 * صف قائمة لمجموعة الحساب والإعدادات فقط.
 */
export function SectionRow({ section, className, onNavigate }: Props) {
  const [, setLocation] = useLocation();
  const Icon = section.icon;
  const aria = `${section.label} — ${section.subtitle}`;

  return (
    <button
      type="button"
      dir="rtl"
      data-section-row="1"
      data-section-id={section.id}
      aria-label={aria}
      className={cn("section-row", className)}
      onClick={() => {
        setLocation(section.route);
        onNavigate?.();
      }}
    >
      <span className="section-row__icon" aria-hidden>
        <Icon strokeWidth={1.75} aria-hidden />
      </span>
      <span className="section-row__label">{section.label}</span>
      <ChevronLeft className="section-row__chevron" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
