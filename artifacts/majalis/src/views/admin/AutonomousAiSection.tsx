import { useEffect, useState } from "react";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  fetchAutonomousDashboard,
  runAutonomousPipeline,
  runSecurityAudit,
  generateAutonomousReport,
  fetchPipelineEvents,
  PIPELINE_STAGE_LABELS,
  type AutonomousObservability,
} from "@/lib/autonomous-ai-service";

export function AutonomousAiSection() {
  const { showSuccess, showError } = useAdminShell();
  const [obs, setObs] = useState<AutonomousObservability | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [security, setSecurity] = useState<any>(null);

  const refresh = () => {
    setLoading(true);
    Promise.all([fetchAutonomousDashboard(), fetchPipelineEvents(20)])
      .then(([dashboard, evts]) => {
        setObs(dashboard);
        setEvents(evts);
      })
      .catch(() => showError("تعذّر تحميل بيانات المنظومة الذاتية."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await runAutonomousPipeline({ mode: "full", checkLinks: true });
      showSuccess(`اكتملت الدورة — ${result.itemsPublished || 0} عنصر منشور`);
      refresh();
    } catch {
      showError("فشل تشغيل المنظومة");
    } finally {
      setRunning(false);
    }
  };

  const handleSecurity = async () => {
    try {
      const audit = await runSecurityAudit();
      setSecurity(audit);
      showSuccess(`تدقيق الأمان: ${audit.score}/100`);
    } catch {
      showError("فشل تدقيق الأمان");
    }
  };

  const handleReport = async () => {
    try {
      const report = await generateAutonomousReport();
      if (report) showSuccess(`التقرير جاهز — أتمتة ${report.automation_pct}%`);
      else showError("تعذر إنشاء التقرير");
    } catch {
      showError("تعذر إنشاء التقرير");
    }
  };

  if (loading) return <p>جاري تحميل لوحة المراقبة الذاتية...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>المنظومة الذاتية للذكاء الاصطناعي</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={handleRun} disabled={running}>
            {running ? "جاري التشغيل..." : "تشغيل الدورة الكاملة"}
          </button>
          <button type="button" onClick={handleSecurity}>تدقيق الأمان</button>
          <button type="button" onClick={handleReport}>إنشاء التقرير</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="عناصر جديدة" value={obs?.metrics?.itemsNew ?? 0} />
        <StatCard label="مرفوضة" value={obs?.metrics?.itemsRejected ?? 0} color="#dc2626" />
        <StatCard label="معدل النجاح" value={`${obs?.metrics?.successRate ?? 0}%`} />
        <StatCard label="محتوى يومي" value={obs?.metrics?.dailyContentCount ?? 0} />
        <StatCard label="إعادة محاولة" value={obs?.metrics?.retryPending ?? 0} />
        <StatCard label="مراحل Pipeline" value={Object.keys(PIPELINE_STAGE_LABELS).length} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <Panel title="حالة Cron Jobs">
          {(obs?.cronJobs || []).map((job) => (
            <div key={job.name} style={{ fontSize: "0.8125rem", padding: "0.25rem 0", display: "flex", justifyContent: "space-between" }}>
              <span>{job.name}</span>
              <span style={{ color: job.status === "healthy" ? "var(--emerald-deep)" : "#dc2626" }}>{job.status}</span>
            </div>
          ))}
        </Panel>

        <Panel title="حالة الذكاء الاصطناعي">
          <Row label="الحالة" value={obs?.ai?.status || "—"} />
          <Row label="OpenAI" value={obs?.ai?.openai ? "✓" : "—"} />
          <Row label="Anthropic" value={obs?.ai?.anthropic ? "✓" : "—"} />
          <Row label="Metadata فقط" value={obs?.ai?.metadataOnly ? "✓ لا يُنشئ نصوصًا شرعية" : "—"} />
          <Row label="قاعدة البيانات" value={obs?.database?.status || "—"} />
        </Panel>

        <Panel title="أسباب الرفض">
          {obs?.rejectionReasons && Object.keys(obs.rejectionReasons).length > 0 ? (
            Object.entries(obs.rejectionReasons).map(([reason, count]) => (
              <div key={reason} style={{ fontSize: "0.8125rem", padding: "0.25rem 0" }}>{reason}: {count}</div>
            ))
          ) : (
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>لا توجد رفضات حديثة</p>
          )}
        </Panel>

        <Panel title="تدقيق الأمان">
          {security ? (
            <>
              <Row label="الدرجة" value={`${security.score}/100`} />
              <Row label="حرج" value={security.criticalCount} />
              <Row label="تحذيرات" value={security.warningCount} />
            </>
          ) : (
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>اضغط «تدقيق الأمان» للفحص</p>
          )}
        </Panel>
      </div>

      <Panel title="آخر عمليات Pipeline">
        {events.length > 0 ? (
          <div style={{ maxHeight: 300, overflow: "auto" }}>
            {events.map((ev) => (
              <div key={ev.id || ev.created_at + ev.stage} style={{ fontSize: "0.75rem", padding: "0.375rem 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ color: ev.success ? "var(--emerald-deep)" : "#dc2626" }}>{ev.success ? "✓" : "✗"}</span>
                {" "}
                <strong>{PIPELINE_STAGE_LABELS[ev.stage] || ev.stage}</strong>
                {" — "}
                {ev.message}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>لا توجد عمليات مسجلة بعد — شغّل الدورة الكاملة</p>
        )}
      </Panel>

      <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
        AI يُقيَّد بـ metadata-only — لا يُنشئ أحاديث أو آيات أو فتاوى. جميع المحتوى من مصادر موثقة.
      </p>
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

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", padding: "0.25rem 0" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
