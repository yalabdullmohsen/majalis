import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAdminShell } from "@/pages/admin/AdminShell";
import { fetchSearchAnalytics, generateIntelligenceReport, type SearchAnalytics } from "@/lib/scholarly-intelligence-service";

export function SearchAnalyticsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchSearchAnalytics(30)
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const report = await generateIntelligenceReport();
      if (report) {
        showSuccess(`تم إنشاء التقرير — اكتمال المحرك: ${report.completion_pct}%`);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0 }}>لوحة تحليل البحث</h2>
        <button type="button" onClick={handleGenerateReport} disabled={reportLoading}>
          {reportLoading ? "جاري الإنشاء..." : "إنشاء التقرير"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="إجمالي عمليات البحث" value={analytics?.total_searches ?? 0} />
        <StatCard label="متوسط زمن الاستجابة" value={`${analytics?.avg_response_ms ?? 0} ms`} />
        <StatCard label="معدل النقر" value={`${analytics?.click_through_rate ?? 0}%`} />
        <StatCard label="جودة النتائج" value={`${analytics?.quality_score ?? 0}/100`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <AnalyticsList title="أكثر الكلمات بحثًا" items={analytics?.top_queries?.map((q) => `${q.query} (${q.count})`) || []} />
        <AnalyticsList title="أكثر الموضوعات زيارة" items={analytics?.top_topics?.map((t) => `${t.title} (${t.count})`) || []} />
        <AnalyticsList title="استعلامات بلا نتائج" items={analytics?.zero_result_queries?.map((q) => `${q.query} (${q.count})`) || []} />
        <AnalyticsList title="كلمات تحتاج إثراء" items={analytics?.content_gaps?.map((q) => q.query) || []} />
      </div>

      <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "var(--ink-soft)" }}>
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
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line, #e5e7eb)", background: "var(--panel, #fff)" }}>
      <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function AnalyticsList({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line, #e5e7eb)" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.75rem" }}>{title}</h3>
      {items.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>لا توجد بيانات بعد</p>
      ) : (
        <ul style={{ margin: 0, paddingInlineStart: "1.25rem", fontSize: "0.8125rem" }}>
          {items.slice(0, 10).map((item) => (
            <li key={item} style={{ marginBottom: "0.25rem" }}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
