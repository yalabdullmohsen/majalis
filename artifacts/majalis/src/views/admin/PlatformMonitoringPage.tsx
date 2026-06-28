import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  fetchMonitoringDashboard,
  generateMonitoringReport,
  resolveMonitoringAlert,
  sendMonitoringTestAlert,
  type AkeAlert,
  type MonitoringDashboard,
} from "@/lib/ake-monitoring-api";

const STATUS_COLORS: Record<string, string> = {
  healthy: C.emeraldDeep,
  warning: "#D97706",
  critical: "#991B1B",
  idle: C.inkSoft,
  unknown: C.inkSoft,
};

const SEVERITY_BG: Record<string, string> = {
  critical: "#FEE2E2",
  warning: "#FEF3C7",
  info: "#EFF6FF",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: C.emeraldDeep }}>{title}</h2>
      {children}
    </section>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem", minWidth: "100px" }}>
      <div style={{ fontSize: "1.35rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: "0.25rem" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.15rem" }}>{sub}</div>}
    </div>
  );
}

function AlertRow({ alert, onResolve }: { alert: AkeAlert; onResolve: (id: string) => void }) {
  return (
    <div
      style={{
        padding: "0.75rem",
        marginBottom: "0.5rem",
        borderRadius: "0.375rem",
        background: SEVERITY_BG[alert.severity] || C.panel,
        border: `1px solid ${C.line}`,
        fontSize: "0.8125rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
        <strong>{alert.title || alert.message}</strong>
        <span style={{ color: STATUS_COLORS[alert.severity] || C.inkSoft }}>{alert.severity}</span>
      </div>
      <p style={{ margin: "0.35rem 0", color: C.inkSoft }}>{alert.message}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>
          {alert.alert_type} · {new Date(alert.created_at).toLocaleString("ar-KW")}
        </span>
        <button
          type="button"
          onClick={() => onResolve(alert.id)}
          style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", border: `1px solid ${C.line}`, borderRadius: "0.25rem", background: C.panel, cursor: "pointer" }}
        >
          تم الحل
        </button>
      </div>
    </div>
  );
}

export function PlatformMonitoringContent() {
  const [data, setData] = useState<MonitoringDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await fetchMonitoringDashboard();
      setData(dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل لوحة المراقبة");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const handleResolve = async (alertId: string) => {
    setActionLoading("resolve");
    try {
      await resolveMonitoringAlert(alertId);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestAlert = async () => {
    setActionLoading("test");
    try {
      await sendMonitoringTestAlert();
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateReport = async () => {
    setActionLoading("report");
    try {
      await generateMonitoringReport(true);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) return <Loading />;

  if (error && !data) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h1 style={{ color: "#991B1B" }}>خطأ</h1>
        <p>{error}</p>
        <button type="button" onClick={() => void load()}>إعادة المحاولة</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, color: C.emeraldDeep }}>المراقبة والتنبيهات — AKE Phase 8</h1>
          <p style={{ margin: "0.35rem 0 0", color: C.inkSoft, fontSize: "0.875rem" }}>
            حالة النظام:{" "}
            <span style={{ color: STATUS_COLORS[data.systemStatus], fontWeight: 700 }}>{data.systemStatus}</span>
            {" · "}
            {data.at ? new Date(data.at).toLocaleString("ar-KW") : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/admin?section=knowledge-engine" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>Auto Knowledge Engine</Link>
          <Link href="/admin/platform/health" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>Production Health</Link>
          <button type="button" onClick={() => void load()} style={{ padding: "0.4rem 0.8rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel }}>
            تحديث
          </button>
          <button type="button" disabled={!!actionLoading} onClick={() => void handleTestAlert()} style={{ padding: "0.4rem 0.8rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel }}>
            {actionLoading === "test" ? "…" : "تنبيه اختبار"}
          </button>
          <button type="button" disabled={!!actionLoading} onClick={() => void handleGenerateReport()} style={{ padding: "0.4rem 0.8rem", borderRadius: "0.375rem", background: C.emerald, color: "white", border: "none" }}>
            {actionLoading === "report" ? "…" : "تقرير الآن"}
          </button>
        </div>
      </div>

      {!data.tablesReady && (
        <div style={{ padding: "0.75rem 1rem", marginBottom: "1rem", borderRadius: "0.375rem", background: "#FEF3C7", border: "1px solid #F59E0B", fontSize: "0.8125rem" }}>
          ⚠️ نفّذ migration: supabase/auto_knowledge_engine_v17_monitoring.sql
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <StatCard label="مصادر نشطة" value={data.connectors.active} sub={`${data.connectors.healthy} سليم · ${data.connectors.failing} فاشل`} />
        <StatCard label="تنبيهات حرجة" value={data.criticalAlerts.length} />
        <StatCard label="تنبيهات مفتوحة" value={data.openAlerts.length} />
        <StatCard label="دروس (24س)" value={data.publishing24h.lessons} />
        <StatCard label="فوائد (24س)" value={data.publishing24h.benefits} />
        <StatCard label="أسئلة (24س)" value={data.publishing24h.questions} />
        <StatCard label="مجلب (24س)" value={data.publishing24h.fetched} />
        <StatCard label="مرفوض (24س)" value={data.publishing24h.rejected} />
      </div>

      <Section title="تنبيهات حرجة">
        {data.criticalAlerts.length === 0 ? (
          <p style={{ color: C.inkSoft, fontSize: "0.8125rem" }}>لا تنبيهات حرجة مفتوحة.</p>
        ) : (
          data.criticalAlerts.map((a) => <AlertRow key={a.id} alert={a} onResolve={handleResolve} />)
        )}
      </Section>

      <Section title="جميع التنبيهات المفتوحة">
        {data.openAlerts.length === 0 ? (
          <p style={{ color: C.inkSoft, fontSize: "0.8125rem" }}>لا تنبيهات مفتوحة.</p>
        ) : (
          data.openAlerts.slice(0, 20).map((a) => <AlertRow key={a.id} alert={a} onResolve={handleResolve} />)
        )}
      </Section>

      <Section title="صحة Cron">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}`, textAlign: "right" }}>
                <th style={{ padding: "0.5rem" }}>Cron</th>
                <th style={{ padding: "0.5rem" }}>الجدول</th>
                <th style={{ padding: "0.5rem" }}>آخر تشغيل</th>
                <th style={{ padding: "0.5rem" }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.cronStatus.map((c) => (
                <tr key={c.name} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.5rem" }}>{c.label}</td>
                  <td style={{ padding: "0.5rem", color: C.inkSoft }}>{c.schedule}</td>
                  <td style={{ padding: "0.5rem" }}>{c.lastRun ? new Date(c.lastRun).toLocaleString("ar-KW") : "—"}</td>
                  <td style={{ padding: "0.5rem", color: c.lastStatus === "success" ? C.emeraldDeep : c.lastStatus === "failed" ? "#991B1B" : C.inkSoft }}>
                    {c.lastStatus}
                    {c.errorMessage ? ` — ${c.errorMessage.slice(0, 60)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        <Section title="فشل Pipeline">
          {data.pipelineFailures.length === 0 ? (
            <p style={{ color: C.inkSoft, fontSize: "0.8125rem" }}>لا فشل مفتوح.</p>
          ) : (
            data.pipelineFailures.slice(0, 8).map((f) => (
              <div key={String(f.id)} style={{ fontSize: "0.75rem", padding: "0.35rem 0", borderBottom: `1px solid ${C.line}` }}>
                <strong>{String(f.stage)}</strong> — {String(f.error_message || "").slice(0, 80)}
              </div>
            ))
          )}
        </Section>

        <Section title="أحداث صحة المصادر">
          {data.sourceEvents.length === 0 ? (
            <p style={{ color: C.inkSoft, fontSize: "0.8125rem" }}>لا أحداث حديثة.</p>
          ) : (
            data.sourceEvents.slice(0, 8).map((e) => (
              <div key={String(e.id)} style={{ fontSize: "0.75rem", padding: "0.35rem 0", borderBottom: `1px solid ${C.line}` }}>
                {String(e.connector_slug)} — {String(e.event_type)}
              </div>
            ))
          )}
        </Section>
      </div>

      <Section title="سجل التقارير اليومية">
        {data.dailyReports.length === 0 ? (
          <p style={{ color: C.inkSoft, fontSize: "0.8125rem" }}>لا تقارير بعد — اضغط «تقرير الآن».</p>
        ) : (
          data.dailyReports.map((r) => {
            const metrics = (r.metrics as Record<string, number>) || {};
            return (
              <div key={String(r.id)} style={{ padding: "0.5rem 0", borderBottom: `1px solid ${C.line}`, fontSize: "0.8125rem" }}>
                <strong>{String(r.report_date)}</strong>
                {" — "}
                مصادر: {metrics.active_sources ?? 0} · منشور: {metrics.lessons_published ?? 0} درس · {metrics.benefits_published ?? 0} فائدة
              </div>
            );
          })
        )}
      </Section>
    </div>
  );
}

export default function PlatformMonitoringPage() {
  return (
    <AdminShell section="knowledge-engine" onSectionChange={() => {}}>
      <PlatformMonitoringContent />
    </AdminShell>
  );
}
