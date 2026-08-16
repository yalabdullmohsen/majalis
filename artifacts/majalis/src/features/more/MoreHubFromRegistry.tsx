/**
 * جسم «المزيد» من سجل الأقسام — صف مميّز ثم ٧ مجموعات بالترتيب.
 */
import { useMemo, useState } from "react";
import {
  SECTION_GROUP_META,
  SECTION_GROUP_ORDER,
  featuredSections,
  sectionsByGroup,
  type SectionDef,
  type SectionGroup,
} from "@/config/sections.registry";
import {
  FeaturedSectionsGrid,
  SectionsCardGrid,
  SectionsRowList,
} from "@/components/sections";
import { normalizeForSearch } from "@/shared/arabic-normalize";
import { cn } from "@/lib/utils";
import "@/components/sections/section-cards.css";

function matchesQuery(s: SectionDef, q: string): boolean {
  if (!q) return true;
  const hay = [s.label, s.subtitle, ...s.keywords, ...(s.aliases ?? [])]
    .map((x) => normalizeForSearch(x))
    .join(" ");
  return hay.includes(q);
}

type Props = {
  onNavigate?: () => void;
  /** إظهار حقل بحث داخلي (للشيت) */
  showSearch?: boolean;
  className?: string;
};

export function MoreHubFromRegistry({ onNavigate, showSearch = false, className }: Props) {
  const [query, setQuery] = useState("");
  const q = normalizeForSearch(query.trim());

  const featured = useMemo(
    () => featuredSections().filter((s) => matchesQuery(s, q)),
    [q],
  );

  const groups = useMemo(() => {
    return SECTION_GROUP_ORDER.map((group) => {
      const meta = SECTION_GROUP_META[group];
      let items = sectionsByGroup(group, "moreHub").filter((s) => matchesQuery(s, q));
      // المميّزة تظهر في الصف العلوي؛ لا تُكرَّر داخل شبكة المجموعة إلا إن لم يكن هناك صف مميّز (بحث ضيّق)
      if (!q) {
        items = items.filter((s) => !s.featured);
      }
      return { group, meta, items };
    }).filter((g) => g.items.length > 0 || (g.group === "sciences" && featured.length > 0 && !q));
  }, [q, featured.length]);

  const empty = featured.length === 0 && groups.every((g) => g.items.length === 0);

  return (
    <div className={cn("more-hub", className)} data-more-hub="1" dir="rtl">
      {showSearch ? (
        <div>
          <label htmlFor="more-hub-search" className="sr-only">
            بحث في الأقسام
          </label>
          <input
            id="more-hub-search"
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="more-hub__search"
            placeholder="ابحث في الأقسام…"
            autoComplete="off"
            data-search-field="1"
          />
        </div>
      ) : null}

      {empty ? (
        <p className="more-hub__empty">لا نتائج مطابقة.</p>
      ) : (
        <>
          {featured.length > 0 ? (
            <section aria-label="الأبواب المميّزة" className="more-hub__featured" data-more-featured="1">
              <FeaturedSectionsGrid sections={featured} onNavigate={onNavigate} />
            </section>
          ) : null}

          {groups.map(({ group, meta, items }) =>
            items.length === 0 ? null : (
              <GroupBlock
                key={group}
                group={group}
                title={meta.label}
                rowStyle={meta.rowStyle}
                items={items}
                onNavigate={onNavigate}
              />
            ),
          )}
        </>
      )}
    </div>
  );
}

function GroupBlock({
  group,
  title,
  rowStyle,
  items,
  onNavigate,
}: {
  group: SectionGroup;
  title: string;
  rowStyle: boolean;
  items: SectionDef[];
  onNavigate?: () => void;
}) {
  const headingId = `more-group-${group}`;
  return (
    <section
      className="more-hub__group"
      aria-labelledby={headingId}
      data-more-group={group}
    >
      <h2 id={headingId} className="more-hub__group-title" data-more-group-title={group}>
        {title}
      </h2>
      {rowStyle ? (
        <SectionsRowList sections={items} onNavigate={onNavigate} />
      ) : (
        <SectionsCardGrid sections={items} onNavigate={onNavigate} />
      )}
    </section>
  );
}
