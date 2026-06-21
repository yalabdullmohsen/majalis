import { useState } from "react";
import { Link } from "wouter";
import { C } from "@/lib/theme";
import { useAuth } from "@/components/AuthProvider";
import { Loading } from "@/components/ui-common";
import { StatsSection } from "@/pages/admin/StatsSection";
import { SheikhsSection } from "@/pages/admin/SheikhsSection";
import { LessonsSection } from "@/pages/admin/LessonsSection";
import { LibrarySection } from "@/pages/admin/LibrarySection";
import { MiraclesSection } from "@/pages/admin/MiraclesSection";
import { FawaidSection } from "@/pages/admin/FawaidSection";
import { UsersSection } from "@/pages/admin/UsersSection";

type Section = "stats" | "sheikhs" | "lessons" | "library" | "miracles" | "fawaid" | "users";

const NAV: { key: Section; label: string; icon: string }[] = [
  { key: "stats",    label: "نظرة عامة",       icon: "📊" },
  { key: "sheikhs",  label: "المشايخ",           icon: "👤" },
  { key: "lessons",  label: "الدروس",            icon: "📚" },
  { key: "library",  label: "المكتبة",           icon: "🏛️" },
  { key: "miracles", label: "الإعجاز العلمي",    icon: "🌙" },
  { key: "fawaid",   label: "الفوائد",           icon: "✨" },
  { key: "users",    label: "المستخدمون",         icon: "🧑‍🤝‍🧑" },
];

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth() as any;
  const [section, setSection] = useState<Section>("stats");

  if (authLoading) return <Loading />;
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: "24rem", margin: "5rem auto", padding: "2rem", textAlign: "center", background: C.panel, borderRadius: "0.5rem", border: `1px solid ${C.line}` }}>
        <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔒</p>
        <p style={{ color: C.inkSoft, marginBottom: "1rem", fontSize: "0.9375rem" }}>هذه الصفحة للمشرفين فقط.</p>
        <Link href="/" style={{ color: C.emeraldDeep, textDecoration: "underline", fontSize: "0.875rem" }}>العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 60px)", background: C.parchment }}>
      <aside style={{
        width: "210px", flexShrink: 0,
        borderLeft: `1px solid ${C.line}`,
        background: C.parchmentDeep,
        padding: "1.5rem 0",
      }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.inkSoft, padding: "0 1rem", marginBottom: "0.75rem", letterSpacing: "0.06em" }}>
          لوحة التحكم
        </p>
        <nav>
          {NAV.map(n => (
            <button
              key={n.key}
              onClick={() => setSection(n.key)}
              style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                width: "100%", padding: "0.625rem 1rem",
                border: "none", borderRight: `3px solid ${section === n.key ? C.emerald : "transparent"}`,
                cursor: "pointer", textAlign: "right",
                background: section === n.key ? C.sage : "transparent",
                color: section === n.key ? C.emeraldDeep : C.inkSoft,
                fontFamily: "inherit", fontSize: "0.875rem",
                fontWeight: section === n.key ? 700 : 400,
                transition: "all 0.12s",
              }}
            >
              <span style={{ fontSize: "1rem" }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: "2rem 2rem 3rem", overflowX: "auto", minWidth: 0 }}>
        {section === "stats"    && <StatsSection />}
        {section === "sheikhs"  && <SheikhsSection />}
        {section === "lessons"  && <LessonsSection />}
        {section === "library"  && <LibrarySection />}
        {section === "miracles" && <MiraclesSection />}
        {section === "fawaid"   && <FawaidSection />}
        {section === "users"    && <UsersSection />}
      </main>
    </div>
  );
}
