import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  BookMarked, BookOpen, Brain, CalendarDays, Clock, MapPin, Scale, ScrollText, User,
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
 * شريط الأقسام — مرتّب حسب أهمية الاستعمال اليومي:
 * الحفظ → علوم القرآن → الحديث → الفقه → الصلاة → المناسبات →
 * الحفظ/المراجعة → الدليل → حسابي → المصحف (قريبًا في النهاية).
 */
export const SECTION_TABS: SectionTab[] = [
  { href: "/memorize", label: "الحفظ", Icon: Brain, prefetch: () => import("@/views/MemorizePage") },
  { href: "/quran-knowledge", label: "القرآن وعلومه", Icon: BookOpen, prefetch: () => import("@/views/QuranKnowledgeHubPage") },
  { href: "/hadith", label: "الحديث والسنة", Icon: ScrollText, prefetch: () => import("@/views/HadithPage") },
  { href: "/fiqh", label: "الفقه والأحكام", Icon: Scale, prefetch: () => import("@/views/FiqhPage") },
  { href: "/prayer-times", label: "الصلاة", Icon: Clock, prefetch: () => import("@/views/PrayerTimesPage") },
  { href: "/occasions-lessons", label: "المناسبات والدروس", Icon: CalendarDays, prefetch: () => import("@/views/OccasionsLessonsHubPage") },
  { href: "/memorization", label: "الحفظ والمراجعة", Icon: Brain, prefetch: () => import("@/views/MemorizationHubPage") },
  { href: "/islamic-directory", label: "الدليل الإسلامي", Icon: MapPin, prefetch: () => import("@/views/IslamicDirectoryHubPage") },
  { href: "/my-learning", label: "حسابي", Icon: User, prefetch: () => import("@/views/MyLearningPage") },
  { href: "/mushaf", label: "القرآن", Icon: BookMarked, prefetch: () => import("@/views/MushafComingSoonPage") },
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
  if (href === "/memorize") {
    return location === "/memorize" || location.startsWith("/memorize/");
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
      location.startsWith("/quran/revelation")
    );
  }
  if (href === "/memorization") {
    return (
      location === "/memorization" ||
      location.startsWith("/memorization/") ||
      location === "/quran-memorization" ||
      location.startsWith("/quran-memorization/") ||
      location.startsWith("/quran/memorization-plans")
    );
  }
  if (href === "/occasions-lessons") {
    return (
      location === "/occasions-lessons" ||
      location === "/occasions" ||
      location.startsWith("/occasions/") ||
      location === "/calendar" ||
      location.startsWith("/calendar/")
    );
  }
  if (href === "/islamic-directory") {
    return (
      location === "/islamic-directory" ||
      location === "/institutions" ||
      location.startsWith("/institutions/") ||
      location === "/islamic-landmarks" ||
      location.startsWith("/islamic-landmarks/")
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
