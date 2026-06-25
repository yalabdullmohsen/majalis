import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import NotificationBell from "./NotificationBell";
import { SearchSuggestions } from "./SearchSuggestions";
import { SideNavDrawer } from "./SideNavDrawer";
import { PRIMARY_NAV } from "@/lib/navigation";
import { C } from "@/lib/theme";

function useIsMobile() {
  const [mobile, setMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 880 : false);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 880);
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
  const { isLoggedIn, isAdmin, user, logout } = useAuth() as any;
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    setOpen(false);
    setDrawer(false);
  }, [location]);

  const isActive = (href: string) =>
    location === href || (href !== "/" && location.startsWith(href));

  return (
    <>
      <header className="navbar-v3 sticky top-0 z-50 border-b" style={{ background: C.parchment, borderColor: C.line }}>
        <div className="navbar-v3__inner">
          <div className="navbar-v3__start">
            <button
              type="button"
              className="navbar-menu-btn"
              onClick={() => setDrawer(true)}
              aria-label="فتح القائمة الجانبية"
            >
              القائمة
            </button>
            <Link href="/" className="navbar-brand">
              <img src="/logo.png" alt="المجلس العلمي" className="navbar-logo" width={40} height={40} />
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
            {!isMobile && (isLoggedIn ? (
              <div className="navbar-auth">
                <NotificationBell />
                <span>{user?.profile?.full_name || "مرحبًا"}</span>
                <button type="button" onClick={logout} className="navbar-logout">خروج</button>
              </div>
            ) : (
              <Link href="/login" className="navbar-login">دخول</Link>
            ))}
            {isMobile && (
              <button type="button" className="navbar-menu-btn" onClick={() => setOpen((o) => !o)}>
                {open ? "إغلاق" : "المزيد"}
              </button>
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
            </nav>
          </div>
        )}
      </header>
      <SideNavDrawer open={drawer} onClose={() => setDrawer(false)} />
    </>
  );
}
