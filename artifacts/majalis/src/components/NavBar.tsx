import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Moon, Search, Sun, User, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";
import NotificationBell from "./NotificationBell";
import { SectionErrorBoundary } from "./ErrorBoundary";
import { SearchSuggestions } from "./SearchSuggestions";
import { SideNavDrawer } from "./SideNavDrawer";
import { MobileMoreMenu } from "./MobileMoreMenu";
import { useThemePreference } from "./ThemePreferenceProvider";

import { useMobileNavState } from "@/hooks/useMobileNavState";
import { PRIMARY_NAV_ITEMS } from "@/lib/navigation";
import { fetchPrayerTimes, computePrayerCountdown, type PrayerCountdown } from "@/lib/prayer-times";

function PrayerChip() {
  const [cd, setCd] = useState<PrayerCountdown | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let prayers: Parameters<typeof computePrayerCountdown>[0] = [];
    fetchPrayerTimes()
      .then((payload) => {
        prayers = payload.prayers;
        setCd(computePrayerCountdown(prayers));
        intervalRef.current = setInterval(() => setCd(computePrayerCountdown(prayers)), 1000);
      })
      .catch(() => {});
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (!cd?.next) return null;
  // خلال فترة السماح (٣٠ دقيقة بعد الأذان) لا نعرض 00:00:00 للصلاة التي أذّنت للتو،
  // بل نتحوّل مباشرة لاسم وعدّاد الصلاة الفعلية التالية — نفس منطق PrayerTimesPage.
  const inGrace = cd.sinceSeconds != null;
  const displayName = inGrace && cd.graceNextSlot ? cd.graceNextSlot.name : cd.next.name;
  const displayHms = inGrace && cd.graceNextHms ? cd.graceNextHms : cd.remainingHms;
  return (
    <Link href="/prayer-times" className="navbar-prayer-chip" aria-label={`الصلاة القادمة: ${displayName}`}>
      <span className="navbar-prayer-chip__name">{displayName}</span>
      <span className="navbar-prayer-chip__hms" aria-live="off">{displayHms}</span>
    </Link>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 879 : false);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= 879);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mobile;
}

function tabCls(active: boolean, extra = "") {
  return `nav-tab${active ? " nav-tab--active" : ""}${extra ? " " + extra : ""}`;
}

function SearchBox({ onSubmitDone }: { onSubmitDone?: () => void }) {
  const [term, setTerm] = useState("");
  const [, navigate] = useLocation();
  const submit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    navigate(`/search/${encodeURIComponent(q)}`);
    setTerm("");
    onSubmitDone?.();
  };
  return (
    <form
      role="search"
      aria-label="البحث في المجلس العلمي"
      onSubmit={(e) => {
        e.preventDefault();
        submit(term);
      }}
      className="navbar-search-form"
    >
      <SearchSuggestions
        value={term}
        onChange={setTerm}
        onSubmit={submit}
        placeholder="بحث..."
        compact
      />
      <button type="button" onClick={() => submit(term)} aria-label="بحث" className="navbar-search-submit">
        بحث
      </button>
    </form>
  );
}

export default function NavBar() {
  const { isAdmin, isLoggedIn, user, logout } = useAuth();
  const { t } = useLanguage();
  const { resolvedTheme, toggleDark } = useThemePreference();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const { isMenuOpen, moreOpen, toggleMenu, openMenu, closeMenu, closeMore, closeAll } = useMobileNavState();

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return location === href || location === path || (path !== "/" && location.startsWith(path));
  };

  // Bottom nav dispatches "sidenav-open" to open the drawer from outside
  useEffect(() => {
    const handler = () => openMenu();
    window.addEventListener("sidenav-open", handler);
    return () => window.removeEventListener("sidenav-open", handler);
  }, [openMenu]);

  const handleLogout = async () => {
    closeAll();
    await logout();
    navigate("/login");
  };

  // Desktop only: full auth bar
  const desktopAuthLinks = isLoggedIn ? (
    <div className="navbar-auth">
      {isAdmin && (
        <SectionErrorBoundary name="NotificationBell">
          <NotificationBell />
        </SectionErrorBoundary>
      )}
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

  return (
    <>
      <header
        className={`navbar-v3 sticky top-0 border-b${isMenuOpen || moreOpen ? " navbar-v3--menu-open" : ""}`}
      >
        <div className="navbar-v3__inner">
          <div className="navbar-v3__start">
            {/* Hamburger — always visible, opens SideNavDrawer */}
            <button
              type="button"
              className={`navbar-menu-btn navbar-menu-btn--drawer${isMenuOpen ? " navbar-menu-btn--open" : ""}`}
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-controls="main-navigation-drawer"
              aria-label={isMenuOpen ? t("nav_close") : t("nav_menu")}
            >
              <span className="navbar-menu-btn__geo" aria-hidden="true" />
              {isMenuOpen
                ? <X className="navbar-menu-btn__icon" size={16} strokeWidth={1.8} aria-hidden="true" />
                : <Menu className="navbar-menu-btn__icon" size={16} strokeWidth={1.7} aria-hidden="true" />
              }
              <span className="navbar-menu-btn__label">{isMenuOpen ? t("nav_close") : t("nav_menu")}</span>
            </button>
            <Link href="/" className="navbar-brand" aria-label="المجلس العلمي">
              {/*
                الشعار مرشّح LCP في كل صفحة. الأصل PNG بعرض 2044px = ١.١MB بينما
                يُعرض بعرض ≤180px. نقدّم WebP بعرض 400/800 (~37KB / ~89KB) مع
                احتياطي PNG مصغّر (79KB). display:contents يُبقي <img> نفسه عنصرَ
                الـflex فلا يتغيّر أي شيء في التنسيق.
              */}
              <picture style={{ display: "contents" }}>
                <source
                  type="image/webp"
                  srcSet="/logo-calligraphy-400.webp 1x, /logo-calligraphy-800.webp 2x"
                />
                <img
                  src="/logo-calligraphy-400.png"
                  alt="المجلس العلمي"
                  className="navbar-logo navbar-logo--calligraphy"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width="400"
                  height="154"
                />
              </picture>
            </Link>
          </div>

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
            {/* عداد الصلاة التالية — سطح المكتب فقط */}
            {!isMobile && <PrayerChip />}
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
            {/* زر البحث الشامل */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("global-search-open"))}
              aria-label="البحث الشامل (Ctrl+K)"
              title="البحث الشامل — Ctrl+K"
              className="navbar-search-cmd"
            >
              <Search size={15} strokeWidth={1.4} aria-hidden="true" />
              <span className="navbar-search-hint">بحث</span>
              <kbd className="navbar-search-kbd" aria-hidden="true">K</kbd>
            </button>
            {/* Desktop: search + auth + lang */}
            {!isMobile && <SearchBox />}
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
            {isMobile && isAdmin && (
              <SectionErrorBoundary name="NotificationBell">
                <NotificationBell />
              </SectionErrorBoundary>
            )}
          </div>
        </div>
      </header>

      <SideNavDrawer
        open={isMenuOpen}
        onClose={closeMenu}
        onLogout={handleLogout}
      />

      {/* Mobile "more" menu — still used if ever triggered, but hidden on mobile now */}
      {!isMobile && (
        <MobileMoreMenu
          open={moreOpen}
          onClose={closeMore}
          isActive={isActive}
          isAdmin={isAdmin}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          searchBox={<SearchBox onSubmitDone={closeMore} />}
          location={location}
        />
      )}
    </>
  );
}
