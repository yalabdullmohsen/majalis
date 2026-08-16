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
    <div className={cn("card-grid card-grid--featured", className)} data-sections-grid="featured">
      {sections.map((s) => (
        <FeaturedSectionCard key={s.id} section={s} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export function SectionsCardGrid({ sections, onNavigate, className }: Common) {
  return (
    <div className={cn("card-grid", className)} data-sections-grid="cards">
      {sections.map((s) => (
        <SectionCard key={s.id} section={s} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export function SectionsRowList({ sections, onNavigate, className }: Common) {
  return (
    <div className={cn("card-grid card-grid--compact", className)} data-sections-grid="compact" role="list">
      {sections.map((s) => (
        <div key={s.id} role="listitem">
          <SectionRow section={s} onNavigate={onNavigate} />
        </div>
      ))}
    </div>
  );
}
