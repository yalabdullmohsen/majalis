import { useEffect, useRef, useState } from "react";
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
  /* بوابة التعلّم الموحّدة — الدروس والمسارات والأدوات منها */
  { href: "/learn",        label: "تعلّم",       Icon: GraduationCap },
];

/** مسارات التبويبات الأساسية الأربعة — أي مسار غيرها يتبع «المزيد». */
function isPrimaryTabPath(location: string): boolean {
  for (const { href } of NAV_TABS) {
    if (href === "/") {
      if (location === "/") return true;
      continue;
    }
    if (href === "/learn") {
      if (
        location === "/learn" ||
        location.startsWith("/learn/") ||
        location === "/fiqh" ||
        location.startsWith("/fiqh/") ||
        location === "/rulings" ||
        location.startsWith("/rulings/") ||
        location === "/seerah" ||
        location.startsWith("/seerah/") ||
        location === "/tawhid" ||
        location.startsWith("/tawhid/") ||
        location === "/prophets" ||
        location.startsWith("/prophets/") ||
        location === "/nations" ||
        location.startsWith("/nations/")
      ) {
        return true;
      }
      continue;
    }
    if (location === href || location.startsWith(href + "/")) return true;
  }
  return false;
}

function clearStickyFocus(el: HTMLElement | null) {
  if (!el) return;
  try {
    el.blur();
  } catch {
    /* ignore */
  }
}

export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const navLockRef = useRef(false);
  const navLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // التحديد من المسار فقط — لا يعتمد على آخر زر ضُغط.
  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    if (href === "/learn") {
      return (
        location === "/learn" ||
        location.startsWith("/learn/") ||
        location === "/fiqh" ||
        location.startsWith("/fiqh/") ||
        location === "/rulings" ||
        location.startsWith("/rulings/") ||
        location === "/seerah" ||
        location.startsWith("/seerah/") ||
        location === "/tawhid" ||
        location.startsWith("/tawhid/") ||
        location === "/prophets" ||
        location.startsWith("/prophets/") ||
        location === "/nations" ||
        location.startsWith("/nations/")
      );
    }
    return location === href || location.startsWith(href + "/");
  };

  // «المزيد» محدد فقط: الورقة مفتوحة، أو المسار خارج التبويبات الأربعة.
  const moreSelected = moreOpen || !isPrimaryTabPath(location);

  // عند تغيّر المسار: أغلق الورقة وأزل أي حالة ضغط/تركيز معلّقة على الزر.
  useEffect(() => {
    setMoreOpen(false);
    clearStickyFocus(moreBtnRef.current);
    navLockRef.current = false;
    if (navLockTimerRef.current) {
      clearTimeout(navLockTimerRef.current);
      navLockTimerRef.current = null;
    }
  }, [location]);

  useEffect(() => {
    return () => {
      if (navLockTimerRef.current) clearTimeout(navLockTimerRef.current);
    };
  }, []);

  const withNavLock = (fn: () => void) => {
    if (navLockRef.current) return;
    navLockRef.current = true;
    try {
      fn();
    } finally {
      if (navLockTimerRef.current) clearTimeout(navLockTimerRef.current);
      navLockTimerRef.current = setTimeout(() => {
        navLockRef.current = false;
        navLockTimerRef.current = null;
      }, 280);
    }
  };

  const closeMore = () => {
    setMoreOpen(false);
    clearStickyFocus(moreBtnRef.current);
  };

  const openMore = () => {
    withNavLock(() => {
      setMoreOpen(true);
      // إزالة :focus/:active المرئية على اللمس بعد الفتح
      requestAnimationFrame(() => clearStickyFocus(moreBtnRef.current));
    });
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
              onClick={(e) => {
                if (navLockRef.current) {
                  e.preventDefault();
                  return;
                }
                withNavLock(() => {
                  closeMore();
                  clearStickyFocus(e.currentTarget);
                });
              }}
            >
              <span className="bottom-nav__tab-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden={true} />
              </span>
              <span className="bottom-nav__tab-label">{label}</span>
            </Link>
          );
        })}

        {/* تبويب المزيد — التحديد من المسار/حالة الورقة فقط، لا من ضغط سابق */}
        <button
          ref={moreBtnRef}
          type="button"
          className={`bottom-nav__tab${moreSelected ? " is-active" : ""}`}
          onClick={() => {
            if (moreOpen) {
              closeMore();
              return;
            }
            openMore();
          }}
          aria-label="قائمة التطبيق"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-current={moreSelected && !moreOpen ? "page" : undefined}
        >
          <span className="bottom-nav__tab-icon" aria-hidden="true">
            <LayoutGrid size={20} strokeWidth={moreSelected ? 2.25 : 1.75} aria-hidden={true} />
          </span>
          <span className="bottom-nav__tab-label">المزيد</span>
        </button>
      </nav>

      <MoreBottomSheet open={moreOpen} onClose={closeMore} />
    </>
  );
}
