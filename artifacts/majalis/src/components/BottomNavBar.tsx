import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Clock, GraduationCap, HelpCircle, Home, LayoutGrid } from "lucide-react";
import { MoreBottomSheet } from "./MoreBottomSheet";

type NavTab = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
  /** مسارات إضافية تُفعِّل التبويب (أطول بادئة تفوز عبر ترتيب الاستدعاء). */
  matchPrefixes?: string[];
};

/* ست وجهات ثابتة على الهاتف وفق هيكل المنتج المعتمد:
   الرئيسية · القرآن · سؤال وجواب · تعلّم · الصلاة · المزيد */
const NAV_TABS: NavTab[] = [
  { href: "/",             label: "الرئيسية",     Icon: Home },
  { href: "/quran-hub",    label: "القرآن",       Icon: BookOpen, matchPrefixes: ["/quran-hub", "/mushaf", "/quran"] },
  { href: "/qa",           label: "سؤال وجواب",   Icon: HelpCircle, matchPrefixes: ["/qa", "/quiz"] },
  { href: "/lessons",      label: "تعلّم",        Icon: GraduationCap, matchPrefixes: ["/lessons", "/learn", "/learning", "/learning-plan", "/my-learning"] },
  { href: "/prayer-times", label: "الصلاة",       Icon: Clock, matchPrefixes: ["/prayer-times", "/adhkar", "/salah"] },
];

export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (tab: NavTab) => {
    if (tab.href === "/") return location === "/";
    const prefixes = tab.matchPrefixes ?? [tab.href];
    return prefixes.some(
      (p) => location === p || location.startsWith(p + "/"),
    );
  };

  // قارئ المصحف /mushaf غامر مخصَّص بتنقّله الخاص (pager/سحب صفحات) —
  // شريط تنقّل سفلي عام فوقه يجعله يبدو صفحة ويب لا تطبيق قراءة، ويحجز
  // مساحة (--bottom-nav-h) كانت ستبقى محسوبة في تخطيط المصحف بلا داعٍ.
  if (location.startsWith("/mushaf")) return null;

  return (
    <>
      <nav className="bottom-nav bottom-nav--v2" aria-label="التنقل السفلي">
        {NAV_TABS.map((tab) => {
          const { href, label, Icon } = tab;
          const active = isActive(tab);
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
