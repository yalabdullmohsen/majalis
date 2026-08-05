import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutGrid } from "lucide-react";
import { isNavHrefActive } from "@/lib/nav-active";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { isComingSoonPath } from "@/lib/nav-visibility";
import { BOTTOM_NAV_TABS } from "@/lib/nav-map";
import { isTabActive } from "./TopSectionBar";
import { MoreBottomSheet } from "./MoreBottomSheet";

/** شريط سفلي — مشتق من nav-map (مصدر واحد) */
export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const onPrimaryTab = BOTTOM_NAV_TABS.some(({ href }) =>
    href === "/quran-knowledge"
      ? isTabActive(location, "/quran-knowledge")
      : isNavHrefActive(location, href),
  );
  const moreActive = moreOpen || !onPrimaryTab;

  if (isImmersiveChromePath(location)) return null;

  return (
    <>
      <nav className="bottom-nav bottom-nav--v2 bottom-nav--m2030 mj-nav-skin" aria-label="التنقل السفلي">
        {BOTTOM_NAV_TABS.map(({ href, label, Icon }) => {
          const active =
            href === "/quran-knowledge"
              ? isTabActive(location, "/quran-knowledge")
              : isNavHrefActive(location, href);
          const soon = isComingSoonPath(href);
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav__tab${active ? " is-active" : ""}${soon ? " is-soon" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={soon ? `${label} — قريبًا` : label}
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
          onClick={() => setMoreOpen(true)}
          aria-label="المزيد"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
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
