import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Clock, GraduationCap, Home, LayoutGrid } from "lucide-react";
import { isNavHrefActive } from "@/lib/nav-active";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { MoreBottomSheet } from "./MoreBottomSheet";
import "@/styles/igds/components.css";
import "@/styles/igds/navigation.css";

type NavTab = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
  isActive?: (location: string) => boolean;
};

const LEARN_PREFIXES = ["/lessons", "/learn", "/learning", "/quiz", "/flashcards", "/cards"];

function isLearnActive(location: string): boolean {
  return LEARN_PREFIXES.some((p) => isNavHrefActive(location, p));
}

/** شريط سفلي: الرئيسية · القرآن · الصلاة · التعلم · المزيد */
const NAV_TABS: NavTab[] = [
  { href: "/", label: "الرئيسية", Icon: Home },
  { href: "/mushaf", label: "القرآن", Icon: BookOpen },
  { href: "/prayer-times", label: "الصلاة", Icon: Clock },
  { href: "/lessons", label: "التعلم", Icon: GraduationCap, isActive: isLearnActive },
];

export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const onPrimaryTab = NAV_TABS.some(({ href, isActive }) =>
    isActive ? isActive(location) : isNavHrefActive(location, href),
  );
  const moreActive = moreOpen || !onPrimaryTab;

  if (isImmersiveChromePath(location)) return null;

  return (
    <>
      <nav className="igds-bottom-nav" aria-label="التنقل السفلي">
        {NAV_TABS.map(({ href, label, Icon, isActive }) => {
          const active = isActive ? isActive(location) : isNavHrefActive(location, href);
          return (
            <Link
              key={href}
              href={href}
              className={`igds-bottom-nav__tab${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="igds-bottom-nav__icon" aria-hidden="true">
                <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden={true} />
              </span>
              <span className="igds-bottom-nav__label">{label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className={`igds-bottom-nav__tab${moreActive ? " is-active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-label="المزيد"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <span className="igds-bottom-nav__icon" aria-hidden="true">
            <LayoutGrid size={20} strokeWidth={moreActive ? 2.25 : 1.75} aria-hidden={true} />
          </span>
          <span className="igds-bottom-nav__label">المزيد</span>
        </button>
      </nav>

      <MoreBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
