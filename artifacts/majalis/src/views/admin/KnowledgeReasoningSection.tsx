import { useCallback, useEffect, useState } from "react";
import { SkeletonCardGrid } from "@/components/ui-common";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  fetchReasoningDashboard,
  runReasoningCycle,
  runReasoningQuery,
  scanReasoningQuality,
  type ReasoningDashboard,
} from "@/lib/reasoning-engine-service";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="ken-stat">
      <p className="ken-stat__label">{label}</p>
      <p className="ken-stat__value">{value}</p>
      {sub && <p className="ken-stat__sub">{sub}</p>}
    </div>
  );
}

export function KnowledgeReasoningSection() {
  const { showSuccess, showError } = useAdminShell();
  const [dashboard, setDashboard] = useState<ReasoningDashboard | null>(null);
  const [topLinked, setTopLinked] = useState<Array<{ ref_id: string; link_count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [testQuery, setTestQuery] = useState("ما فضل صلاة الجماعة؟");
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReasoningDashboard();
      setDashboard(data.dashboard);
      setTopLinked(data.top_linked ?? []);
    } catch {
      showError("تعذر تحميل لوحة الاستدلال المعرفي.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRun = async (autoFix = false) => {
    setRunning(true);
    try {
      await runReasoningCycle({ autoFix, inferenceLimit: 150 });
      showSuccess(autoFix ? "اكتملت الدورة مع الإصلاح التلقائي." : "اكتملت دورة الاستدلال.");
      await load();
    } catch {
      showError("فشلت دورة الاستدلال.");
    } finally {
      setRunning(false);
    }
  };

  const handleQualityScan = async () => {
    try {
      const result = await scanReasoningQuality();
      showSuccess(`فُحص الجودة — ${result.count ?? 0} مشكلة`);
    } catch {
      showError("فشل فحص الجودة.");
    }
  };

  const handleTestQuery = async () => {
    try {
      const result = await runReasoningQuery(testQuery);
      setTestResult(result.answer?.summary ?? "لا نتيجة");
    } catch {
      showError("فشل اختبار الاستدلال.");
    }
  };

  if (loading && !dashboard) return <SkeletonCardGrid count={6} />;

  return (
    <div>
      <div className="krs-header">
        <div>
          <h2 className="krs-title">محرك الاستدلال الإسلامي</h2>
          <p className="krs-subtitle">
            Knowledge Graph + Reasoning — إجابات موثقة من قاعدة المعرفة فقط
          </p>
        </div>
        <div className="krs-btn-group">
          <button type="button" disabled={running} onClick={() => handleRun(false)} className="krs-btn--primary">
            {running ? "جاري التشغيل…" : "دورة الاستدلال"}
          </button>
          <button type="button" disabled={running} onClick={() => handleRun(true)} className="krs-btn">
            دورة + إصلاح
          </button>
          <button type="button" onClick={handleQualityScan} className="krs-btn">
            فحص الجودة
          </button>
        </div>
      </div>

      <div className="krs-stats-grid">
        <StatCard label="الكيانات" value={dashboard?.entities?.refs ?? 0} sub={`${dashboard?.entities?.verified ?? 0} موثّق`} />
        <StatCard label="العلاقات" value={dashboard?.graph?.relations ?? 0} />
        <StatCard label="أذكار" value={dashboard?.entities?.adhkar ?? 0} />
        <StatCard label="أحاديث" value={dashboard?.entities?.hadith ?? 0} />
        <StatCard label="استعلامات 24س" value={dashboard?.queries?.last_24h ?? 0} sub={`${dashboard?.queries?.answered_24h ?? 0} مجاب`} />
        <StatCard label="ثقة متوسطة" value={`${dashboard?.queries?.avg_confidence_7d ?? "—"}%`} />
        <StatCard label="مشاكل مفتوحة" value={dashboard?.quality?.open_issues ?? 0} />
      </div>

      <h3 className="krs-section-h3">أنواع العلاقات</h3>
      <div className="krs-table-wrap">
        <table className="krs-table">
          <thead>
            <tr className="krs-thead-row">
              <th className="krs-th">النوع</th>
              <th className="krs-th">العدد</th>
            </tr>
          </thead>
          <tbody>
            {(dashboard?.graph?.relation_types ?? []).map((row) => (
              <tr key={row.type}>
                <td className="krs-td">{row.type}</td>
                <td className="krs-td">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="krs-section-h3">أكثر الكيانات ارتباطاً</h3>
      <div className="krs-linked-list">
        {topLinked.length === 0 ? (
          <p className="krs-linked-empty">لا توجد علاقات بعد — شغّل دورة الاستدلال</p>
        ) : (
          topLinked.map((item) => (
            <div key={item.ref_id} className="krs-linked-row">
              <span className="krs-linked-id">{item.ref_id}</span>
              <span>{item.link_count} رابط</span>
            </div>
          ))
        )}
      </div>

      <h3 className="krs-section-h3">اختبار الاستدلال</h3>
      <div className="krs-test-row">
        <input
          type="search"
          value={testQuery}
          onChange={(e) => setTestQuery(e.target.value)}
          className="krs-test-input"
        />
        <button type="button" onClick={handleTestQuery} className="krs-test-btn">
          اختبار
        </button>
      </div>
      {testResult && (
        <div className="krs-test-result">{testResult}</div>
      )}
    </div>
  );
}
