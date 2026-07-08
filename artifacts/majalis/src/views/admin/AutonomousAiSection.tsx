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
      <div className="aai-header">
        <h2>المنظومة الذاتية للذكاء الاصطناعي</h2>
        <div className="aai-btn-group">
          <button type="button" onClick={handleRun} disabled={running}>
            {running ? "جاري التشغيل..." : "تشغيل الدورة الكاملة"}
          </button>
          <button type="button" onClick={handleSecurity}>تدقيق الأمان</button>
          <button type="button" onClick={handleReport}>إنشاء التقرير</button>
        </div>
      </div>

      <div className="aai-stats-grid">
        <StatCard label="عناصر جديدة" value={obs?.metrics?.itemsNew ?? 0} />
        <StatCard label="مرفوضة" value={obs?.metrics?.itemsRejected ?? 0} color="#dc2626" />
        <StatCard label="معدل النجاح" value={`${obs?.metrics?.successRate ?? 0}%`} />
        <StatCard label="محتوى يومي" value={obs?.metrics?.dailyContentCount ?? 0} />
        <StatCard label="إعادة محاولة" value={obs?.metrics?.retryPending ?? 0} />
        <StatCard label="مراحل Pipeline" value={Object.keys(PIPELINE_STAGE_LABELS).length} />
      </div>

      <div className="aai-panels-grid">
        <Panel title="حالة Cron Jobs">
          {(obs?.cronJobs || []).map((job) => (
            <div key={job.name} className="aai-cron-item">
              <span>{job.name}</span>
              <span
                className="aai-cron-status"
                style={{ "--aai-status-color": job.status === "healthy" ? "var(--majalis-emerald-deep,#0A5040)" : "#dc2626" } as React.CSSProperties}
              >{job.status}</span>
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
              <div key={reason} className="aai-small-item">{reason}: {count}</div>
            ))
          ) : (
            <p className="aai-muted">لا توجد رفضات حديثة</p>
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
            <p className="aai-muted">اضغط «تدقيق الأمان» للفحص</p>
          )}
        </Panel>
      </div>

      <Panel title="آخر عمليات Pipeline">
        {events.length > 0 ? (
          <div className="aai-events-scroll">
            {events.map((ev) => (
              <div key={ev.id || ev.created_at + ev.stage} className="aai-event">
                <span
                  className="aai-event__status"
                  style={{ "--aai-ev-color": ev.success ? "var(--majalis-emerald-deep,#0A5040)" : "#dc2626" } as React.CSSProperties}
                >{ev.success ? "✓" : "✗"}</span>
                {" "}
                <strong>{PIPELINE_STAGE_LABELS[ev.stage] || ev.stage}</strong>
                {" — "}
                {ev.message}
              </div>
            ))}
          </div>
        ) : (
          <p className="aai-muted">لا توجد عمليات مسجلة بعد — شغّل الدورة الكاملة</p>
        )}
      </Panel>

      <p className="aai-footer-note">
        AI يُقيَّد بـ metadata-only — لا يُنشئ أحاديث أو آيات أو فتاوى. جميع المحتوى من مصادر موثقة.
      </p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="aai-stat" style={{ "--aai-val-color": color } as React.CSSProperties}>
      <div className="aai-stat__label">{label}</div>
      <div className="aai-stat__value">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="aai-panel">
      <h3 className="aai-panel__h3">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="aai-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
