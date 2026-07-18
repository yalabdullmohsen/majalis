import { useEffect, useState } from "react";
import { useAdminShell } from "@/views/admin/AdminShell";
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
      .catch(() => showError("تعذّر تحميل المرجع العالمي."))
      .finally(() => setLoading(false));
  }, []);

  const handleReview = async () => {
    setReviewRunning(true);
    try {
      const result = await runReferenceReview();
      showSuccess(`اكتملت المراجعة، ${result.cycle?.issues_found || 0} مشكلة`);
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
      if (report) showSuccess(`التقرير جاهز، اكتمال ${report.completion_pct}%`);
      else showError("تعذر إنشاء التقرير");
    } catch {
      showError("تعذر إنشاء التقرير");
    }
  };

  const handleAuditSources = async () => {
    try {
      const results = await auditSources();
      const broken = results.filter((r: any) => !r.ok).length;
      showSuccess(`فُحص ${results.length} مصدر، ${broken} معطل`);
    } catch {
      showError("فشل فحص المصادر");
    }
  };

  if (loading) return <p>جاري تحميل المنظومة المرجعية...</p>;

  return (
    <div>
      <div className="grs-header">
        <h2>المنظومة المرجعية العالمية</h2>
        <div className="grs-btn-group">
          <button type="button" onClick={handleReview} disabled={reviewRunning}>
            {reviewRunning ? "جاري المراجعة..." : "مراجعة دورية"}
          </button>
          <button type="button" onClick={handleAuditSources}>فحص المصادر</button>
          <button type="button" onClick={handleReport}>إنشاء التقرير</button>
        </div>
      </div>

      <div className="grs-stats-grid">
        <StatCard label="العناصر" value={dashboard?.counts?.refs ?? 0} />
        <StatCard label="العلاقات" value={dashboard?.counts?.relations ?? 0} />
        <StatCard label="المصادر" value={dashboard?.counts?.sources ?? 0} />
        <StatCard label="نسبة التوثيق" value={`${dashboard?.verification_pct ?? 0}%`} />
        <StatCard label="جودة متوسطة" value={dashboard?.avg_quality_score ?? 0} />
        <StatCard label="يحتاج مراجعة" value={dashboard?.counts?.needs_review ?? 0} color="#dc2626" />
        <StatCard label="غير مكتمل" value={dashboard?.counts?.incomplete ?? 0} color="#173D35" />
      </div>

      <div className="grs-panels-grid">
        <Panel title="المصادر الموثوقة">
          {(dashboard?.sources || []).map((s) => (
            <div key={s.slug} className="grs-source-row">
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
        <section className="grs-roadmap">
          <h3 className="grs-roadmap-h3">خارطة الطريق (3 سنوات)</h3>
          {roadmap.phases?.map((phase: any) => (
            <div key={phase.year} className="grs-phase">
              <h4 className="grs-phase-h4">السنة {phase.year}: {phase.title}</h4>
              <ul className="grs-phase-ul">
                {phase.items?.map((item: any) => (
                  <li key={item.task} className="grs-phase-li">
                    {item.task}
                    <span className="grs-benefit">({item.benefit})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="grs-roadmap-note">{roadmap.principle}</p>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="grs-stat" style={{ "--grs-val-color": color } as React.CSSProperties}>
      <div className="grs-stat__label">{label}</div>
      <div className="grs-stat__value">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grs-panel">
      <h3 className="grs-panel-h3">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grs-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
