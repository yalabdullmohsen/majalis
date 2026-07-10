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
      if (report) showSuccess(`التقرير جاهز، اكتمال النظام: ${report.completion_pct}%`);
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
      <div className="dls-header">
        <h2>منظومة التعليم الرقمي</h2>
        <button type="button" onClick={handleReport} disabled={reportLoading}>
          {reportLoading ? "جاري الإنشاء..." : "إنشاء التقرير"}
        </button>
      </div>

      <div className="dls-stats-grid">
        <StatCard label="المسارات" value={stats?.paths_count ?? 15} />
        <StatCard label="الوحدات" value={stats?.modules_count ?? 90} />
        <StatCard label="الاختبارات" value={stats?.quizzes_count ?? 15} />
        <StatCard label="المستخدمون" value={stats?.users_count ?? 0} />
        <StatCard label="التسجيلات" value={stats?.enrollments_count ?? 0} />
        <StatCard label="نسبة الإكمال" value={`${stats?.completion_rate ?? 0}%`} />
        <StatCard label="الشهادات" value={stats?.certificates_count ?? 0} />
      </div>

      <div className="dls-panels-grid">
        <InfoPanel title="أكثر الدروس مشاهدة" items={stats?.top_lessons?.length ? stats.top_lessons : ["لا توجد بيانات بعد"]} />
        <InfoPanel title="أصعب الاختبارات" items={stats?.hardest_quizzes?.length ? stats.hardest_quizzes : ["لا توجد بيانات بعد"]} />
        <InfoPanel title="المحتوى الأكثر تفاعلاً" items={stats?.engaging_content?.length ? stats.engaging_content : ["لا توجد بيانات بعد"]} />
        <InfoPanel title="يحتاج تحديثًا" items={stats?.stale_content?.length ? stats.stale_content : ["لا توجد بيانات بعد"]} />
      </div>

      <p className="dls-links">
        <Link href="/learning/paths">المسارات العلمية</Link>
        {" · "}
        <Link href="/my-learning">لوحة المتعلم</Link>
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="dls-stat">
      <div className="dls-stat-label">{label}</div>
      <div className="dls-stat-value">{value}</div>
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
    <div className="dls-panel">
      <h3>{title}</h3>
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>{labelOf(item)}</li>
        ))}
      </ul>
    </div>
  );
}
