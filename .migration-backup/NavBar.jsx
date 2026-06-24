"use client";
// =====================================================================
//  components/NavBar.jsx — شريط التنقل العلوي
// =====================================================================

import Link from "next/link";
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
  const { isLoggedIn, isAdmin, user, logout } = useAuth();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: C.parchment, borderColor: C.line }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl font-bold shrink-0" style={{ color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>
          مجالس العلم
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="text-sm px-3 py-1.5 rounded whitespace-nowrap"
              style={{ color: C.inkSoft }}
            >
              {t.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="text-sm px-3 py-1.5 rounded whitespace-nowrap" style={{ color: C.brassDeep }}>
              لوحة التحكم
            </Link>
          )}
        </nav>

        <div className="shrink-0">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="text-xs hidden sm:inline" style={{ color: C.inkSoft }}>
                {user?.profile?.full_name || "مرحبًا"}
              </span>
              <button
                onClick={logout}
                className="text-xs px-3 py-1.5 rounded-md border"
                style={{ borderColor: C.line, color: C.inkSoft }}
              >
                خروج
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold px-4 py-1.5 rounded-md"
              style={{ background: C.emerald, color: C.parchment }}
            >
              دخول
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
