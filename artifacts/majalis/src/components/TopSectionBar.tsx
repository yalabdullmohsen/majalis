import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import type { LucideIcon } from "lucide-react";
import { isAuthStandalonePath, isImmersiveChromePath } from "@/lib/immersive-chrome";
import { isComingSoonPath } from "@/lib/nav-visibility";
import { BOTTOM_NAV_TABS } from "@/lib/nav-map";
import { useIsMobileNav } from "@/hooks/useIsMobileNav";

/* هوية التبويب العلوي تُحسم عبر styles/m2030/navigation.css */

type SectionTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
  prefetch: () => void;
};

const PREFETCH_BY_HREF: Record<string, () => void> = {
  "/quran-hub": () => { void import("@/pages/quran/QuranHubPage"); },
  "/mushaf": () => { void import("@/pages/quran/MushafReaderPage"); },
  "/lessons": () => { void import("@/pages/lessons/LessonsPage"); },
  "/prayer-times": () => { void import("@/pages/worship/PrayerTimesPage"); },
  "/fiqh": () => { void import("@/pages/fiqh/FiqhPage"); },
  "/sections": () => { void import("@/pages/account/SectionsPage"); },
};

/**
 * شريط الأقسام — نفس تبويبات الشريط السفلي من nav-map (تنقّل موحّد).
 */
export const SECTION_TABS: SectionTab[] = BOTTOM_NAV_TABS.map((tab) => ({
  href: tab.href,
  label: tab.label,
  Icon: tab.Icon,
  prefetch: PREFETCH_BY_HREF[tab.href] ?? (() => undefined),
}));

export function isTabActive(location: string, href: string): boolean {
  if (href === "/quran-hub" || href === "/mushaf") {
    return (
      location === "/quran-hub" ||
      location.startsWith("/quran-hub/") ||
      location === "/mushaf" ||
      location.startsWith("/mushaf/") ||
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
      location === "/start-here" ||
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
  if (href === "/sections" || href === "/more") {
    return (
      location === "/sections" ||
      location.startsWith("/sections/") ||
      location === "/more" ||
      location.startsWith("/more/") ||
      location === "/quiz" ||
      location.startsWith("/quiz?")
    );
  }
  return location === href || location.startsWith(href + "/");
}

export function TopSectionBar() {
  const [location] = useLocation();
  const isMobileNav = useIsMobileNav();
  const prefetched = useRef(new Set<string>());
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (isMobileNav) return;
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [location, isMobileNav]);

  if (isImmersiveChromePath(location) || isAuthStandalonePath(location)) return null;

  // على الجوال هذا الشريط تكرار حرفي للشريط السفلي — SECTION_TABS مبنية من
  // نفس BOTTOM_NAV_TABS. يُلغى من الشجرة (لا يُخفى بـCSS) فيُستعاد ~3.5rem من
  // ارتفاع الشاشة ويزول landmark تنقّل مكرر لقارئات الشاشة. يبقى كما هو على
  // سطح المكتب/التابلت حيث لا شريط سفلي (‎@media (min-width: 880px)‎).
  if (isMobileNav) return null;

  function triggerPrefetch(tab: SectionTab) {
    if (prefetched.current.has(tab.href)) return;
    prefetched.current.add(tab.href);
    void tab.prefetch();
  }

  return (
    <nav className="top-section-bar mj-nav-skin mj-chrome-stable" aria-label="أقسام رئيسية">
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
