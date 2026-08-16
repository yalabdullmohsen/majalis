import { useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link, useLocation } from "wouter";
import { LayoutGrid } from "lucide-react";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { isComingSoonPath } from "@/lib/nav-visibility";
import { BOTTOM_NAV_TABS } from "@/lib/nav-map";
import { getActiveTab, type BottomTabId } from "@/lib/get-active-tab";
import { haptics } from "@/lib/haptics";

const MoreBottomSheet = lazy(() =>
  import("./MoreBottomSheet").then((m) => ({ default: m.MoreBottomSheet })),
);

const HREF_TO_ID: Record<string, BottomTabId> = {
  "/mushaf": "quran",
  "/quran-hub": "quran",
  "/quran-knowledge": "quran",
  "/lessons": "lessons",
  "/prayer-times": "prayer",
  "/fiqh": "fiqh",
};

const TAB_PREFETCH: Record<string, () => Promise<unknown>> = {
  "/quran-hub": () => import("@/pages/quran/QuranHubPage"),
  "/mushaf": () => import("@/pages/quran/MushafReaderPage"),
  "/quran-knowledge": () => import("@/pages/quran/QuranKnowledgeHubPage"),
  "/lessons": () => import("@/pages/lessons/LessonsPage"),
  "/prayer-times": () => import("@/pages/worship/PrayerTimesPage"),
  "/fiqh": () => import("@/pages/fiqh/FiqhPage"),
  "/": () => import("@/pages/account/HomePage"),
};

/** شريط سفلي — مشتق من nav-map (مصدر واحد): قرآن · الدروس · الصلاة · فقه · المزيد */
export function BottomNavBar({ isHidden = false }: { isHidden?: boolean } = {}) {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const prefetched = useRef(new Set<string>());

  const closeMore = useCallback(() => setMoreOpen(false), []);

  // أي تنقّل (تبويب سفلي أو رابط داخل الشيت) يغلق «المزيد» فورًا —
  // يمنع بقاء body position:fixed بعد مغادرة الشيت.
  useEffect(() => {
    setMoreOpen(false);
  }, [location]);

  const activeId = getActiveTab(location);
  const moreActive = moreOpen || activeId === "more";

  if (isImmersiveChromePath(location)) return null;

  function triggerPrefetch(href: string) {
    const load = TAB_PREFETCH[href];
    if (!load || prefetched.current.has(href)) return;
    prefetched.current.add(href);
    void load();
  }

  const visibilityClass = isHidden ? "bottom-nav--hidden" : "bottom-nav--visible";

  return (
    <>
      <nav
        className={`bottom-nav bottom-nav--v2 bottom-nav--m2030 mj-nav-skin mj-chrome-stable mj-chrome-scrollable ${visibilityClass}`}
        aria-label="التنقل السفلي"
        data-hidden={isHidden ? "true" : "false"}
      >
        {BOTTOM_NAV_TABS.map(({ href, label, Icon }) => {
          const id = HREF_TO_ID[href];
          const active = !moreOpen && id === activeId;
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
                closeMore();
                haptics.selection();
              }}
            >
              <span className="bottom-nav__tab-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden={true} />
              </span>
              <span className="bottom-nav__tab-label">{soon ? "قريبًا" : label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className={`bottom-nav__tab${moreActive ? " is-active" : ""}`}
          onClick={() => {
            haptics.selection();
            setMoreOpen((v) => !v);
          }}
          aria-label="المزيد"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-current={moreActive ? "page" : undefined}
        >
          <span className="bottom-nav__tab-icon" aria-hidden="true">
            <LayoutGrid size={20} strokeWidth={moreActive ? 2.25 : 1.75} aria-hidden={true} />
          </span>
          <span className="bottom-nav__tab-label">المزيد</span>
        </button>
      </nav>

      {moreOpen ? (
        <Suspense fallback={null}>
          <MoreBottomSheet open={moreOpen} onClose={closeMore} />
        </Suspense>
      ) : null}
    </>
  );
}
