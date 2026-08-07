import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  BookOpen, Clock, GraduationCap, Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { isComingSoonPath } from "@/lib/nav-visibility";

/* هوية التبويب العلوي تُحسم عبر styles/m2030/navigation.css */

type SectionTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
  prefetch: () => void;
};

/**
 * شريط الأقسام — نفس المساحات الأربع في الشريط السفلي (تنقّل موحّد).
 * المزيد والبحث دائمان في الهيدر / الشريط السفلي.
 */
export const SECTION_TABS: SectionTab[] = [
  { href: "/quran-knowledge", label: "قرآن", Icon: BookOpen, prefetch: () => import("@/views/QuranKnowledgeHubPage") },
  { href: "/lessons", label: "الدروس", Icon: GraduationCap, prefetch: () => import("@/views/LessonsPage") },
  { href: "/prayer-times", label: "الصلاة", Icon: Clock, prefetch: () => import("@/views/PrayerTimesPage") },
  { href: "/fiqh", label: "فقه", Icon: Scale, prefetch: () => import("@/views/FiqhPage") },
];

export function isTabActive(location: string, href: string): boolean {
  if (href === "/mushaf") {
    return (
      location === "/mushaf" ||
      location.startsWith("/mushaf/") ||
      location === "/quran-hub" ||
      location.startsWith("/quran-hub/")
    );
  }
  if (href === "/quran-knowledge") {
    return (
      location === "/quran-knowledge" ||
      location.startsWith("/quran-knowledge/") ||
      location === "/ulum-quran" ||
      location.startsWith("/ulum-quran/") ||
      location === "/tafsir" ||
      location.startsWith("/tafsir/") ||
      location === "/quran/surahs" ||
      location.startsWith("/quran/surahs/") ||
      location === "/quran/surah-stories" ||
      location.startsWith("/quran/surah-stories/") ||
      location.startsWith("/quran/makki") ||
      location.startsWith("/quran/revelation") ||
      location === "/mushaf" ||
      location.startsWith("/mushaf/") ||
      location === "/memorize" ||
      location.startsWith("/memorize/") ||
      location === "/memorization" ||
      location.startsWith("/memorization/") ||
      location === "/quran-memorization" ||
      location.startsWith("/quran-memorization/") ||
      location.startsWith("/quran/memorization-plans") ||
      location.startsWith("/quran/recitation")
    );
  }
  if (href === "/lessons") {
    return (
      location === "/lessons" ||
      location.startsWith("/lessons/") ||
      location === "/learn" ||
      location.startsWith("/learn/") ||
      location.startsWith("/learning/") ||
      location === "/hadith" ||
      location.startsWith("/hadith/") ||
      location === "/hadith-science" ||
      location.startsWith("/hadith-science/") ||
      location === "/fawaid" ||
      location.startsWith("/fawaid/") ||
      location === "/seerah" ||
      location.startsWith("/seerah/") ||
      location === "/prophets" ||
      location.startsWith("/prophets/") ||
      location === "/scholars" ||
      location.startsWith("/scholars/") ||
      location === "/my-learning" ||
      location.startsWith("/my-learning/") ||
      location === "/occasions-lessons" ||
      location.startsWith("/occasions-lessons/")
    );
  }
  if (href === "/prayer-times") {
    return (
      location === "/prayer-times" ||
      location.startsWith("/prayer-times/") ||
      location === "/adhkar" ||
      location.startsWith("/adhkar/") ||
      location === "/tasbih" ||
      location.startsWith("/tasbih/") ||
      location === "/daily-wird" ||
      location.startsWith("/daily-wird/") ||
      location === "/duas" ||
      location.startsWith("/duas/") ||
      location === "/qibla" ||
      location.startsWith("/qibla/") ||
      location === "/salah-guide" ||
      location.startsWith("/salah-guide/") ||
      location === "/adhan-settings" ||
      location.startsWith("/adhan-settings/")
    );
  }
  if (href === "/fiqh") {
    return (
      location === "/fiqh" ||
      location.startsWith("/fiqh/") ||
      location === "/rulings" ||
      location.startsWith("/rulings/") ||
      location === "/fiqh-council" ||
      location.startsWith("/fiqh-council/") ||
      location === "/madhahib" ||
      location.startsWith("/madhahib/") ||
      location === "/mawarith" ||
      location.startsWith("/mawarith/") ||
      location === "/fiqh-qawaid" ||
      location.startsWith("/fiqh-qawaid/") ||
      location === "/qa" ||
      location.startsWith("/qa/") ||
      location === "/tahara" ||
      location.startsWith("/tahara/") ||
      location === "/zakat" ||
      location.startsWith("/zakat/") ||
      location === "/sawm" ||
      location.startsWith("/sawm/") ||
      location === "/hajj" ||
      location.startsWith("/hajj/")
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

  if (isImmersiveChromePath(location)) return null;

  function triggerPrefetch(tab: SectionTab) {
    if (prefetched.current.has(tab.href)) return;
    prefetched.current.add(tab.href);
    void tab.prefetch();
  }

  return (
    <nav className="top-section-bar mj-nav-skin" aria-label="أقسام رئيسية">
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
              <span className="top-section-bar__tab-label">{tab.label}</span>
              {soon ? <span className="top-section-bar__soon-badge">قريبًا</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
