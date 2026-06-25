import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import NotificationBell from "./NotificationBell";
import { SearchSuggestions } from "./SearchSuggestions";
import { C } from "@/lib/theme";

/** Routes kept working but hidden from main navigation (incomplete or secondary). */
const HIDDEN_NAV_HREFS = new Set([
  "/library",
  "/transcribe",
  "/quiz",
  "/courses",
  "/miracles",
  "/cards",
]);

const TABS = [
  { href: "/", label: "الرئيسية" },
  { href: "/announcements", label: "إعلانات الدروس" },
  { href: "/lessons", label: "الدروس" },
  { href: "/calendar", label: "التقويم" },
  { href: "/kuwait-lessons", label: "دروس الكويت" },
  { href: "/sheikhs", label: "المشايخ" },
  { href: "/fawaid", label: "الفوائد" },
  { href: "/adhkar", label: "الأذكار" },
  { href: "/qa", label: "الأسئلة" },
  { href: "/condolences", label: "قوالب العزاء" },
  { href: "/assistant", label: "المساعد العلمي" },
  { href: "/about", label: "من نحن" },
].filter((tab) => !HIDDEN_NAV_HREFS.has(tab.href));

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
      <button type="submit" aria-label="بحث" className="navbar-search-submit">
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

  useEffect(() => { setOpen(false); }, [location]);

  return (
    <header className="sticky top-0 z-50 border-b" style={{ background: C.parchment, borderColor: C.line }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            flexShrink: 0,
            textDecoration: "none",
            color: C.emeraldDeep,
            minWidth: 0,
          }}
        >
          <img
            src="/logo.png"
            alt="المجلس العلمي"
            className="navbar-logo"
            width={40}
            height={40}
          />
          <span className="site-brand-name">المجلس العلمي</span>
        </Link>

        {!isMobile && (
          <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem", overflowX: "auto", flex: 1, justifyContent: "center" }}>
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} style={tabStyle(location === t.href || (t.href !== "/" && location.startsWith(t.href)))}>{t.label}</Link>
            ))}
            {isAdmin && (
              <Link href="/admin" style={{ ...tabStyle(location.startsWith("/admin")), color: location.startsWith("/admin") ? C.emeraldDeep : C.brassDeep }}>لوحة التحكم</Link>
            )}
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {!isMobile && <SearchBox />}

          {!isMobile && (isLoggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <NotificationBell />
              <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>{user?.profile?.full_name || "مرحبًا"}</span>
              <button onClick={logout} style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, color: C.inkSoft, background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>خروج</button>
            </div>
          ) : (
            <Link href="/login" style={{ fontSize: "0.8125rem", fontWeight: 700, padding: "0.375rem 1rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, textDecoration: "none" }}>دخول</Link>
          ))}

          {isMobile && (
            <button onClick={() => setOpen((o) => !o)} aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} style={{ border: `1px solid ${C.line}`, background: C.panel, borderRadius: "0.5rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, lineHeight: 1, color: C.emeraldDeep }}>
              {open ? "إغلاق" : "القائمة"}
            </button>
          )}
        </div>
      </div>

      {isMobile && open && (
        <div style={{ borderTop: `1px solid ${C.line}`, background: C.parchment, padding: "0.75rem 1rem 1rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <SearchBox onSubmitDone={() => setOpen(false)} />
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} style={{ ...tabStyle(location === t.href), padding: "0.6rem 0.75rem" }}>{t.label}</Link>
            ))}
            {isAdmin && (
              <Link href="/admin" style={{ ...tabStyle(location.startsWith("/admin")), padding: "0.6rem 0.75rem", color: C.brassDeep }}>لوحة التحكم</Link>
            )}
          </nav>
          <div style={{ borderTop: `1px solid ${C.line}`, marginTop: "0.75rem", paddingTop: "0.75rem" }}>
            {isLoggedIn ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                <NotificationBell />
                <span style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{user?.profile?.full_name || "مرحبًا"}</span>
                <button onClick={logout} style={{ fontSize: "0.8125rem", padding: "0.4rem 0.9rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, color: C.inkSoft, background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>خروج</button>
              </div>
            ) : (
              <Link href="/login" style={{ display: "block", textAlign: "center", fontSize: "0.875rem", fontWeight: 700, padding: "0.6rem 1rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, textDecoration: "none" }}>دخول</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
