import { useState } from "react";
import { Link } from "wouter";
import { C } from "@/lib/theme";
import { StatsSection } from "@/pages/admin/StatsSection";
import { SheikhsSection } from "@/pages/admin/SheikhsSection";
import { LessonsSection } from "@/pages/admin/LessonsSection";
import { LibrarySection } from "@/pages/admin/LibrarySection";
import { MiraclesSection } from "@/pages/admin/MiraclesSection";
import { FawaidSection } from "@/pages/admin/FawaidSection";
import { QaSection } from "@/pages/admin/QaSection";
import { QuizSection } from "@/pages/admin/QuizSection";
import { UsersSection } from "@/pages/admin/UsersSection";

type Section = "stats" | "sheikhs" | "lessons" | "library" | "miracles" | "fawaid" | "qa" | "quiz" | "users";

const NAV: { key: Section; label: string; icon: string }[] = [
  { key: "stats",    label: "نظرة عامة",       icon: "📊" },
  { key: "sheikhs",  label: "المشايخ",           icon: "👤" },
  { key: "lessons",  label: "الدروس",            icon: "📚" },
  { key: "library",  label: "المكتبة",           icon: "🏛️" },
  { key: "miracles", label: "الإعجاز العلمي",    icon: "🌙" },
  { key: "fawaid",   label: "الفوائد",           icon: "✨" },
  { key: "qa",       label: "الأسئلة والأجوبة",  icon: "❓" },
  { key: "quiz",     label: "المسابقات",          icon: "🏆" },
  { key: "users",    label: "المستخدمون",         icon: "🧑‍🤝‍🧑" },
];

export default function AdminPage() {
  const [section, setSection] = useState<Section>("stats");

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 60px)", background: C.parchment }}>
      <aside style={{
        width: "210px", flexShrink: 0,
        borderLeft: `1px solid ${C.line}`,
        background: C.parchmentDeep,
        padding: "1.5rem 0",
      }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.inkSoft, padding: "0 1rem", marginBottom: "0.75rem", letterSpacing: "0.06em" }}>
          لوحة تحكم مجالس العلم
        </p>
        <Link
          href="/admin/dashboard"
          style={{
            display: "flex", alignItems: "center", gap: "0.625rem",
            padding: "0.625rem 1rem", marginBottom: "0.5rem",
            textDecoration: "none", fontSize: "0.8125rem",
            color: C.brassDeep, fontWeight: 600,
          }}
        >
          <span>📈</span> لوحة متقدمة
        </Link>
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
        {section === "qa"       && <QaSection />}
        {section === "quiz"     && <QuizSection />}
        {section === "users"    && <UsersSection />}
      </main>
    </div>
  );
}
