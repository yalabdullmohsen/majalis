import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
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
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</p>
      {sub && <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: C.inkSoft }}>{sub}</p>}
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

  if (loading && !dashboard) return <Loading />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, color: C.emeraldDeep }}>محرك الاستدلال الإسلامي</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: C.inkSoft }}>
            Knowledge Graph + Reasoning — إجابات موثقة من قاعدة المعرفة فقط
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={running}
            onClick={() => handleRun(false)}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: C.emerald, color: "#fff", cursor: "pointer" }}
          >
            {running ? "جاري التشغيل…" : "دورة الاستدلال"}
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => handleRun(true)}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer" }}
          >
            دورة + إصلاح
          </button>
          <button type="button" onClick={handleQualityScan} style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer" }}>
            فحص الجودة
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <StatCard label="الكيانات" value={dashboard?.entities?.refs ?? 0} sub={`${dashboard?.entities?.verified ?? 0} موثّق`} />
        <StatCard label="العلاقات" value={dashboard?.graph?.relations ?? 0} />
        <StatCard label="أذكار" value={dashboard?.entities?.adhkar ?? 0} />
        <StatCard label="أحاديث" value={dashboard?.entities?.hadith ?? 0} />
        <StatCard label="استعلامات 24س" value={dashboard?.queries?.last_24h ?? 0} sub={`${dashboard?.queries?.answered_24h ?? 0} مجاب`} />
        <StatCard label="ثقة متوسطة" value={`${dashboard?.queries?.avg_confidence_7d ?? "—"}%`} />
        <StatCard label="مشاكل مفتوحة" value={dashboard?.quality?.open_issues ?? 0} />
      </div>

      <h3 style={{ color: C.emeraldDeep }}>أنواع العلاقات</h3>
      <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ textAlign: "right", background: C.panel }}>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>النوع</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>العدد</th>
            </tr>
          </thead>
          <tbody>
            {(dashboard?.graph?.relation_types ?? []).map((row) => (
              <tr key={row.type}>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{row.type}</td>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ color: C.emeraldDeep }}>أكثر الكيانات ارتباطاً</h3>
      <div style={{ marginBottom: "1.5rem", fontSize: "0.875rem" }}>
        {topLinked.length === 0 ? (
          <p style={{ color: C.inkSoft }}>لا توجد علاقات بعد — شغّل دورة الاستدلال</p>
        ) : (
          topLinked.map((item) => (
            <div key={item.ref_id} style={{ padding: "0.25rem 0", display: "flex", justifyContent: "space-between" }}>
              <span style={{ direction: "ltr", fontSize: "0.75rem" }}>{item.ref_id}</span>
              <span>{item.link_count} رابط</span>
            </div>
          ))
        )}
      </div>

      <h3 style={{ color: C.emeraldDeep }}>اختبار الاستدلال</h3>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          type="search"
          value={testQuery}
          onChange={(e) => setTestQuery(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "0.5rem", borderRadius: "0.375rem", border: `1px solid ${C.line}` }}
        />
        <button type="button" onClick={handleTestQuery} style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: C.emerald, color: "#fff" }}>
          اختبار
        </button>
      </div>
      {testResult && (
        <div style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, fontSize: "0.875rem", whiteSpace: "pre-wrap" }}>
          {testResult}
        </div>
      )}
    </div>
  );
}
