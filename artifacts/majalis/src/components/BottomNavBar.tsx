import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutGrid } from "lucide-react";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { isComingSoonPath } from "@/lib/nav-visibility";
import { BOTTOM_NAV_TABS } from "@/lib/nav-map";
import { getActiveTab, type BottomTabId } from "@/lib/get-active-tab";
import { haptics } from "@/lib/haptics";
import { MoreBottomSheet } from "./MoreBottomSheet";

const HREF_TO_ID: Record<string, BottomTabId> = {
  "/quran-knowledge": "quran",
  "/lessons": "lessons",
  "/prayer-times": "prayer",
  "/fiqh": "fiqh",
};

const TAB_PREFETCH: Record<string, () => Promise<unknown>> = {
  "/quran-knowledge": () => import("@/views/QuranKnowledgeHubPage"),
  "/lessons": () => import("@/views/LessonsPage"),
  "/prayer-times": () => import("@/views/PrayerTimesPage"),
  "/fiqh": () => import("@/views/FiqhPage"),
  "/": () => import("@/views/HomePage"),
};

/** شريط سفلي — مشتق من nav-map (مصدر واحد): قرآن · الدروس · الصلاة · فقه · المزيد */
export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const prefetched = useRef(new Set<string>());

  const activeId = getActiveTab(location);
  // «المزيد» يُضاء فقط عندما لا ينتمي المسار لأي تبويب أساسي — لا يُشارك النشاط مع تبويب آخر
  const moreActive = activeId === "more";

  if (isImmersiveChromePath(location)) return null;

  function triggerPrefetch(href: string) {
    const load = TAB_PREFETCH[href];
    if (!load || prefetched.current.has(href)) return;
    prefetched.current.add(href);
    void load();
  }

  return (
    <>
      <nav className="bottom-nav bottom-nav--v2 bottom-nav--m2030 mj-nav-skin" aria-label="التنقل السفلي">
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
              onClick={() => haptics.selection()}
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
            setMoreOpen(true);
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

      <MoreBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
