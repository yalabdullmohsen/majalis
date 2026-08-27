/**
 * الشريط السفلي — مشتق من سجل الأقسام فقط.
 * مركز القرآن · الدروس · الصلاة · فقه · الأقسام
 */
import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { isAuthStandalonePath, isImmersiveChromePath } from "@/lib/immersive-chrome";
import { isComingSoonPath } from "@/lib/nav-visibility";
import { BOTTOM_NAV_TABS } from "@/lib/nav-map";
import { getActiveTab, type BottomTabId } from "@/lib/get-active-tab";
import { haptics } from "@/lib/haptics";

const HREF_TO_ID: Record<string, BottomTabId> = {
  "/mushaf": "quran",
  "/quran-hub": "quran",
  "/quran-knowledge": "quran",
  "/lessons": "lessons",
  "/prayer-times": "prayer",
  "/fiqh": "fiqh",
  "/sections": "sections",
  "/more": "sections",
};

const TAB_PREFETCH: Record<string, () => Promise<unknown>> = {
  "/quran-hub": () => import("@/pages/quran/QuranHubPage"),
  "/mushaf": () => import("@/pages/quran/MushafReaderPage"),
  "/quran-knowledge": () => import("@/pages/quran/QuranKnowledgeHubPage"),
  "/lessons": () => import("@/pages/lessons/LessonsPage"),
  "/prayer-times": () => import("@/pages/worship/PrayerTimesPage"),
  "/fiqh": () => import("@/pages/fiqh/FiqhPage"),
  "/sections": () => import("@/pages/account/SectionsPage"),
  "/quiz": () => import("@/pages/account/QuizPage"),
  "/": () => import("@/pages/account/HomePage"),
};

export function BottomNavBar({ isHidden = false }: { isHidden?: boolean } = {}) {
  const [location] = useLocation();
  const prefetched = useRef(new Set<string>());
  const activeId = getActiveTab(location);

  function triggerPrefetch(href: string) {
    const load = TAB_PREFETCH[href];
    if (!load || prefetched.current.has(href)) return;
    prefetched.current.add(href);
    void load();
  }

  // بعد أول إطار: سخّن تبويبات الشريط حتى يكون التنقّل فوريًا
  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      for (const href of BOTTOM_NAV_TABS.map((t) => t.href)) {
        triggerPrefetch(href);
      }
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warm, { timeout: 800 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(warm, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  if (isImmersiveChromePath(location) || isAuthStandalonePath(location)) return null;

  const visibilityClass = isHidden ? "bottom-nav--hidden" : "bottom-nav--visible";

  return (
    <nav
      className={`bottom-nav bottom-nav--v2 bottom-nav--m2030 mj-nav-skin mj-chrome-stable mj-chrome-scrollable ${visibilityClass}`}
      aria-label="التنقل السفلي"
      data-hidden={isHidden ? "true" : "false"}
      data-bottom-nav="sections-ia"
    >
      {BOTTOM_NAV_TABS.map(({ href, label, Icon }) => {
        const id = HREF_TO_ID[href];
        const active = id === activeId;
        const soon = isComingSoonPath(href);
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav__tab${active ? " is-active" : ""}${soon ? " is-soon" : ""}`}
            aria-current={active ? "page" : undefined}
            aria-label={soon ? `${label} — قريبًا` : label}
            onTouchStart={() => triggerPrefetch(href)}
            onMouseEnter={() => triggerPrefetch(href)}
            onFocus={() => triggerPrefetch(href)}
            onClick={() => {
              haptics.selection();
              window.scrollTo(0, 0);
            }}
          >
            <span className="bottom-nav__tab-icon" aria-hidden="true">
              <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden={true} />
            </span>
            <span className="bottom-nav__tab-label">{soon ? "قريبًا" : label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
