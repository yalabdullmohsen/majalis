import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminGetDashboardStats, adminGetStats } from "@/lib/supabase";
import { ADHKAR_ITEMS } from "@/lib/adhkar-seed";
import { getPublishedAdhkarItems } from "@/lib/adhkar-admin";
import { SkeletonCardGrid } from "@/components/ui-common";
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

  if (loading) return <SkeletonCardGrid count={6} />;

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
            <Link href="/admin/dashboard" className="rpt-link-btn">
              لوحة متقدمة
            </Link>
            <button type="button" onClick={exportReport} className="rpt-export-btn">
              تصدير تقرير
            </button>
          </>
        }
      />

      <div className="rpt-cards-grid">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rpt-stat-card"
            style={{ "--rpt-bg": c.alert ? "#FEE2E2" : "var(--majalis-sage)", "--rpt-border": c.alert ? "#dc2626" : "var(--majalis-line)", "--rpt-value": c.alert ? "#dc2626" : "var(--majalis-emerald-deep)" } as React.CSSProperties}
          >
            <p className="rpt-stat-value">
              {c.value}
              {"total" in c && c.total ? (
                <span className="rpt-stat-total"> / {c.total}</span>
              ) : null}
            </p>
            <p className="rpt-stat-label">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rpt-summary-box">
        <h3 className="rpt-summary-h3">ملخص الجاهزية</h3>
        <p className="rpt-summary-p">
          {stats?.lessonsTotal > 0 && stats?.sheikhsCount > 0
            ? "المحتوى الأساسي متوفر. راجع البلاغات والفوائد المعلّقة قبل الإطلاق."
            : "بعض الأقسام الأساسية فارغة، أضف المشايخ والدروس من الأقسام المخصصة."}
        </p>
      </div>
    </div>
  );
}
