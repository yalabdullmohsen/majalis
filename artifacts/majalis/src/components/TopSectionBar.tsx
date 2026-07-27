import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Shield, BookUser, Scale, ScrollText, BookMarked, Library,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SectionTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
  prefetch: () => void;
};

/**
 * شريط الأقسام — محاور موسوعية أساسية.
 * بقية الأقسام عبر المزيد / مركز القرآن.
 */
export const SECTION_TABS: SectionTab[] = [
  { href: "/tawhid",   label: "العقيدة والتوحيد", Icon: Shield,        prefetch: () => import("@/views/TawhidPage") },
  { href: "/seerah",   label: "السيرة والتاريخ",  Icon: BookUser,      prefetch: () => import("@/views/SeerahPage") },
  { href: "/fiqh",     label: "الفقه والأحكام",   Icon: Scale,         prefetch: () => import("@/views/FiqhPage") },
  { href: "/hadith",   label: "الحديث والسنة",    Icon: ScrollText,    prefetch: () => import("@/views/HadithPage") },
  { href: "/quran-hub",label: "القرآن",           Icon: BookMarked,    prefetch: () => import("@/views/QuranHubPage") },
  { href: "/library",  label: "المكتبة",          Icon: Library,       prefetch: () => import("@/views/LibraryPage") },
  { href: "/scholars", label: "العلماء",          Icon: BookUser,      prefetch: () => import("@/views/IslamicScholarsPage") },
];

export function isTabActive(location: string, href: string): boolean {
  if (href === "/seerah") {
    return (
      location === "/seerah" ||
      location.startsWith("/seerah/") ||
      location === "/prophets" ||
      location.startsWith("/prophets/") ||
      location === "/nations" ||
      location.startsWith("/nations/")
    );
  }
  if (href === "/quran-hub") {
    return (
      location === "/quran-hub" ||
      location.startsWith("/quran-hub/") ||
      location === "/tafsir" ||
      location.startsWith("/tafsir/") ||
      location === "/ulum-quran" ||
      location.startsWith("/ulum-quran/") ||
      location === "/mushaf" ||
      location.startsWith("/mushaf/") ||
      location.startsWith("/quran/")
    );
  }
  return location === href || location.startsWith(href + "/");
}

export function TopSectionBar() {
  const [location] = useLocation();
  const prefetched = useRef(new Set<string>());
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [location]);

  if (location.startsWith("/mushaf")) return null;

  function triggerPrefetch(tab: SectionTab) {
    if (prefetched.current.has(tab.href)) return;
    prefetched.current.add(tab.href);
    void tab.prefetch();
  }

  return (
    <nav className="top-section-bar" aria-label="أقسام رئيسية">
      <div className="top-section-bar__scroll" ref={scrollRef}>
        {SECTION_TABS.map((tab) => {
          const active = isTabActive(location, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              ref={active ? activeRef : undefined}
              className={`top-section-bar__tab${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
              onTouchStart={() => triggerPrefetch(tab)}
              onMouseEnter={() => triggerPrefetch(tab)}
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
