import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Gamepad2, GraduationCap, Home, LayoutGrid, Sunset } from "lucide-react";
import { MoreBottomSheet } from "./MoreBottomSheet";

type NavTab = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
};

/* 5 وجهات أساسية + "المزيد" = 6 إجمالاً — إعادة تصميم الهوية v3 (2026-07-19):
   يُلغي قرار توحيد الشريط لـ4+المزيد السابق (2026-07-18) ويضيف "الصلاة"
   صراحةً كوجهة سادسة (مواقيت + عد تنازلي + قبلة + إعدادات أذان، جميعها
   موجودة فعلاً عبر /prayer-times ولوحاتها الفرعية). المكتبة/العلماء/الفقه
   تبقى متاحة عبر "المزيد" (MoreBottomSheet) — إعادة تموضع لا حذف وظيفة. */
const NAV_TABS: NavTab[] = [
  { href: "/",             label: "الرئيسية",    Icon: Home },
  { href: "/quran-hub",    label: "القرآن",      Icon: BookOpen },
  { href: "/quiz",         label: "سؤال وجواب", Icon: Gamepad2 },
  { href: "/lessons",      label: "تعلّم",       Icon: GraduationCap },
  { href: "/prayer-times", label: "الصلاة",      Icon: Sunset },
];

export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(href + "/");
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
              <span className="bottom-nav__tab-icon">
                <Icon size={22} strokeWidth={active ? 2.4 : 1.6} aria-hidden={true} />
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
          <span className="bottom-nav__tab-icon">
            <LayoutGrid size={22} strokeWidth={moreOpen ? 2.4 : 1.6} aria-hidden={true} />
          </span>
          <span className="bottom-nav__tab-label">المزيد</span>
        </button>
      </nav>

      <MoreBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
