import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import NotificationBell from "./NotificationBell";
import { C } from "@/lib/theme";

const HIDDEN_NAV_HREFS = new Set(["/transcribe", "/library"]);

const NEW_NAV_ITEMS = [
  { href: "/cards", label: "البطاقات" },
  { href: "/condolences", label: "قوالب العزاء" },
];

const TABS = [
  { href: "/", label: "الرئيسية" },
  { href: "/announcements", label: "إعلانات الدروس" },
  { href: "/calendar", label: "التقويم" },
  { href: "/courses", label: "الدورات" },
  { href: "/lessons", label: "الدروس" },
  { href: "/kuwait-lessons", label: "دروس الكويت" },
  { href: "/sheikhs", label: "المشايخ" },
  { href: "/adhkar", label: "الأذكار" },
  { href: "/miracles", label: "الإعجاز العلمي" },
  { href: "/fawaid", label: "الفوائد" },
  { href: "/qa", label: "الأسئلة والأجوبة" },
  { href: "/quiz", label: "المسابقات" },
  { href: "/transcribe", label: "تفريغ" },
  { href: "/library", label: "المكتبة" },
  ...NEW_NAV_ITEMS,
  { href: "/assistant", label: "المساعد الذكي" },
  { href: "/about", label: "عن المنصة" },
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
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate(`/search/${encodeURIComponent(q)}`);
    setTerm("");
    onSubmitDone?.();
  };
  return (
    <form onSubmit={submit} style={{ display: "flex", alignItems: "center", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.15rem 0.15rem 0.15rem 0.5rem" }}>
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="بحث..."
        style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.8125rem", fontFamily: "inherit", padding: "0.3rem 0.5rem", color: C.ink, width: "8.5rem" }}
      />
      <button type="submit" aria-label="بحث" style={{ border: "none", background: C.emerald, color: C.parchment, borderRadius: "0.375rem", cursor: "pointer", padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700 }}>
        بحث
      </button>
    </form>
  );
}

function MobileQuickNav({ location }: { location: string }) {
  return (
    <nav className="mobile-quick-nav" aria-label="أدوات سريعة">
      {NEW_NAV_ITEMS.map((item) => {
        const active = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-quick-nav-item${active ? " active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
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
            src="/logo-icon.png"
            alt="المجلس العلمي"
            className="navbar-logo"
          />
          <span className="site-brand-name">المجلس العلمي</span>
        </Link>

        {!isMobile && (
          <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem", overflowX: "auto", flex: 1, justifyContent: "center" }}>
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} style={tabStyle(location === t.href)}>{t.label}</Link>
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

      {isMobile && !open && <MobileQuickNav location={location} />}

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
