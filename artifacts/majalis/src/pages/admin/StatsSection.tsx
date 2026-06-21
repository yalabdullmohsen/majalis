import { useEffect, useState } from "react";
import { adminGetStats } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";

export function StatsSection() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetStats().then(s => { setStats(s); setLoading(false); });
  }, []);

  if (loading) return <Loading />;

  const cards = [
    { label: "المشايخ", value: stats.sheikhsCount, color: C.emerald, bg: C.sage },
    { label: "إجمالي الدروس", value: stats.lessonsTotal, color: C.emeraldDeep, bg: "#E8F5E9" },
    { label: "الدروس المعتمدة", value: stats.lessonsApproved, color: C.emerald, bg: C.sage },
    { label: "الدروس المعلّقة", value: stats.lessonsPending, color: C.brass, bg: "#FEF3C7" },
    { label: "مواد المكتبة", value: stats.libraryCount, color: C.emeraldDeep, bg: C.parchmentDeep },
    { label: "مقالات الإعجاز", value: stats.miraclesCount, color: C.emeraldDeep, bg: C.parchmentDeep },
    { label: "فوائد بانتظار الموافقة", value: stats.pendingFawaidCount, color: stats.pendingFawaidCount > 0 ? "#dc2626" : C.inkSoft, bg: stats.pendingFawaidCount > 0 ? "#FEE2E2" : C.parchmentDeep },
  ];

  return (
    <div>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, marginBottom: "1.5rem", fontFamily: "Amiri, serif" }}>
        نظرة عامة على المحتوى
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: c.color, margin: 0, lineHeight: 1.2 }}>{c.value}</p>
            <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: "0.375rem 0 0" }}>{c.label}</p>
          </div>
        ))}
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1.25rem" }}>
        <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem", lineHeight: "1.8" }}>
          استخدم القائمة الجانبية للتنقل بين أقسام الإدارة. يمكنك إضافة المشايخ والدروس والمكتبة والإعجاز العلمي وإدارة الفوائد المقدّمة من المستخدمين.
        </p>
      </div>
    </div>
  );
}
