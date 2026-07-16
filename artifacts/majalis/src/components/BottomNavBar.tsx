import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, GraduationCap, Home, LayoutGrid, Library, Scale, Sunset, Users } from "lucide-react";
import { MoreBottomSheet } from "./MoreBottomSheet";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";

type NavTab = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
};

const NAV_TABS: NavTab[] = [
  { href: "/",          label: "الرئيسية", Icon: Home },
  { href: "/lessons",   label: "تعلّم",    Icon: GraduationCap },
  { href: "/quran-hub", label: "القرآن",   Icon: BookOpen },
  { href: "/library",   label: "المكتبة",  Icon: Library },
  { href: "/scholars",  label: "العلماء",  Icon: Users },
  { href: "/fiqh",      label: "الفقه",    Icon: Scale },
];

export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { countdown } = usePrayerCountdown();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(href + "/");
  };

  const next = countdown?.next;

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

      {/* شارة الصلاة القادمة — تظهر فوق تبويب الدروس عند الحاجة */}
      {next && (
        <div className="bottom-nav__prayer-float" aria-hidden="true">
          <Sunset size={12} />
          <span>{next.name} · {next.time}</span>
        </div>
      )}

      <MoreBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
