import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAdminShell } from "@/views/admin/AdminShell";
import { fetchAdminLearningStats, generateLearningReport } from "@/lib/digital-learning-service";

export function DigitalLearningSection() {
  const { showSuccess, showError } = useAdminShell();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchAdminLearningStats()
      .then(setStats)
      .catch(() => showError("تعذّر تحميل إحصائيات التعليم الرقمي."))
      .finally(() => setLoading(false));
  }, []);

  const handleReport = async () => {
    setReportLoading(true);
    try {
      const report = await generateLearningReport();
      if (report) showSuccess(`التقرير جاهز — اكتمال النظام: ${report.completion_pct}%`);
      else showError("تعذر إنشاء التقرير");
    } catch {
      showError("تعذر إنشاء التقرير");
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) return <p>جاري التحميل...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0 }}>منظومة التعليم الرقمي</h2>
        <button type="button" onClick={handleReport} disabled={reportLoading}>
          {reportLoading ? "جاري الإنشاء..." : "إنشاء التقرير"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="المسارات" value={stats?.paths_count ?? 15} />
        <StatCard label="الوحدات" value={stats?.modules_count ?? 90} />
        <StatCard label="الاختبارات" value={stats?.quizzes_count ?? 15} />
        <StatCard label="المستخدمون" value={stats?.users_count ?? 0} />
        <StatCard label="التسجيلات" value={stats?.enrollments_count ?? 0} />
        <StatCard label="نسبة الإكمال" value={`${stats?.completion_rate ?? 0}%`} />
        <StatCard label="الشهادات" value={stats?.certificates_count ?? 0} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
        <InfoPanel title="أكثر الدروس مشاهدة" items={stats?.top_lessons?.length ? stats.top_lessons : ["لا توجد بيانات بعد"]} />
        <InfoPanel title="أصعب الاختبارات" items={stats?.hardest_quizzes?.length ? stats.hardest_quizzes : ["لا توجد بيانات بعد"]} />
        <InfoPanel title="المحتوى الأكثر تفاعلاً" items={stats?.engaging_content?.length ? stats.engaging_content : ["لا توجد بيانات بعد"]} />
        <InfoPanel title="يحتاج تحديثًا" items={stats?.stale_content?.length ? stats.stale_content : ["لا توجد بيانات بعد"]} />
      </div>

      <p style={{ marginTop: "2rem", fontSize: "0.875rem" }}>
        <Link href="/learning/paths">المسارات العلمية</Link>
        {" · "}
        <Link href="/my-learning">لوحة المتعلم</Link>
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
      <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function InfoPanel({ title, items }: { title: string; items: any[] }) {
  const labelOf = (item: any) => {
    if (item == null) return "—";
    if (typeof item === "object") return String(item.title ?? item.name ?? item.label ?? item.query ?? "عنصر");
    return String(item);
  };
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.75rem" }}>{title}</h3>
      <ul style={{ margin: 0, paddingInlineStart: "1.25rem", fontSize: "0.8125rem" }}>
        {items.map((item, idx) => (
          <li key={idx}>{labelOf(item)}</li>
        ))}
      </ul>
    </div>
  );
}
