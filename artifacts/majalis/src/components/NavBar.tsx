"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import NotificationBell from "./NotificationBell";
import { SearchSuggestions } from "./SearchSuggestions";
import { SideNavDrawer } from "./SideNavDrawer";
import { PRIMARY_NAV } from "@/lib/navigation";
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
  const router = useRouter();
  const submit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    router.push(`/search/${encodeURIComponent(q)}`);
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
  const { isAdmin, user, logout } = useAuth();
  const router = useRouter();
  const location = usePathname() ?? "/";
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    setOpen(false);
    setDrawer(false);
  }, [location]);

  const isActive = (href: string) =>
    location === href || (href !== "/" && location.startsWith(href));

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const adminLoginLink = (
    <Link
      href="/login?next=/admin"
      className={isMobile ? "navbar-login navbar-login--mobile" : "navbar-login"}
      aria-label="دخول المسؤول"
    >
      {isMobile ? "دخول" : "دخول المسؤول"}
    </Link>
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
            <nav className="navbar-v3__tabs">
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
            {!isMobile && (
              isAdmin ? (
                <div className="navbar-auth">
                  <NotificationBell />
                  <span>{user?.profile?.full_name || "المسؤول"}</span>
                  <Link href="/admin" className="navbar-admin-link">لوحة التحكم</Link>
                  <button type="button" onClick={handleLogout} className="navbar-logout">خروج</button>
                </div>
              ) : adminLoginLink
            )}
            {isMobile && (
              <>
                {isAdmin ? (
                  <Link href="/admin" className="navbar-login navbar-login--mobile" aria-label="لوحة التحكم">
                    لوحة
                  </Link>
                ) : (
                  adminLoginLink
                )}
                <button
                  type="button"
                  className="navbar-menu-btn navbar-menu-btn--more"
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                >
                  {open ? "إغلاق" : "المزيد"}
                </button>
              </>
            )}
          </div>
        </div>

        {isMobile && open && (
          <div className="navbar-mobile-panel">
            <SearchBox onSubmitDone={() => setOpen(false)} />
            <nav>
              {PRIMARY_NAV.map((t) => (
                <Link key={t.href} href={t.href} style={{ ...tabStyle(isActive(t.href)), display: "block", padding: "0.6rem 0.75rem" }}>
                  {t.label}
                </Link>
              ))}
              {isAdmin ? (
                <>
                  <Link href="/admin" style={{ ...tabStyle(location.startsWith("/admin")), display: "block", padding: "0.6rem 0.75rem" }}>
                    لوحة التحكم
                  </Link>
                  <button type="button" onClick={handleLogout} className="navbar-logout navbar-logout--block">
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <Link href="/login?next=/admin" style={{ ...tabStyle(location === "/login"), display: "block", padding: "0.6rem 0.75rem" }}>
                  دخول المسؤول
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
      <SideNavDrawer open={drawer} onClose={() => setDrawer(false)} />
    </>
  );
}
