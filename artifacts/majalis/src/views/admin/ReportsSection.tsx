import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminGetDashboardStats, adminGetStats } from "@/lib/supabase";
import { ADHKAR_ITEMS } from "@/lib/adhkar-seed";
import { getPublishedAdhkarItems } from "@/lib/adhkar-admin";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { useAdminShell } from "./AdminShell";
import { AdminSectionToolbar } from "./AdminSectionToolbar";

export function ReportsSection() {
  const { showError } = useAdminShell();
  const [stats, setStats] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminGetStats(), adminGetDashboardStats()])
      .then(([s, d]) => {
        setStats(s);
        setDashboard(d.stats);
      })
      .catch(() => showError("تعذّر تحميل التقارير."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const cards = [
    { label: "المشايخ", value: stats?.sheikhsCount ?? 0 },
    { label: "الدروس", value: stats?.lessonsTotal ?? 0 },
    { label: "الفوائد", value: stats?.fawaidTotal ?? 0 },
    { label: "الأسئلة", value: stats?.qaTotal ?? 0 },
    { label: "الأذكار المنشورة", value: getPublishedAdhkarItems().length, total: ADHKAR_ITEMS.length },
    { label: "المستخدمون", value: dashboard?.totalUsers ?? 0 },
    { label: "فوائد معلّقة", value: stats?.pendingFawaidCount ?? 0, alert: (stats?.pendingFawaidCount ?? 0) > 0 },
    { label: "بلاغات معلّقة", value: dashboard?.pendingReports ?? 0, alert: (dashboard?.pendingReports ?? 0) > 0 },
  ];

  const exportReport = () => {
    const lines = [
      "تقرير المجلس العلمي",
      new Date().toLocaleString("ar-KW"),
      "",
      ...cards.map((c) => `${c.label}: ${c.value}${"total" in c && c.total ? ` / ${c.total}` : ""}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `majalis-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <AdminSectionToolbar
        title="التقارير"
        actions={
          <>
            <Link
              href="/admin/dashboard"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: `1px solid ${C.line}`,
                background: C.panel,
                color: C.emeraldDeep,
                textDecoration: "none",
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}
            >
              لوحة متقدمة
            </Link>
            <button
              type="button"
              onClick={exportReport}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                background: C.emerald,
                color: C.parchment,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}
            >
              تصدير تقرير
            </button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              background: c.alert ? "#FEE2E2" : C.sage,
              border: `1px solid ${c.alert ? "#dc2626" : C.line}`,
              borderRadius: "0.5rem",
              padding: "1.25rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "2rem", fontWeight: 700, color: c.alert ? "#dc2626" : C.emeraldDeep, margin: 0 }}>
              {c.value}
              {"total" in c && c.total ? (
                <span style={{ fontSize: "0.875rem", color: C.inkSoft }}> / {c.total}</span>
              ) : null}
            </p>
            <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: "0.375rem 0 0" }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "1rem" }}>ملخص الجاهزية</h3>
        <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem", lineHeight: 1.8 }}>
          {stats?.lessonsTotal > 0 && stats?.sheikhsCount > 0
            ? "المحتوى الأساسي متوفر. راجع البلاغات والفوائد المعلّقة قبل الإطلاق."
            : "بعض الأقسام الأساسية فارغة — أضف المشايخ والدروس من الأقسام المخصصة."}
        </p>
      </div>
    </div>
  );
}
