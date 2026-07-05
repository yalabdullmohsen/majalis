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
    padding: "0.375rem 0.75rem",
    borderRadius: "0.375rem",
    whiteSpace: "nowrap",
    textDecoration: "none",
    color: active ? C.emeraldDeep : C.inkSoft,
    background: active ? C.sage : "transparent",
    fontWeight: active ? 700 : 400,
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
  const { isMenuOpen, moreOpen, toggleMenu, openMenu, closeMenu, closeMore, toggleMore, closeAll } = useMobileNavState();

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
        style={{ background: C.panel, borderColor: C.line, boxShadow: "0 1px 8px rgba(22,78,60,0.07)" }}
      >
        <div className="navbar-v3__inner">
          <div className="navbar-v3__start">
            {/* Hamburger — always visible, opens SideNavDrawer */}
            <button
              type="button"
              className="navbar-menu-btn navbar-menu-btn--drawer"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-controls="main-navigation-drawer"
              aria-label={isMenuOpen ? t("nav_close") : t("nav_menu")}
            >
              {isMenuOpen ? t("nav_close") : t("nav_menu")}
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
              aria-label="البحث الشامل (⌘K)"
              title="البحث الشامل (⌘K)"
              className="navbar-search-global"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="navbar-search-hint">بحث</span>
              <kbd className="navbar-search-kbd">⌘K</kbd>
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
