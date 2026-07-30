import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Clock, Home, LayoutGrid } from "lucide-react";
import { isNavHrefActive } from "@/lib/nav-active";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { MoreBottomSheet } from "./MoreBottomSheet";

type NavTab = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
};

/* خمس وجهات ثابتة فقط على الهاتف. "سؤال وجواب" انتقل إلى "المزيد" لإفساح
   مكان لعنصر الصلاة المخصَّص (استخدام يومي متكرر يستحق وصولاً مباشرًا). */
const NAV_TABS: NavTab[] = [
  { href: "/",             label: "الرئيسية",    Icon: Home },
  { href: "/mushaf",       label: "القرآن",      Icon: BookOpen },
  { href: "/prayer-times", label: "الصلاة",      Icon: Clock },
];

export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const onPrimaryTab = NAV_TABS.some(({ href }) => isNavHrefActive(location, href));
  const moreActive = moreOpen || !onPrimaryTab;

  // مسارات غامرة (مصحف / صلاة / مركز قرآن) لها تنقّل مخصّص — لا شريط سفلي عام.
  if (isImmersiveChromePath(location)) return null;

  return (
    <>
      <nav className="bottom-nav bottom-nav--v2" aria-label="التنقل السفلي">
        {NAV_TABS.map(({ href, label, Icon }) => {
          const active = isNavHrefActive(location, href);
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav__tab${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="bottom-nav__tab-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden={true} />
              </span>
              <span className="bottom-nav__tab-label">{label}</span>
            </Link>
          );
        })}

        {/* تبويب المزيد */}
        <button
          type="button"
          className={`bottom-nav__tab${moreActive ? " is-active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-label="قائمة التطبيق"
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
