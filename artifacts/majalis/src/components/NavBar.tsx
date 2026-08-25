import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Moon, Search, Sun, User, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";
import { useThemePreference } from "./ThemePreferenceProvider";

import { useMobileNavState } from "@/hooks/useMobileNavState";
import { useIsMobileNav } from "@/hooks/useIsMobileNav";
import { isNavHrefActive } from "@/lib/nav-active";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { PRIMARY_NAV_ITEMS } from "@/lib/navigation";
import { getActiveTab } from "@/lib/get-active-tab";
import { LOBBY_SEARCH_FILTER } from "@/config/section-lobby-chrome";
import { useSharedPrayerCountdown } from "@/components/prayer/PrayerCountdownProvider";
import { HeaderAdSlot } from "@/components/header/HeaderAdSlot";
import { shouldShowHeaderAd } from "@/config/header-ad";
import "@/styles/components/dark-emerald-menus.css";
import "@/styles/components/app-chrome-scroll.css";
import "@/styles/components/top-chrome-layout.css";

const HeaderTicker = lazy(() =>
  import("./HeaderTicker").then((m) => ({ default: m.HeaderTicker })),
);
const SideNavDrawer = lazy(() =>
  import("./SideNavDrawer").then((m) => ({ default: m.SideNavDrawer })),
);

function PrayerChipLive() {
  const { countdown: cd } = useSharedPrayerCountdown();

  if (!cd?.next) return null;
  const inGrace = cd.sinceSeconds != null;
  const displayName = cd.next.name;
  const displayHms = inGrace && cd.sinceHms ? cd.sinceHms : cd.remainingHms;
  return (
    <Link href="/prayer-times" className="navbar-prayer-chip" aria-label={`الصلاة القادمة: ${displayName}`}>
      <span className="navbar-prayer-chip__name">{displayName}</span>
      <span className="navbar-prayer-chip__hms" aria-live="off">{displayHms}</span>
    </Link>
  );
}

function PrayerChip() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setReady(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(reveal, { timeout: 2800 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(reveal, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  if (!ready) {
    return (
      <Link href="/prayer-times" className="navbar-prayer-chip navbar-prayer-chip--placeholder" aria-label="مواقيت الصلاة">
        <span className="navbar-prayer-chip__name">الصلاة</span>
        <span className="navbar-prayer-chip__hms" aria-hidden="true">
          &nbsp;
        </span>
      </Link>
    );
  }

  return <PrayerChipLive />;
}

function tabCls(active: boolean, extra = "") {
  return `nav-tab${active ? " nav-tab--active" : ""}${extra ? " " + extra : ""}`;
}

const TICKER_FALLBACK = (
  <div className="header-ticker header-ticker--empty" role="status" aria-label="شريط التنبيهات">
    &nbsp;
  </div>
);

function DeferredHeaderTicker() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setReady(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(reveal, { timeout: 3500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(reveal, 1800);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  if (!ready) return TICKER_FALLBACK;

  return (
    <Suspense fallback={TICKER_FALLBACK}>
      <HeaderTicker />
    </Suspense>
  );
}

export default function NavBar() {
  const { isAdmin, isLoggedIn, user, logout } = useAuth();
  const { t } = useLanguage();
  const { resolvedTheme, toggleDark } = useThemePreference();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobileNav();
  const { isMenuOpen, toggleMenu, openMenu, closeMenu, closeAll } = useMobileNavState();
  const [drawerMounted, setDrawerMounted] = useState(false);

  useEffect(() => {
    if (isMenuOpen) setDrawerMounted(true);
  }, [isMenuOpen]);

  const isActive = (href: string) => {
    const path = href.split("?")[0] || href;
    if (path === "/learn") {
      return (
        location === "/learn" ||
        location.startsWith("/learn/") ||
        location === "/lessons" ||
        location.startsWith("/lessons/") ||
        location.startsWith("/learning/") ||
        location === "/my-learning" ||
        location === "/start-here"
      );
    }
    return isNavHrefActive(location, href);
  };

  useEffect(() => {
    void import("@/styles/components/design-redesign.css");
  }, []);

  // Bottom nav dispatches "sidenav-open" to open the drawer from outside
  useEffect(() => {
    const handler = () => openMenu();
    window.addEventListener("sidenav-open", handler);
    return () => window.removeEventListener("sidenav-open", handler);
  }, [openMenu]);

  /* فتح الدرج بسحب الحافة اليمنى (RTL) — على الرئيسية فقط حتى لا يتعارض مع الرجوع */
  useEffect(() => {
    if (isMenuOpen || isImmersiveChromePath(location)) return;
    const path = location.replace(/\/+$/, "") || "/";
    if (path !== "/") return;
    const EDGE = 28;
    const THRESHOLD = 56;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    const isRtl = () => (document.documentElement.dir || "rtl") === "rtl";
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (document.body.classList.contains("mobile-nav-body-lock")) return;
      if (document.body.classList.contains("app-sheet-open")) return;
      const t = e.touches[0];
      const w = window.innerWidth;
      const fromEnd = isRtl() ? t.clientX >= w - EDGE : t.clientX <= EDGE;
      if (!fromEnd) return;
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    };
    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (isRtl() ? dx <= -THRESHOLD : dx >= THRESHOLD) openMenu();
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [isMenuOpen, location, openMenu]);

  const handleLogout = useCallback(async () => {
    closeAll();
    await logout();
    navigate("/login");
  }, [closeAll, logout, navigate]);

  const openSearch = () => {
    closeAll();
    const filter = LOBBY_SEARCH_FILTER[getActiveTab(location)] ?? "all";
    try {
      sessionStorage.setItem("gsm-initial-filter", filter);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("global-search-open", { detail: { filter } }));
  };

  // Desktop only: full auth bar
  const desktopAuthLinks = isLoggedIn ? (
    <div className="navbar-auth">
      <Link href="/stats" className="navbar-user-link">{user?.profile?.full_name || user?.email || t("nav_my_account")}</Link>
      {isAdmin && (
        <Link href="/admin" className="navbar-admin-link">
          {t("nav_admin_panel")}
        </Link>
      )}
      <button type="button" onClick={handleLogout} className="navbar-logout">
        {t("nav_logout")}
      </button>
    </div>
  ) : (
    <div className="navbar-auth navbar-auth--guest">
      <Link href="/login" className="navbar-login">
        {t("nav_login")}
      </Link>
      <Link href="/register" className="navbar-register">
        {t("nav_register")}
      </Link>
    </div>
  );

  // مسارات غامرة (مصحف/تلاوة) لها شريطها الخاص. لوبي الصلاة يظهر الترويسة.
  if (isImmersiveChromePath(location)) return null;

  return (
    <>
      <header
        className={`navbar-v3 border-b mj-nav-skin mj-chrome-stable mj-chrome-scrollable${isMenuOpen ? " navbar-v3--menu-open" : ""}`}
      >
        <div className="navbar-v3__inner">
          <div className="navbar-v3__start">
            {/* Hamburger — always visible, opens SideNavDrawer */}
            <button
              type="button"
              className={`navbar-menu-btn navbar-menu-btn--drawer${isMenuOpen ? " navbar-menu-btn--open" : ""}`}
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-controls={drawerMounted ? "main-navigation-drawer" : undefined}
              aria-label={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              <span className="navbar-menu-btn__geo" aria-hidden="true" />
              {isMenuOpen
                ? <X className="navbar-menu-btn__icon" size={16} strokeWidth={1.8} aria-hidden="true" />
                : <Menu className="navbar-menu-btn__icon" size={16} strokeWidth={1.7} aria-hidden="true" />
              }
              <span className="navbar-menu-btn__label">{isMenuOpen ? "إغلاق" : "القائمة"}</span>
            </button>
          </div>

          {/* منتصف الهيدر: spacer للتوازن — الكارت الإعلاني بجانب زر القمر */}
          <div className="header-ad-slot header-ad-slot--spacer" aria-hidden="true" />

          {/* Desktop tabs */}
          {!isMobile && (
            <nav className="navbar-v3__tabs" aria-label="التنقل الرئيسي">
              {PRIMARY_NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className={tabCls(isActive(item.href))} aria-current={isActive(item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" className={tabCls(location.startsWith("/admin"), "nav-tab--admin")} aria-current={location.startsWith("/admin") ? "page" : undefined}>
                  {t("nav_admin_panel")}
                </Link>
              )}
            </nav>
          )}

          <div className="navbar-v3__end">
            {shouldShowHeaderAd(location) ? <HeaderAdSlot /> : null}
            {/* عداد الصلاة التالية — سطح المكتب فقط؛ يُخفى داخل صفحة المواقيت نفسها */}
            {!isMobile && !isImmersiveChromePath(location) && <PrayerChip />}
            {/* زر الوضع الليلي */}
            <button
              type="button"
              onClick={toggleDark}
              aria-label={resolvedTheme === "dark" ? "التحويل إلى الوضع النهاري" : "التحويل إلى الوضع الليلي"}
              title={resolvedTheme === "dark" ? "وضع نهاري" : "وضع ليلي"}
              className="navbar-theme-toggle"
            >
              {resolvedTheme === "dark"
                ? <Sun size={17} strokeWidth={1.6} aria-hidden="true" />
                : <Moon size={17} strokeWidth={1.6} aria-hidden="true" />
              }
            </button>
            {/* سطح المكتب فقط — على الجوال صف البحث الكامل أدناه يغني عن الأيقونة */}
            {!isMobile && (
              <button
                type="button"
                onClick={openSearch}
                aria-label="فتح البحث"
                title="البحث"
                className="navbar-theme-toggle navbar-search-toggle"
              >
                <Search size={17} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
            {!isMobile && !isImmersiveChromePath(location) && <DeferredHeaderTicker />}
            {!isMobile && desktopAuthLinks}

            {/* Mobile: زر دخول/حساب واضح دائمًا — لا يُترك مخفيًا داخل قائمة الهامبرغر فقط */}
            {isMobile && !isLoggedIn && (
              <Link href="/login" className="navbar-mobile-login" aria-label="تسجيل الدخول">
                <User size={16} strokeWidth={1.8} aria-hidden="true" />
                <span className="navbar-mobile-login__label">دخول</span>
              </Link>
            )}
            {isMobile && isLoggedIn && (
              <Link href="/stats" className="navbar-mobile-login navbar-mobile-login--active" aria-label="حسابي">
                <User size={16} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        {/* صف بحث مستقل — لا يتداخل مع التبويبات أو التيكر */}
        {isMobile && !isImmersiveChromePath(location) && (
          <div className="navbar-v3__search-row">
            <button
              type="button"
              className="navbar-v3__search-btn"
              onClick={openSearch}
              aria-label="فتح البحث"
            >
              <Search size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>ابحث في المحتوى…</span>
            </button>
          </div>
        )}

        {/* تبويبات الأقسام على الجوال عبر TopSectionBar فقط — تجنّب صفّين متداخلين */}

        {/* صف مستقل تحت أزرار الهيدر — يمنع تداخل التيكر مع القائمة/البحث/الحساب */}
        {isMobile && !isImmersiveChromePath(location) && (
          <div className="navbar-ticker-row" aria-label="شريط تنبيهات ومقتطفات">
            <DeferredHeaderTicker />
          </div>
        )}
      </header>

      {drawerMounted ? (
        <Suspense fallback={null}>
          <SideNavDrawer open={isMenuOpen} onClose={closeMenu} onLogout={handleLogout} />
        </Suspense>
      ) : null}
    </>
  );
}
