"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";
import NotificationBell from "./NotificationBell";
import { SearchSuggestions } from "./SearchSuggestions";
import { SideNavDrawer } from "./SideNavDrawer";
import { MobileMoreMenu } from "./MobileMoreMenu";

import { C } from "@/lib/theme";
import { useMobileNavState } from "@/hooks/useMobileNavState";
import { PRIMARY_NAV_ITEMS } from "@/lib/navigation";

function useIsMobile() {
  const [mobile, setMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 879 : false);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= 879);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mobile;
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: "0.875rem",
    padding: "0.375rem 0.875rem",
    borderRadius: "0.5rem",
    whiteSpace: "nowrap",
    textDecoration: "none",
    color: active ? C.emeraldDeep : C.inkSoft,
    background: active
      ? "color-mix(in srgb, var(--majalis-emerald) 10%, transparent)"
      : "transparent",
    fontWeight: active ? 700 : 500,
    transition: "background 120ms ease, color 120ms ease",
  };
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
  const { lang, setLang, t } = useLanguage();
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
      {isAdmin && <NotificationBell />}
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
              {isMenuOpen ? (
                <svg className="navbar-menu-btn__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2.5 2.5L13.5 13.5M13.5 2.5L2.5 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg className="navbar-menu-btn__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M1 4h14M1 8h14M1 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              )}
              <span className="navbar-menu-btn__label">{isMenuOpen ? t("nav_close") : t("nav_menu")}</span>
            </button>
            <Link href="/" className="navbar-brand" aria-label="مجالس">
              <img
                src="/logo.png"
                alt=""
                className="navbar-logo"
                width={34}
                height={34}
                loading="eager"
                decoding="async"
              />
              <span className="site-brand-logotype">
                <strong className="site-brand-logotype__main">المجلس العلمي</strong>
              </span>
            </Link>
          </div>

          {/* Desktop tabs */}
          {!isMobile && (
            <nav className="navbar-v3__tabs" aria-label={lang === "en" ? "Main navigation" : "التنقل الرئيسي"}>
              {PRIMARY_NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} style={tabStyle(isActive(item.href))}>
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" style={{ ...tabStyle(location.startsWith("/admin")), color: C.brassDeep }}>
                  {t("nav_admin_panel")}
                </Link>
              )}
            </nav>
          )}

          <div className="navbar-v3__end">
            {/* زر البحث الشامل */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("global-search-open"))}
              aria-label="البحث الشامل"
              title="البحث الشامل"
              className="navbar-search-cmd"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M11 11L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <span className="navbar-search-hint">بحث</span>
            </button>
            {/* Desktop: search + auth + lang */}
            {!isMobile && <SearchBox />}
            {!isMobile && desktopAuthLinks}
            {!isMobile && (
              <button
                type="button"
                className="navbar-lang-btn"
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
                title={lang === "ar" ? "EN" : "عر"}
              >
                {lang === "ar" ? "EN" : "عر"}
              </button>
            )}

            {/* Mobile: single auth icon only (no more / lang — those are in bottom nav + side nav) */}
            {isMobile && isAdmin && <NotificationBell />}
          </div>
        </div>
      </header>

      <SideNavDrawer
        open={isMenuOpen}
        onClose={closeMenu}
        lang={lang}
        onLangToggle={() => setLang(lang === "ar" ? "en" : "ar")}
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
          tabStyle={tabStyle}
          location={location}
        />
      )}
    </>
  );
}
