import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Shield, BookUser, Scale, ScrollText, BookMarked, Repeat2, GraduationCap,
  BookOpen, BookText, Mic2, Sparkles, Sun, Baby, Calendar, Star, Rss, Info,
  Library,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { isComingSoonPath } from "@/lib/nav-visibility";

type SectionTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
  prefetch: () => void;
};

/**
 * شريط الأقسام — محاور الموسوعة الأساسية فقط.
 * أُزيلت المداخل المكررة (تعلّم منظّم / أدوات / مصحف صفحات / إحصاءات)
 * حسب مراجعة الدمج؛ الأطفال يبقى بشارة «قريبًا».
 */
export const SECTION_TABS: SectionTab[] = [
  { href: "/tawhid",                   label: "العقيدة والتوحيد",     Icon: Shield,        prefetch: () => import("@/views/TawhidPage") },
  { href: "/seerah",                   label: "السيرة والتاريخ",      Icon: BookUser,      prefetch: () => import("@/views/SeerahPage") },
  { href: "/fiqh",                     label: "الفقه والأحكام",       Icon: Scale,         prefetch: () => import("@/views/FiqhPage") },
  { href: "/hadith",                   label: "الحديث والسنة",        Icon: ScrollText,    prefetch: () => import("@/views/HadithPage") },
  { href: "/quran-hub",                label: "القرآن",               Icon: BookMarked,    prefetch: () => import("@/views/QuranHubPage") },
  { href: "/mushaf",                   label: "المصحف",               Icon: BookOpen,      prefetch: () => import("@/views/MushafPageView") },
  { href: "/library",                  label: "المكتبة",              Icon: Library,       prefetch: () => import("@/views/LibraryPage") },
  { href: "/scholars",                 label: "العلماء",              Icon: BookUser,      prefetch: () => import("@/views/IslamicScholarsPage") },
  { href: "/adhkar",                   label: "العبادة والأذكار",     Icon: Repeat2,       prefetch: () => import("@/views/AdhkarPage") },
  { href: "/learn",                    label: "تعلّم",                Icon: GraduationCap, prefetch: () => import("@/views/learn/LearnHubPage") },
  { href: "/ulum-quran",               label: "علوم القرآن",          Icon: Sparkles,      prefetch: () => import("@/views/UlumQuranPage") },
  { href: "/quran/tajweed",            label: "التجويد",              Icon: Mic2,          prefetch: () => import("@/views/QuranTajweedPage") },
  { href: "/quran/surahs",             label: "فهرس السور",           Icon: BookText,      prefetch: () => import("@/views/SurahIndexPage") },
  { href: "/daily-wird",               label: "الورد اليومي",         Icon: Sun,           prefetch: () => import("@/views/DailyWirdPage") },
  { href: "/kids",                     label: "الأطفال",              Icon: Baby,          prefetch: () => import("@/views/KidsPage") },
  { href: "/calendar",                 label: "التقويم",              Icon: Calendar,      prefetch: () => import("@/views/CalendarPage") },
  { href: "/occasions",                label: "المناسبات",            Icon: Star,          prefetch: () => import("@/views/OccasionsPage") },
  { href: "/updates",                  label: "المستجدات",            Icon: Rss,           prefetch: () => import("@/views/UpdatesPage") },
  { href: "/about",                    label: "عن المنصة",            Icon: Info,          prefetch: () => import("@/views/AboutPage") },
];

export function isTabActive(location: string, href: string): boolean {
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
          const soon = isComingSoonPath(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              ref={active ? activeRef : undefined}
              className={`top-section-bar__tab${active ? " is-active" : ""}${soon ? " is-soon" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={soon ? `${tab.label} — قريبًا` : tab.label}
              onTouchStart={() => triggerPrefetch(tab)}
              onMouseEnter={() => triggerPrefetch(tab)}
            >
              <tab.Icon size={14} strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
              <span>{tab.label}</span>
              {soon ? <span className="nav-soon-badge">قريبًا</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
