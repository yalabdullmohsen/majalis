import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "wouter";
import type { LucideIcon } from "lucide-react";
import { flattenMoreSectionsForTopBar } from "@/lib/more-sheet-sections";

type SectionTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

/** أقسام شريط التصنيفات = أقسام «المزيد» بترتيب الأولوية وبدون تكرار مسارات. */
export const SECTION_TABS: SectionTab[] = flattenMoreSectionsForTopBar().map(
  ({ href, label, Icon }) => ({ href, label, Icon }),
);

const SECTION_HREFS = SECTION_TABS.map((t) => t.href);

/** تطابق مسار مع قسم مع احترام حدود المقطع (/learn ≠ /learning). */
export function matchesSectionHref(location: string, href: string): boolean {
  return location === href || location.startsWith(`${href}/`);
}

/** أطول مسار مطابق — يمنع تفعيل أكثر من تبويب لنفس الموقع. */
export function resolveActiveSectionHref(
  location: string,
  hrefs: readonly string[] = SECTION_HREFS,
): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    if (!matchesSectionHref(location, href)) continue;
    if (!best || href.length > best.length) best = href;
  }
  return best;
}

export function isTabActive(
  location: string,
  href: string,
  allHrefs: readonly string[] = SECTION_HREFS,
): boolean {
  return resolveActiveSectionHref(location, allHrefs) === href;
}

export function TopSectionBar() {
  const [location] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const activeHref = useMemo(
    () => resolveActiveSectionHref(location, SECTION_HREFS),
    [location],
  );

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [location]);

  // قارئ المصحف الغامر له تنقّله الخاص — نفس استثناء BottomNavBar.
  if (location.startsWith("/mushaf")) return null;

  return (
    <nav className="top-section-bar" aria-label="أقسام رئيسية">
      <div className="top-section-bar__scroll" ref={scrollRef} dir="rtl">
        {SECTION_TABS.map((tab) => {
          const active = tab.href === activeHref;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              ref={active ? activeRef : undefined}
              className={`top-section-bar__tab${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <tab.Icon size={14} strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
