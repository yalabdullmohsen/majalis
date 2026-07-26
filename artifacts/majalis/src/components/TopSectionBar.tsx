import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Shield, BookUser, Scale, ScrollText, BookMarked, Repeat2, GraduationCap,
  Layers, BookOpen, BookText, Library, Bot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SectionTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
  prefetch: () => void;
};

/* شريط أفقي للأقسام ذات الأولوية فقط (الباقي في «المزيد»). الترتيب:
   عقيدة → قرآن → حديث → فقه → سيرة → أنبياء → علماء/كتب → دروس → أذكار → اختبارات → أدوات. */
export const SECTION_TABS: SectionTab[] = [
  { href: "/tawhid",         label: "العقيدة والتوحيد", Icon: Shield,        prefetch: () => import("@/views/TawhidPage") },
  { href: "/quran-hub",      label: "القرآن وعلومه",    Icon: BookMarked,    prefetch: () => import("@/views/QuranHubPage") },
  { href: "/hadith",         label: "الحديث والسنة",    Icon: ScrollText,    prefetch: () => import("@/views/HadithPage") },
  { href: "/fiqh",           label: "الفقه والأحكام",   Icon: Scale,         prefetch: () => import("@/views/FiqhPage") },
  { href: "/seerah",         label: "السيرة والتاريخ",  Icon: BookUser,      prefetch: () => import("@/views/SeerahPage") },
  { href: "/prophets",       label: "قصص الأنبياء",     Icon: BookText,      prefetch: () => import("@/views/ProphetStoriesPage") },
  { href: "/scholars",       label: "العلماء",          Icon: Library,       prefetch: () => import("@/views/IslamicScholarsPage") },
  { href: "/library",        label: "الكتب",            Icon: BookOpen,      prefetch: () => import("@/views/LibraryPage") },
  { href: "/lessons",        label: "الدروس والدورات",  Icon: GraduationCap, prefetch: () => import("@/views/LessonsPage") },
  { href: "/adhkar",         label: "الأذكار والصلاة",  Icon: Repeat2,       prefetch: () => import("@/views/AdhkarPage") },
  { href: "/quiz",           label: "الاختبارات",       Icon: Bot,           prefetch: () => import("@/views/QuizPage") },
  { href: "/learn",          label: "الأدوات",          Icon: Layers,        prefetch: () => import("@/views/learn/LearnHubPage") },
];

/** أطول بادئة تفوز — يمنع تفعيل تبويب قصير عند وجود تبويب أطول يطابق المسار. */
export function isTabActive(location: string, href: string): boolean {
  if (location === href || location.startsWith(href + "/")) {
    const longerConflict = SECTION_TABS.some(
      (t) => t.href !== href && t.href.startsWith(href) && (location === t.href || location.startsWith(t.href + "/")),
    );
    if (longerConflict) return false;
    return true;
  }
  // روابط فرعية للقرآن تحت مركز القرآن
  if (href === "/quran-hub") {
    return (
      location.startsWith("/ulum-quran") ||
      location.startsWith("/quran/") ||
      location.startsWith("/mushaf")
    );
  }
  return false;
}

export function TopSectionBar() {
  const [location] = useLocation();
  const prefetched = useRef(new Set<string>());
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [location]);

  // قارئ المصحف الغامر له تنقّله الخاص — نفس استثناء BottomNavBar.
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
