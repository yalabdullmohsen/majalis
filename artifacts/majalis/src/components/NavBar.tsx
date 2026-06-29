"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { useAuth } from "./AuthProvider";
import NotificationBell from "./NotificationBell";
import { SearchSuggestions } from "./SearchSuggestions";
import { SideNavDrawer } from "./SideNavDrawer";
import { MobileAuthMenu } from "./MobileAuthMenu";
import { PRIMARY_NAV } from "@/lib/navigation";
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
  const { isMenuOpen, accountOpen, toggleMenu, closeMenu, toggleAccount, closeAccount, closeAll } =
    useMobileNavState();

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
      <span>{user?.profile?.full_name || user?.profile?.name || user?.email || "حسابي"}</span>
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

  const overlayOpen = isMenuOpen || accountOpen;

  return (
    <>
      <header
        className={`navbar-v3 sticky top-0 border-b${overlayOpen ? " navbar-v3--menu-open" : ""}${isMobile ? " navbar-v3--mobile" : ""}`}
        style={{ background: C.parchment, borderColor: C.line }}
      >
        <div className={`navbar-v3__inner${isMobile ? " navbar-v3__inner--mobile" : ""}`}>
          {isMobile ? (
            <>
              <div className="navbar-v3__start">
                <button
                  type="button"
                  className="navbar-menu-btn navbar-menu-btn--drawer"
                  onClick={toggleMenu}
                  aria-expanded={isMenuOpen}
                  aria-controls="main-navigation-drawer"
                  aria-label={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
                >
                  <Menu size={20} aria-hidden="true" />
                  <span>{isMenuOpen ? "إغلاق" : "القائمة"}</span>
                </button>
              </div>

              <div className="navbar-v3__center">
                <Link href="/" className="navbar-brand navbar-brand--center" aria-label="العودة للرئيسية">
                  <img
                    src="/logo.png"
                    alt=""
                    className="navbar-logo"
                    width={40}
                    height={40}
                    loading="eager"
                    decoding="async"
                  />
                </Link>
              </div>

              <div className="navbar-v3__end">
                <MobileAuthMenu
                  open={accountOpen}
                  onClose={closeAccount}
                  onToggle={toggleAccount}
                  onLogout={handleLogout}
                  isActive={isActive}
                />
              </div>
            </>
          ) : (
            <>
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

              <div className="navbar-v3__end">
                <SearchBox />
                {authLinks}
              </div>
            </>
          )}
        </div>
      </header>

      <SideNavDrawer open={isMenuOpen} onClose={closeMenu} mobileLayout={isMobile} />
    </>
  );
}
