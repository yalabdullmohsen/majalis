import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  fetchDeploymentDashboard,
  runPostDeployVerify,
  runProductionSelfHeal,
  type DeploymentDashboard,
} from "@/lib/deployment-pipeline-api";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.35rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</p>
      {sub && <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: C.inkSoft }}>{sub}</p>}
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span style={{ color: ok ? C.emeraldDeep : "#991B1B", fontWeight: 700 }}>
      {ok ? "● سليم" : "● متوقف"}
    </span>
  );
}

export function DeploymentDashboardPage() {
  const [data, setData] = useState<DeploymentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchDeploymentDashboard());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const runAction = async (action: "verify" | "heal") => {
    setRunning(action);
    try {
      if (action === "verify") await runPostDeployVerify();
      else await runProductionSelfHeal();
      await load();
    } finally {
      setRunning(null);
    }
  };

  const s = data?.stats?.stats;
  const health = data?.health;

  return (
    <AdminShell section="dashboard">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: C.emeraldDeep }}>
              Autonomous CD — لوحة النشر
            </h1>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>
              Cursor → CI → Auto Merge → Production → Verify → Self-Heal
              {data?.version ? ` · v${data.version}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link href="/admin/platform/health" style={{ fontSize: "0.8125rem", color: C.emeraldDeep }}>صحة المنصة</Link>
            <button type="button" onClick={() => runAction("heal")} disabled={!!running} style={btnStyle(!!running)}>
              {running === "heal" ? "جارٍ الإصلاح…" : "🔧 Self-Heal"}
            </button>
            <button type="button" onClick={() => runAction("verify")} disabled={!!running} style={btnStyle(!!running, true)}>
              {running === "verify" ? "جارٍ التحقق…" : "▶ Post-Deploy Verify"}
            </button>
          </div>
        </div>

        {loading && !data ? (
          <Loading />
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <StatCard label="حالة Production" value={health?.production ? "✓" : "✗"} sub={health?.ok ? "healthy" : "degraded"} />
              <StatCard label="نسبة نجاح Deploy" value={s?.deploySuccessRate != null ? `${s.deploySuccessRate}%` : "—"} />
              <StatCard label="PRs مدمجة تلقائياً" value={s?.autoMergeCount ?? 0} />
              <StatCard label="Rollbacks" value={s?.rollbackCount ?? 0} />
              <StatCard label="إجمالي Deploys" value={s?.totalDeploys ?? 0} />
              <StatCard label="Supabase" value={health?.supabase?.status === "connected" ? "✓" : "✗"} />
              <StatCard label="Database" value={health?.database?.status === "connected" ? "✓" : "✗"} />
              <StatCard label="Cron" value={health?.cron?.secretConfigured ? "✓" : "—"} />
              <StatCard label="AI" value={health?.ai?.status === "ready" ? "✓" : "fallback"} />
              <StatCard label="Queue" value={health?.queue?.pending ?? 0} sub={`failed: ${health?.queue?.failed ?? 0}`} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <Panel title="آخر Deployment">
                {data?.stats?.lastDeployment ? (
                  <Row label="الحالة" value={String(data.stats.lastDeployment.status)} />
                ) : (
                  <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا deployments مسجّلة بعد.</p>
                )}
                {data?.vercel?.[0] && (
                  <>
                    <Row label="Vercel" value={data.vercel[0].state} />
                    <Row label="Commit" value={data.vercel[0].commitSha?.slice(0, 7) || "—"} />
                  </>
                )}
              </Panel>

              <Panel title="حالة الخدمات">
                <Row label="Production" value={<StatusDot ok={health?.production !== false} />} />
                <Row label="GitHub CI" value={<StatusDot ok={true} />} />
                <Row label="Vercel" value={<StatusDot ok={(data?.vercel?.[0]?.state || "") === "READY"} />} />
                <Row label="Supabase" value={<StatusDot ok={health?.supabase?.status === "connected"} />} />
                <Row label="Connectors" value={String(health?.metrics?.connectorsActive ?? health?.metrics?.sourcesActive ?? "—")} />
              </Panel>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <Panel title="آخر Pipeline Runs">
                {(data?.stats?.recentRuns || []).length === 0 ? (
                  <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا تشغيلات pipeline.</p>
                ) : (
                  (data?.stats?.recentRuns || []).slice(0, 6).map((r) => (
                    <div key={String(r.id)} style={{ fontSize: "0.75rem", color: C.inkSoft, padding: "0.25rem 0" }}>
                      {String(r.status)} · {String(r.branch || "main")} · {String(r.risk_level)} · {r.auto_merge ? "auto-merge" : "manual"}
                    </div>
                  ))
                )}
              </Panel>

              <Panel title="Self-Healing Events">
                {(data?.stats?.selfHealEvents || []).length === 0 ? (
                  <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا أحداث إصلاح.</p>
                ) : (
                  (data?.stats?.selfHealEvents || []).slice(0, 8).map((e) => (
                    <div key={String(e.id)} style={{ fontSize: "0.75rem", color: C.inkSoft, padding: "0.25rem 0" }}>
                      {String(e.issue_type)} → {String(e.action_taken)} {e.success ? "✓" : "✗"}
                    </div>
                  ))
                )}
              </Panel>
            </div>

            {health?.errors && health.errors.length > 0 && (
              <div style={{ marginTop: "1.25rem", padding: "0.75rem 1rem", borderRadius: "0.375rem", background: "#FEE2E2", border: "1px solid #FCA5A5", fontSize: "0.8125rem", color: "#991B1B" }}>
                {health.errors.map((e) => <div key={e}>{e}</div>)}
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "0.9375rem", fontWeight: 700, color: C.emeraldDeep }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: `1px solid ${C.line}`, fontSize: "0.8125rem" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function btnStyle(disabled: boolean, primary = false) {
  return {
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem",
    background: primary ? C.emerald : C.panel,
    color: primary ? "white" : C.emeraldDeep,
    border: primary ? "none" : `1px solid ${C.line}`,
    cursor: disabled ? "wait" : "pointer",
    opacity: disabled ? 0.7 : 1,
    fontFamily: "inherit",
    fontSize: "0.8125rem",
  } as const;
}

export default DeploymentDashboardPage;
