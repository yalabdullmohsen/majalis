/**
 * شبكة أقسام موحّدة — ارتفاع صفّ موحّد عبر grid-auto-rows.
 */
import type { SectionDef } from "@/config/sections.registry";
import { FeaturedSectionCard } from "./FeaturedSectionCard";
import { SectionCard } from "./SectionCard";
import { SectionRow } from "./SectionRow";
import { cn } from "@/lib/utils";

type Common = {
  sections: SectionDef[];
  onNavigate?: () => void;
  className?: string;
};

export function FeaturedSectionsGrid({ sections, onNavigate, className }: Common) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 [grid-auto-rows:1fr] sm:grid-cols-3",
        className,
      )}
    >
      {sections.map((s) => (
        <FeaturedSectionCard key={s.id} section={s} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export function SectionsCardGrid({ sections, onNavigate, className }: Common) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 [grid-auto-rows:1fr]", className)}>
      {sections.map((s) => (
        <SectionCard key={s.id} section={s} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export function SectionsRowList({ sections, onNavigate, className }: Common) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
      role="list"
    >
      {sections.map((s) => (
        <div key={s.id} role="listitem">
          <SectionRow section={s} onNavigate={onNavigate} />
        </div>
      ))}
    </div>
  );
}
