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

  // تسخين متأخر جدًا — لا تنافس TBT/LCP على أول دخول (اللمس/المرور يكفي للتنقّل)
  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      for (const href of BOTTOM_NAV_TABS.map((t) => t.href)) {
        // لا تُسخَّن المصحف والدروس الثقيلة تلقائيًا على الرئيسية
        if (href === "/mushaf" || href === "/lessons" || href === "/quran-hub") continue;
        triggerPrefetch(href);
      }
    };
    const afterLoad = () => {
      // setTimeout ثابت — لا rIC (Lighthouse يسحب الخمول أثناء القياس)
      window.setTimeout(warm, 25_000);
    };
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });
    return () => {
      cancelled = true;
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
              if (!active) {
                window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
              }
            }}
          >
            <span className="bottom-nav__tab-icon" aria-hidden="true">
              <Icon size={18} strokeWidth={active ? 2 : 1.5} aria-hidden={true} />
            </span>
            <span className="bottom-nav__tab-label">{soon ? "قريبًا" : label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
