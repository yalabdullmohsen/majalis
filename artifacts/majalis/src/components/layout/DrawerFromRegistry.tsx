/**
 * القائمة الجانبية من سجل الأقسام — نفس ترتيب شيت المزيد.
 */
import {
  SECTION_GROUP_META,
  SECTION_GROUP_ORDER,
  featuredSections,
  sectionsByGroup,
  type SectionDef,
} from "@/config/sections.registry";
import { FeaturedSectionsGrid, SectionsRowList } from "@/components/sections";
import { cn } from "@/lib/utils";
import "@/components/sections/section-cards.css";

type Props = {
  onNavigate?: () => void;
  className?: string;
};

export function DrawerFromRegistry({ onNavigate, className }: Props) {
  const featured = featuredSections();

  return (
    <div className={cn("flex flex-col gap-6 p-4", className)}>
      {featured.length > 0 ? (
        <section aria-label="الأبواب المميّزة" className="flex flex-col gap-3">
          <FeaturedSectionsGrid sections={featured} onNavigate={onNavigate} />
        </section>
      ) : null}

      {SECTION_GROUP_ORDER.map((group) => {
        const meta = SECTION_GROUP_META[group];
        const items = sectionsByGroup(group, "drawer").filter((s) => !s.featured);
        if (items.length === 0) return null;
        return (
          <Group key={group} title={meta.label} items={items} onNavigate={onNavigate} />
        );
      })}
    </div>
  );
}

function Group({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: SectionDef[];
  onNavigate?: () => void;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <SectionsRowList sections={items} onNavigate={onNavigate} />
    </section>
  );
}
