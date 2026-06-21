import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import { C } from "@/lib/theme";

const TABS = [
  { href: "/", label: "الرئيسية" },
  { href: "/lessons", label: "الدروس" },
  { href: "/sheikhs", label: "المشايخ" },
  { href: "/library", label: "المكتبة" },
  { href: "/miracles", label: "الإعجاز العلمي" },
  { href: "/fawaid", label: "الفوائد" },
];

export default function NavBar() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth() as any;
  const [location] = useLocation();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: C.parchment, borderColor: C.line }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <Link href="/" style={{ fontSize: "1.25rem", fontWeight: 700, flexShrink: 0, color: C.emeraldDeep, fontFamily: "Amiri, serif", textDecoration: "none" }}>
          مجالس
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem", overflowX: "auto" }}>
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              style={{
                fontSize: "0.875rem",
                padding: "0.375rem 0.75rem",
                borderRadius: "0.375rem",
                whiteSpace: "nowrap",
                textDecoration: "none",
                color: location === t.href ? C.emeraldDeep : C.inkSoft,
                background: location === t.href ? C.sage : "transparent",
                fontWeight: location === t.href ? 700 : 400,
              }}
            >
              {t.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" style={{ fontSize: "0.875rem", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", whiteSpace: "nowrap", textDecoration: "none", color: C.brassDeep }}>
              لوحة التحكم
            </Link>
          )}
        </nav>

        <div style={{ flexShrink: 0 }}>
          {isLoggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>
                {user?.profile?.full_name || "مرحبًا"}
              </span>
              <button
                onClick={logout}
                style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, color: C.inkSoft, background: "transparent", cursor: "pointer", fontFamily: "inherit" }}
              >
                خروج
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.375rem 1rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, textDecoration: "none" }}
            >
              دخول
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
