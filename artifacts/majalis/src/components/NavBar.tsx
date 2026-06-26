"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import NotificationBell from "./NotificationBell";
import { SearchSuggestions } from "./SearchSuggestions";
import { SideNavDrawer } from "./SideNavDrawer";
import { MOBILE_MORE_NAV, PRIMARY_NAV } from "@/lib/navigation";
import { C } from "@/lib/theme";

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
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const closeDrawer = useCallback(() => setDrawer(false), []);

  useEffect(() => {
    document.body.classList.remove("side-nav-open");
    document.body.classList.remove("navbar-more-open");
  }, []);

  useEffect(() => {
    setOpen(false);
    setDrawer(false);
  }, [location]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        const btn = document.querySelector(".navbar-menu-btn--more");
        if (btn && btn.contains(target)) return;
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.body.classList.add("navbar-more-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.body.classList.remove("navbar-more-open");
    };
  }, [open]);

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return location === href || location === path || (path !== "/" && location.startsWith(path));
  };

  const handleLogout = async () => {
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
      <header className="navbar-v3 sticky top-0 z-50 border-b" style={{ background: C.parchment, borderColor: C.line }}>
        <div className="navbar-v3__inner">
          <div className="navbar-v3__start">
            <button
              type="button"
              className="navbar-menu-btn navbar-menu-btn--drawer"
              onClick={() => setDrawer(true)}
              aria-label="فتح القائمة الجانبية"
            >
              القائمة
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
                <Link key={t.href} href={t.href} style={tabStyle(isActive(t.href))}>
                  {t.label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" style={{ ...tabStyle(location.startsWith("/admin")), color: C.brassDeep }}>
                  لوحة التحكم
                </Link>
              )}
            </nav>
          )}

          <div className="navbar-v3__end">
            {!isMobile && <SearchBox />}
            {!isMobile && authLinks}
            {isMobile && (
              <>
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
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                  aria-controls="navbar-mobile-more-panel"
                  aria-haspopup="true"
                >
                  {open ? "إغلاق" : "المزيد"}
                </button>
              </>
            )}
          </div>
        </div>

        {isMobile && open && (
          <div
            id="navbar-mobile-more-panel"
            ref={panelRef}
            className="navbar-mobile-panel"
            role="dialog"
            aria-label="قائمة المزيد"
          >
            <SearchBox onSubmitDone={() => setOpen(false)} />
            <nav aria-label="روابط المزيد">
              {MOBILE_MORE_NAV.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setOpen(false)}
                  style={{ ...tabStyle(isActive(t.href)), display: "block", padding: "0.6rem 0.75rem" }}
                >
                  {t.label}
                </Link>
              ))}
              {isAdmin ? (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    style={{ ...tabStyle(location.startsWith("/admin")), display: "block", padding: "0.6rem 0.75rem" }}
                  >
                    لوحة التحكم
                  </Link>
                  <button type="button" onClick={handleLogout} className="navbar-logout navbar-logout--block">
                    تسجيل الخروج
                  </button>
                </>
              ) : isLoggedIn ? (
                <>
                  <Link href="/settings" onClick={() => setOpen(false)} style={{ ...tabStyle(isActive("/settings")), display: "block", padding: "0.6rem 0.75rem" }}>
                    الإعدادات
                  </Link>
                  <button type="button" onClick={handleLogout} className="navbar-logout navbar-logout--block">
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} style={{ ...tabStyle(isActive("/login")), display: "block", padding: "0.6rem 0.75rem" }}>
                    تسجيل الدخول
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} style={{ ...tabStyle(isActive("/register")), display: "block", padding: "0.6rem 0.75rem" }}>
                    إنشاء حساب
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
      <SideNavDrawer open={drawer} onClose={closeDrawer} />
    </>
  );
}
