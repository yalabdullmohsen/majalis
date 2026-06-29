"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import NotificationBell from "./NotificationBell";
import { SearchSuggestions } from "./SearchSuggestions";
import { SideNavDrawer } from "./SideNavDrawer";
import { MobileMoreMenu } from "./MobileMoreMenu";
import { NAVBAR_ABOUT_LINK, PRIMARY_NAV } from "@/lib/navigation";
import { C } from "@/lib/theme";
import { useMobileNavState } from "@/hooks/useMobileNavState";

function useIsMobile() {
  const [mobile, setMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 879 : false);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= 879);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mobile;
}

function tabClass(active: boolean) {
  return `navbar-v3__tab${active ? " navbar-v3__tab--active" : ""}`;
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
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const { isMenuOpen, moreOpen, toggleMenu, closeMenu, closeMore, toggleMore, closeAll } = useMobileNavState();

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return location === href || location === path || (path !== "/" && location.startsWith(path));
  };

  const handleLogout = async () => {
    closeAll();
    await logout();
    navigate("/login");
  };

  const authLinks = isLoggedIn ? (
    <div className="navbar-auth">
      {isAdmin && <NotificationBell />}
      <span>{user?.profile?.full_name || user?.email || "حسابي"}</span>
      {isAdmin && (
        <Link href="/admin" className="navbar-admin-link">
          لوحة التحكم
        </Link>
      )}
      <button type="button" onClick={handleLogout} className="navbar-logout">
        خروج
      </button>
    </div>
  ) : (
    <div className="navbar-auth navbar-auth--guest">
      <Link href="/login" className="navbar-login">
        دخول
      </Link>
      <Link href="/register" className="navbar-register">
        إنشاء حساب
      </Link>
    </div>
  );

  return (
    <>
      <header
        className={`navbar-v3 sticky top-0 border-b${isMenuOpen || moreOpen ? " navbar-v3--menu-open" : ""}`}
        style={{ background: C.parchment, borderColor: C.line }}
      >
        <div className="navbar-v3__inner">
          <div className="navbar-v3__start">
            <button
              type="button"
              className="navbar-menu-btn navbar-menu-btn--drawer"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-controls="main-navigation-drawer"
              aria-label={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {isMenuOpen ? "إغلاق" : "القائمة"}
            </button>
            <Link href="/" className="navbar-brand">
              <img
                src="/logo.png"
                alt=""
                className="navbar-logo"
                width={40}
                height={40}
                loading="eager"
                decoding="async"
              />
              <span className="site-brand-name">المجلس العلمي</span>
            </Link>
          </div>

          {!isMobile && (
            <nav className="navbar-v3__tabs" aria-label="التنقل الرئيسي">
              {PRIMARY_NAV.map((t) => (
                <Link key={t.href} href={t.href} className={tabClass(isActive(t.href))}>
                  {t.label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" className={`${tabClass(location.startsWith("/admin"))} navbar-v3__tab--admin`}>
                  لوحة التحكم
                </Link>
              )}
            </nav>
          )}

          <div className="navbar-v3__end">
            {!isMobile && (
              <>
                <SearchBox />
                <Link
                  href={NAVBAR_ABOUT_LINK.href}
                  className={`navbar-v3__tab navbar-v3__about-link ${tabClass(isActive(NAVBAR_ABOUT_LINK.href))}`}
                >
                  {NAVBAR_ABOUT_LINK.label}
                </Link>
                {authLinks}
              </>
            )}
            {isMobile && (
              <>
                <Link
                  href={NAVBAR_ABOUT_LINK.href}
                  className={`navbar-v3__tab navbar-v3__about-link navbar-v3__about-link--mobile ${tabClass(isActive(NAVBAR_ABOUT_LINK.href))}`}
                >
                  {NAVBAR_ABOUT_LINK.label}
                </Link>
                {!isLoggedIn && (
                  <Link href="/register" className="navbar-register navbar-register--mobile" aria-label="إنشاء حساب">
                    حساب
                  </Link>
                )}
                {!isLoggedIn ? (
                  <Link href="/login" className="navbar-login navbar-login--mobile" aria-label="تسجيل الدخول">
                    دخول
                  </Link>
                ) : isAdmin ? (
                  <Link href="/admin" className="navbar-login navbar-login--mobile" aria-label="لوحة التحكم">
                    لوحة
                  </Link>
                ) : (
                  <Link href="/settings" className="navbar-login navbar-login--mobile" aria-label="حسابي">
                    حسابي
                  </Link>
                )}
                <button
                  type="button"
                  className="navbar-menu-btn navbar-menu-btn--more"
                  onClick={toggleMore}
                  aria-expanded={moreOpen}
                  aria-controls="navbar-mobile-more-panel"
                  aria-haspopup="true"
                >
                  {moreOpen ? "إغلاق" : "المزيد"}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <SideNavDrawer open={isMenuOpen} onClose={closeMenu} />

      {isMobile && (
        <MobileMoreMenu
          open={moreOpen}
          onClose={closeMore}
          isActive={isActive}
          isAdmin={isAdmin}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          searchBox={<SearchBox onSubmitDone={closeMore} />}
          tabClass={tabClass}
          location={location}
        />
      )}
    </>
  );
}
