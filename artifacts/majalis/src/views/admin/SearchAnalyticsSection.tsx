import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAdminShell } from "@/views/admin/AdminShell";
import { fetchSearchAnalytics, generateIntelligenceReport, type SearchAnalytics } from "@/lib/scholarly-intelligence-service";

export function SearchAnalyticsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchSearchAnalytics(30)
      .then(setAnalytics)
      .catch(() => showError("تعذّر تحميل تحليلات البحث."))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const report = await generateIntelligenceReport();
      if (report) {
        showSuccess(`تم إنشاء التقرير، اكتمال المحرك: ${report.completion_pct}%`);
      } else {
        showError("تعذر إنشاء التقرير");
      }
    } catch {
      showError("تعذر إنشاء التقرير");
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) return <p>جاري تحميل تحليلات البحث...</p>;

  return (
    <div>
      <div className="sas-header">
        <h2>لوحة تحليل البحث</h2>
        <button type="button" onClick={handleGenerateReport} disabled={reportLoading}>
          {reportLoading ? "جاري الإنشاء..." : "إنشاء التقرير"}
        </button>
      </div>

      <div className="sas-stats-grid">
        <StatCard label="إجمالي عمليات البحث" value={analytics?.total_searches ?? 0} />
        <StatCard label="متوسط زمن الاستجابة" value={`${analytics?.avg_response_ms ?? 0} ms`} />
        <StatCard label="معدل النقر" value={`${analytics?.click_through_rate ?? 0}%`} />
        <StatCard label="جودة النتائج" value={`${analytics?.quality_score ?? 0}/100`} />
      </div>

      <div className="sas-panels-grid">
        <AnalyticsList title="أكثر الكلمات بحثًا" items={analytics?.top_queries?.map((q) => `${q.query} (${q.count})`) || []} />
        <AnalyticsList title="أكثر الموضوعات زيارة" items={analytics?.top_topics?.map((t) => `${t.title} (${t.count})`) || []} />
        <AnalyticsList title="استعلامات بلا نتائج" items={analytics?.zero_result_queries?.map((q) => `${q.query} (${q.count})`) || []} />
        <AnalyticsList title="كلمات تحتاج إثراء" items={analytics?.content_gaps?.map((q) => q.query) || []} />
      </div>

      <p className="sas-footer-note">
        صفحات الاستكشاف:{" "}
        <Link href="/search">البحث</Link>
        {" · "}
        <Link href="/topics/tahara">الموضوعات</Link>
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="sas-stat">
      <div className="sas-stat__label">{label}</div>
      <div className="sas-stat__value">{value}</div>
    </div>
  );
}

function AnalyticsList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="sas-list">
      <h3 className="sas-list__title">{title}</h3>
      {items.length === 0 ? (
        <p className="sas-list__empty">لا توجد بيانات بعد</p>
      ) : (
        <ul className="sas-list__ul">
          {items.slice(0, 10).map((item, i) => (
            <li key={i} className="sas-list__li">{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
