import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { adminFetch } from "@/lib/admin-api";

type MonitoringPayload = {
  ok?: boolean;
  systemStatus?: string;
  healthPercent?: number | null;
  connectorHealth?: {
    total?: number;
    breakdown?: Record<string, number>;
    healthy?: number;
    label?: string;
  } | null;
  infrastructure?: {
    cpuCount?: number;
    loadAvg?: number[];
    memory?: { totalMb?: number; freeMb?: number; usedPercent?: number };
    uptimeSec?: number;
  };
  realtime?: {
    queuePending?: number;
    queueFailed?: number;
    publishedToday?: number;
    connectorsActive?: number;
    successRate?: number | null;
  };
  crons?: Array<{ path: string; label: string; lastStatus?: string; lastRun?: string | null }>;
  instagram?: { configured?: boolean; ok?: boolean; failureReason?: string | null };
  instagramDiagnostics?: { token?: { expiresAt?: string; scopes?: string[] }; remediation?: { steps?: string[] } };
  lastError?: string | null;
  lastWarning?: string | null;
  vercel?: { gitCommit?: string | null; deploymentUrl?: string | null; region?: string | null };
  systemHealth?: { ai?: { status?: string }; queue?: { pending?: number; failed?: number } };
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    Healthy: { bg: "#DCFCE7", fg: C.emeraldDeep, label: "سليم" },
    healthy: { bg: "#DCFCE7", fg: C.emeraldDeep, label: "سليم" },
    Degraded: { bg: "#FEF3C7", fg: "#92400E", label: "متدهور" },
    degraded: { bg: "#FEF3C7", fg: "#92400E", label: "متدهور" },
    warning: { bg: "#FEF3C7", fg: "#92400E", label: "تحذير" },
    critical: { bg: "#FEE2E2", fg: "#991B1B", label: "حرج" },
    Disabled: { bg: "#E5E7EB", fg: "#374151", label: "معطّل" },
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
  const [data, setData] = useState<MonitoringPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminFetch("/api/admin/platform-monitoring?action=dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const breakdown = data?.connectorHealth?.breakdown || {};

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>مركز المراقبة — Production Dashboard</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            CPU · Memory · Queue · Connectors · Cron · AI · Instagram · OCR/Vision · Build
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.65rem", fontSize: "0.8125rem", alignItems: "center", flexWrap: "wrap" }}>
          <StatusPill status={data?.systemStatus || "unknown"} />
          {data?.healthPercent != null && (
            <span style={{ fontWeight: 700, color: C.emeraldDeep }}>Health: {data.healthPercent}%</span>
          )}
          <button type="button" onClick={load} style={{ padding: "0.35rem 0.75rem", borderRadius: "0.45rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer" }}>
            تحديث
          </button>
          <Link href="/admin/platform/health" style={{ color: C.emeraldDeep }}>صحة المنصة</Link>
          <Link href="/admin/platform/instagram" style={{ color: C.emeraldDeep }}>Instagram</Link>
          <Link href="/admin/platform/ai-status" style={{ color: C.emeraldDeep }}>AI/Vision</Link>
        </div>
      </div>

      {loading && !data ? <Loading /> : error ? (
        <p style={{ color: "#991B1B" }}>{error}</p>
      ) : data ? (
        <>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <StatCard label="Connectors Healthy" value={data.connectorHealth?.healthy ?? "—"} />
            <StatCard label="Health %" value={data.healthPercent != null ? `${data.healthPercent}%` : "—"} />
            <StatCard label="Queue Pending" value={data.realtime?.queuePending ?? data.systemHealth?.queue?.pending ?? 0} />
            <StatCard label="Queue Failed" value={data.realtime?.queueFailed ?? data.systemHealth?.queue?.failed ?? 0} color="#991B1B" />
            <StatCard label="Published Today" value={data.realtime?.publishedToday ?? 0} />
            <StatCard label="Memory Used" value={data.infrastructure?.memory?.usedPercent != null ? `${data.infrastructure.memory.usedPercent}%` : "—"} />
            <StatCard label="CPU Cores" value={data.infrastructure?.cpuCount ?? "—"} />
            <StatCard label="Uptime (s)" value={data.infrastructure?.uptimeSec ?? "—"} />
          </div>

          {Object.keys(breakdown).length > 0 && (
            <section style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", color: C.emeraldDeep, marginBottom: "0.5rem" }}>Connector Health Breakdown</h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.8125rem" }}>
                {Object.entries(breakdown).map(([state, count]) => (
                  count > 0 ? (
                    <span key={state} style={{ padding: "0.35rem 0.65rem", border: `1px solid ${C.line}`, borderRadius: "0.45rem" }}>
                      {state}: <strong>{count}</strong>
                    </span>
                  ) : null
                ))}
              </div>
            </section>
          )}

          <section style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", color: C.emeraldDeep, marginBottom: "0.5rem" }}>Subsystems</h3>
            <div style={{ display: "grid", gap: "0.35rem", fontSize: "0.8125rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.45rem 0.65rem", border: `1px solid ${C.line}`, borderRadius: "0.45rem" }}>
                <span>Instagram</span>
                <StatusPill status={data.instagram?.ok ? "healthy" : data.instagram?.configured ? "Degraded" : "Disabled"} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.45rem 0.65rem", border: `1px solid ${C.line}`, borderRadius: "0.45rem" }}>
                <span>AI / Vision</span>
                <span>{data.systemHealth?.ai?.status || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.45rem 0.65rem", border: `1px solid ${C.line}`, borderRadius: "0.45rem" }}>
                <span>Last Deploy</span>
                <span>{data.vercel?.gitCommit || "—"} {data.vercel?.region ? `(${data.vercel.region})` : ""}</span>
              </div>
            </div>
          </section>

          {(data.lastError || data.lastWarning) && (
            <section style={{ marginBottom: "1.25rem", fontSize: "0.8125rem" }}>
              {data.lastError && <p style={{ color: "#991B1B" }}><strong>آخر Error:</strong> {data.lastError}</p>}
              {data.lastWarning && <p style={{ color: "#92400E" }}><strong>آخر Warning:</strong> {data.lastWarning}</p>}
            </section>
          )}

          <section style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", color: C.emeraldDeep, marginBottom: "0.5rem" }}>Cron Jobs</h3>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              {(data.crons || []).slice(0, 14).map((c) => (
                <div key={c.path} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "0.45rem 0.65rem", border: `1px solid ${C.line}`, borderRadius: "0.45rem", fontSize: "0.8125rem" }}>
                  <strong>{c.label || c.path}</strong>
                  <span style={{ color: C.inkSoft }}>{c.lastStatus || "unknown"} · {c.lastRun ? new Date(c.lastRun).toLocaleString("ar-KW") : "—"}</span>
                </div>
              ))}
            </div>
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
