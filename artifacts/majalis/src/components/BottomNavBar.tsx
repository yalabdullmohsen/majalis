import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Clock, GraduationCap, Home, LayoutGrid } from "lucide-react";
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
  { href: "/quran-hub",    label: "القرآن",      Icon: BookOpen },
  { href: "/prayer-times", label: "الصلاة",      Icon: Clock },
  { href: "/lessons",      label: "تعلّم",       Icon: GraduationCap },
];

export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    // «تعلّم» يغطي دروس/مسارات/أبواب العلم بلا التباس مع مسارات أخرى.
    if (href === "/lessons") {
      return (
        location === "/lessons" || location.startsWith("/lessons/")
        || location === "/learn" || location.startsWith("/learn/")
        || location === "/learning" || location.startsWith("/learning/")
        || location === "/learning-plan" || location.startsWith("/learning-plan/")
        || location === "/my-learning" || location.startsWith("/my-learning/")
      );
    }
    return location === href || location.startsWith(`${href}/`);
  };

  // قارئ المصحف /mushaf غامر مخصَّص بتنقّله الخاص (pager/سحب صفحات) —
  // شريط تنقّل سفلي عام فوقه يجعله يبدو صفحة ويب لا تطبيق قراءة، ويحجز
  // مساحة (--bottom-nav-h) كانت ستبقى محسوبة في تخطيط المصحف بلا داعٍ.
  if (location.startsWith("/mushaf")) return null;

  return (
    <>
      <nav className="bottom-nav bottom-nav--v2" aria-label="التنقل السفلي">
        {NAV_TABS.map(({ href, label, Icon }) => {
          const active = isActive(href);
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
          className={`bottom-nav__tab${moreOpen ? " is-active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-label="قائمة التطبيق"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <span className="bottom-nav__tab-icon" aria-hidden="true">
            <LayoutGrid size={20} strokeWidth={moreOpen ? 2.25 : 1.75} aria-hidden={true} />
          </span>
          <span className="bottom-nav__tab-label">المزيد</span>
        </button>
      </nav>

      <MoreBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
