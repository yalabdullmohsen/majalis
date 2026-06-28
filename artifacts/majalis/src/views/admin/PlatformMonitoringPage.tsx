import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { fetchAkeMonitoringDashboard, type MonitoringDashboard } from "@/lib/ake-monitoring-api";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    healthy: { bg: "#DCFCE7", fg: C.emeraldDeep, label: "سليم" },
    warning: { bg: "#FEF3C7", fg: "#92400E", label: "تحذير" },
    critical: { bg: "#FEE2E2", fg: "#991B1B", label: "حرج" },
    idle: { bg: "#E5E7EB", fg: "#374151", label: "خامل" },
    unknown: { bg: "#E5E7EB", fg: "#374151", label: "غير معروف" },
  };
  const s = map[status] || map.unknown;
  return (
    <span style={{ padding: "0.25rem 0.65rem", borderRadius: "999px", background: s.bg, color: s.fg, fontWeight: 700, fontSize: "0.8125rem" }}>
      {s.label}
    </span>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.65rem", padding: "0.85rem 1rem", minWidth: "110px" }}>
      <div style={{ fontSize: "1.35rem", fontWeight: 800, color: color || C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.2rem" }}>{label}</div>
    </div>
  );
}

function PlatformMonitoringContent() {
  const [data, setData] = useState<MonitoringDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAkeMonitoringDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>مركز المراقبة — Realtime</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            Connectors · Crons · Publisher · Queue · Alerts · AI/OCR/Vision usage
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.65rem", fontSize: "0.8125rem", alignItems: "center" }}>
          <StatusPill status={data?.systemStatus || "unknown"} />
          <button type="button" onClick={load} style={{ padding: "0.35rem 0.75rem", borderRadius: "0.45rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer" }}>
            تحديث
          </button>
          <Link href="/admin/platform/health" style={{ color: C.emeraldDeep }}>صحة المنصة</Link>
          <Link href="/admin/automation/dashboard" style={{ color: C.emeraldDeep }}>الأتمتة</Link>
        </div>
      </div>

      {loading && !data ? <Loading /> : error ? (
        <p style={{ color: "#991B1B" }}>{error}</p>
      ) : data ? (
        <>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <StatCard label="مصادر نشطة" value={data.connectors?.active ?? 0} />
            <StatCard label="مطلوبة سليمة" value={data.connectors?.requiredHealthy ?? 0} />
            <StatCard label="اختيارية متدهورة" value={data.connectors?.optionalDegraded ?? 0} color="#92400E" />
            <StatCard label="أسرار ناقصة" value={data.connectors?.credentialsMissing ?? 0} color="#92400E" />
            <StatCard label="محجوبة خارجياً" value={data.connectors?.externalBlocked ?? 0} color="#92400E" />
            <StatCard label="معطّلة بقصد" value={data.connectors?.disabledIntentionally ?? 0} />
            <StatCard label="دروس (24س)" value={data.publishing24h?.lessons ?? 0} />
            <StatCard label="فوائد (24س)" value={data.publishing24h?.benefits ?? 0} />
            <StatCard label="أسئلة (24س)" value={data.publishing24h?.questions ?? 0} />
            <StatCard label="منشور AKE" value={data.publishing24h?.knowledgePublished ?? 0} />
            <StatCard label="مرفوض" value={data.publishing24h?.rejected ?? 0} color="#92400E" />
          </div>

          {(data.connectors?.connectors?.length ?? 0) > 0 && (
            <section style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", color: C.emeraldDeep, marginBottom: "0.5rem" }}>حالة المصادر</h3>
              <div style={{ display: "grid", gap: "0.35rem", maxHeight: "220px", overflowY: "auto" }}>
                {(data.connectors.connectors || []).slice(0, 15).map((c) => (
                  <div key={c.slug} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "0.4rem 0.65rem", border: `1px solid ${C.line}`, borderRadius: "0.45rem", fontSize: "0.75rem" }}>
                    <span><strong>{c.name || c.slug}</strong> · {c.tier}</span>
                    <span style={{ color: C.inkSoft }}>{c.healthTier}{c.reason ? ` · ${c.reason}` : ""}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", color: C.emeraldDeep, marginBottom: "0.5rem" }}>Cron Jobs</h3>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              {(data.cronStatus || []).slice(0, 12).map((c) => (
                <div key={c.name} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "0.45rem 0.65rem", border: `1px solid ${C.line}`, borderRadius: "0.45rem", fontSize: "0.8125rem" }}>
                  <strong>{c.name}</strong>
                  <span style={{ color: C.inkSoft }}>{c.lastStatus} · {c.lastRun ? new Date(c.lastRun).toLocaleString("ar-KW") : "—"}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: "0.95rem", color: C.emeraldDeep, marginBottom: "0.5rem" }}>تنبيهات مفتوحة ({data.openAlerts?.length ?? 0})</h3>
            {(data.openAlerts || []).length === 0 ? (
              <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>لا توجد تنبيهات مفتوحة.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.35rem" }}>
                {data.openAlerts.slice(0, 8).map((a, i) => (
                  <div key={a.id || i} style={{ padding: "0.55rem 0.75rem", border: `1px solid ${C.line}`, borderRadius: "0.45rem", fontSize: "0.8125rem" }}>
                    <strong>{a.title || "تنبيه"}</strong>
                    <div style={{ color: C.inkSoft, marginTop: "0.15rem" }}>{a.message}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

export function PlatformMonitoringPage() {
  return (
    <AdminShell section="lessons">
      <PlatformMonitoringContent />
    </AdminShell>
  );
}

export default PlatformMonitoringPage;
