import { useEffect, useState } from "react";
import { useAdminShell } from "@/pages/admin/AdminShell";
import {
  fetchReferenceDashboard,
  runReferenceReview,
  generateReferenceReport,
  fetchThreeYearRoadmap,
  auditSources,
  type ReferenceDashboard,
} from "@/lib/global-reference-service";

export function GlobalReferenceSection() {
  const { showSuccess, showError } = useAdminShell();
  const [dashboard, setDashboard] = useState<ReferenceDashboard | null>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRunning, setReviewRunning] = useState(false);

  useEffect(() => {
    Promise.all([fetchReferenceDashboard(), fetchThreeYearRoadmap()])
      .then(([d, r]) => {
        setDashboard(d);
        setRoadmap(r);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleReview = async () => {
    setReviewRunning(true);
    try {
      const result = await runReferenceReview();
      showSuccess(`اكتملت المراجعة — ${result.cycle?.issues_found || 0} مشكلة`);
      const d = await fetchReferenceDashboard();
      setDashboard(d);
    } catch {
      showError("فشلت المراجعة");
    } finally {
      setReviewRunning(false);
    }
  };

  const handleReport = async () => {
    try {
      const report = await generateReferenceReport();
      if (report) showSuccess(`التقرير جاهز — اكتمال ${report.completion_pct}%`);
      else showError("تعذر إنشاء التقرير");
    } catch {
      showError("تعذر إنشاء التقرير");
    }
  };

  const handleAuditSources = async () => {
    try {
      const results = await auditSources();
      const broken = results.filter((r: any) => !r.ok).length;
      showSuccess(`فُحص ${results.length} مصدر — ${broken} معطل`);
    } catch {
      showError("فشل فحص المصادر");
    }
  };

  if (loading) return <p>جاري تحميل المنظومة المرجعية...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>المنظومة المرجعية العالمية</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={handleReview} disabled={reviewRunning}>
            {reviewRunning ? "جاري المراجعة..." : "مراجعة دورية"}
          </button>
          <button type="button" onClick={handleAuditSources}>فحص المصادر</button>
          <button type="button" onClick={handleReport}>إنشاء التقرير</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="العناصر" value={dashboard?.counts?.refs ?? 0} />
        <StatCard label="العلاقات" value={dashboard?.counts?.relations ?? 0} />
        <StatCard label="المصادر" value={dashboard?.counts?.sources ?? 0} />
        <StatCard label="نسبة التوثيق" value={`${dashboard?.verification_pct ?? 0}%`} />
        <StatCard label="جودة متوسطة" value={dashboard?.avg_quality_score ?? 0} />
        <StatCard label="يحتاج مراجعة" value={dashboard?.counts?.needs_review ?? 0} color="#dc2626" />
        <StatCard label="غير مكتمل" value={dashboard?.counts?.incomplete ?? 0} color="#f59e0b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        <Panel title="المصادر الموثوقة">
          {(dashboard?.sources || []).map((s) => (
            <div key={s.slug} style={{ fontSize: "0.8125rem", padding: "0.25rem 0", display: "flex", justifyContent: "space-between" }}>
              <span>{s.name}</span>
              <span>{s.trust_level}%</span>
            </div>
          ))}
        </Panel>

        <Panel title="حالة النظام">
          <Row label="قاعدة البيانات" value="متصلة" />
          <Row label="الذكاء الاصطناعي" value="metadata فقط" />
          <Row label="النسخ الاحتياطي" value="Supabase auto" />
          <Row label="Global ID" value="majalis:{kind}:{id}" />
        </Panel>
      </div>

      {roadmap && (
        <section style={{ marginTop: "2rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>خارطة الطريق (3 سنوات)</h3>
          {roadmap.phases?.map((phase: any) => (
            <div key={phase.year} style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
              <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>السنة {phase.year}: {phase.title}</h4>
              <ul style={{ margin: 0, paddingInlineStart: "1.25rem", fontSize: "0.8125rem" }}>
                {phase.items?.map((item: any) => (
                  <li key={item.task} style={{ marginBottom: "0.25rem" }}>
                    {item.task}
                    <span style={{ color: "var(--ink-soft)", marginRight: "0.5rem" }}>({item.benefit})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "1rem" }}>
            {roadmap.principle}
          </p>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
      <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: color || "inherit" }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.75rem" }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", padding: "0.25rem 0" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
