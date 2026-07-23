import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Shield, BookUser, Scale, ScrollText, BookMarked, Repeat2, GraduationCap,
  Layers, CreditCard, BookOpen, BookText, Library, Mic2, Sparkles, Bot,
  Sun, Baby, Calendar, Star, BarChart3, Rss, Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SectionTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
  prefetch: () => void;
};

/* الأقسام الفعلية الأهم من القائمة الجانبية، بترتيب أولوية صريح (العقيدة
   والسيرة والفقه والحديث والقرآن أولاً). كل مسار مسار فعلي عامل حاليًا —
   لا صفحات وهمية. "الرئيسية" ومميزات قيد التطوير مستبعدة عمدًا (تبقيان
   ضمن التنقل الرئيسي/القائمة الجانبية فقط). عناصر مكرِّرة المسار مع عنصر
   سابق (كـ"مركز القرآن" مقابل "القرآن") حُذفت لمنع تكرار الروابط. */
export const SECTION_TABS: SectionTab[] = [
  { href: "/tawhid",                   label: "العقيدة والتوحيد",     Icon: Shield,        prefetch: () => import("@/views/TawhidPage") },
  { href: "/seerah",                   label: "السيرة والتاريخ",      Icon: BookUser,      prefetch: () => import("@/views/SeerahPage") },
  { href: "/fiqh",                     label: "الفقه والأحكام",       Icon: Scale,         prefetch: () => import("@/views/FiqhPage") },
  { href: "/hadith",                   label: "الحديث والسنة",        Icon: ScrollText,    prefetch: () => import("@/views/HadithPage") },
  { href: "/quran-hub",                label: "القرآن",               Icon: BookMarked,    prefetch: () => import("@/views/QuranHubPage") },
  { href: "/adhkar",                   label: "العبادة والأذكار",     Icon: Repeat2,       prefetch: () => import("@/views/AdhkarPage") },
  { href: "/learn",                    label: "تعلّم",                Icon: GraduationCap, prefetch: () => import("@/views/learn/LearnHubPage") },
  { href: "/learning/paths",           label: "تعلّم منظّم",          Icon: Layers,        prefetch: () => import("@/views/learning/LearningPathsPage") },
  { href: "/flashcards",               label: "أدوات التعلم",         Icon: CreditCard,    prefetch: () => import("@/views/FlashCardsPage") },
  { href: "/mushaf",                   label: "المصحف الشريف",        Icon: BookOpen,      prefetch: () => import("@/views/MushafPageView") },
  { href: "/quran/surahs",             label: "فهرس السور",           Icon: BookText,      prefetch: () => import("@/views/SurahIndexPage") },
  { href: "/mushaf/page",              label: "المصحف بنظام الصفحات", Icon: Library,       prefetch: () => import("@/views/MushafPageView") },
  { href: "/quran/tajweed",            label: "علم التجويد",          Icon: Mic2,          prefetch: () => import("@/views/QuranTajweedPage") },
  { href: "/ulum-quran",               label: "علوم القرآن",          Icon: Sparkles,      prefetch: () => import("@/views/UlumQuranPage") },
  { href: "/quran/recitation-test-ai", label: "اختبار التسميع",       Icon: Bot,           prefetch: () => import("@/views/RecitationTestPage") },
  { href: "/daily-wird",               label: "الورد اليومي",         Icon: Sun,           prefetch: () => import("@/views/DailyWirdPage") },
  { href: "/kids",                     label: "الأطفال",              Icon: Baby,          prefetch: () => import("@/views/KidsPage") },
  { href: "/calendar",                 label: "التقويم الهجري",       Icon: Calendar,      prefetch: () => import("@/views/CalendarPage") },
  { href: "/occasions",                label: "المناسبات الإسلامية", Icon: Star,          prefetch: () => import("@/views/OccasionsPage") },
  { href: "/islam-stats",              label: "الإسلام في أرقام",     Icon: BarChart3,     prefetch: () => import("@/views/IslamStatsPage") },
  { href: "/updates",                  label: "آخر المستجدات",        Icon: Rss,           prefetch: () => import("@/views/UpdatesPage") },
  { href: "/about",                    label: "عن التطبيق",           Icon: Info,          prefetch: () => import("@/views/AboutPage") },
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
              <tab.Icon size={16} strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
