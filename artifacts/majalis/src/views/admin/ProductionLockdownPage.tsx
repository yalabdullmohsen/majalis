import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  fetchProductionLockdownReport,
  runProductionRecovery,
  runZeroTouchActivate,
  runZeroTouchSelfHeal,
  type LockdownReport,
} from "@/lib/production-lockdown-api";

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? C.emeraldDeep : score >= 60 ? "#92400E" : "#991B1B";
  return (
    <div style={{ textAlign: "center", padding: "1rem", border: `1px solid ${C.line}`, borderRadius: "0.5rem", background: C.panel }}>
      <div style={{ fontSize: "2.5rem", fontWeight: 800, color }}>{score}</div>
      <div style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{label}</div>
    </div>
  );
}

function statusColor(status: string) {
  if (status === "operational" || status === "ok") return { bg: "#DCFCE7", color: C.emeraldDeep };
  if (status === "partial" || status === "degraded") return { bg: "#FEF3C7", color: "#92400E" };
  return { bg: "#FEE2E2", color: "#991B1B" };
}

export function ProductionLockdownContent() {
  const [report, setReport] = useState<LockdownReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zt = report?.zeroTouch;
  const audit = zt?.audit;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchProductionLockdownReport(true));
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل تقرير الجاهزية");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 90_000);
    return () => window.clearInterval(id);
  }, [load]);

  const handleRecovery = async () => {
    if (!confirm("تطبيق migrations الاسترداد على Production؟")) return;
    setRecovering(true);
    try {
      const { ok } = await runProductionRecovery();
      alert(ok ? "تم تشغيل الاسترداد" : "فشل الاسترداد — راجع السجلات");
      await load();
    } finally {
      setRecovering(false);
    }
  };

  const handleActivate = async () => {
    if (!confirm("تشغيل Zero-Touch Activation كامل (تحقق + إصلاح + تدقيق)؟")) return;
    setActivating(true);
    try {
      const { ok } = await runZeroTouchActivate();
      alert(ok ? "اكتمل التفعيل الذاتي" : "التفعيل اكتمل مع أخطاء — راجع التقرير");
      await load();
    } finally {
      setActivating(false);
    }
  };

  const handleSelfHeal = async () => {
    setRecovering(true);
    try {
      const { ok } = await runZeroTouchSelfHeal();
      alert(ok ? "Self-Healing ناجح" : "Self-Healing — بعض الإصلاحات فشلت");
      await load();
    } finally {
      setRecovering(false);
    }
  };

  if (loading && !report) return <Loading />;
  if (error && !report) return <p style={{ color: "#991B1B" }}>{error}</p>;
  if (!report) return null;

  return (
    <div dir="rtl">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.375rem", color: C.emeraldDeep }}>Production Readiness</h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>
            Zero-Touch Activation — آخر تحديث: {new Date(report.at).toLocaleString("ar-KW")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={() => void load()} style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer" }}>تحديث</button>
          <button type="button" onClick={() => void handleSelfHeal()} disabled={recovering || activating} style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer" }}>Self-Heal</button>
          <button type="button" onClick={() => void handleRecovery()} disabled={recovering || activating} style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: "none", background: C.emerald, color: C.parchment, cursor: "pointer" }}>
            {recovering ? "جاري…" : "Recovery"}
          </button>
          <button type="button" onClick={() => void handleActivate()} disabled={activating || recovering} style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: "none", background: C.emeraldDeep, color: C.parchment, cursor: "pointer" }}>
            {activating ? "جاري…" : "Activate"}
          </button>
          <Link href="/admin/platform/health" style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, textDecoration: "none", color: C.emeraldDeep }}>AKP Health</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <ScoreRing score={report.healthScore} label="Health Score" />
        <ScoreRing score={report.readinessPct} label="Readiness %" />
        <ScoreRing score={Number(String(report.scores.systemsOperational).split("/")[0]) || 0} label={`أنظمة (${report.scores.systemsOperational})`} />
        <ScoreRing score={Number(String(report.scores.routesOk).split("/")[0]) || 0} label={`Routes (${report.scores.routesOk})`} />
        {audit && (
          <>
            <ScoreRing score={audit.criticalErrors} label="أخطاء حرجة" />
            <ScoreRing score={audit.migrationsApplied} label="Migrations" />
          </>
        )}
      </div>

      {zt && (
        <>
          {(zt.alerts?.length > 0 || zt.manualIntervention?.length > 0) && (
            <section style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #FCA5A5", borderRadius: "0.5rem", background: "#FEF2F2" }}>
              <h2 style={{ fontSize: "1rem", color: "#991B1B", marginTop: 0 }}>تنبيهات الإدارة</h2>
              <ul style={{ margin: 0, padding: "0 1rem", fontSize: "0.8125rem" }}>
                {zt.alerts.map((a, i) => (
                  <li key={`alert-${i}`} style={{ color: a.severity === "error" ? "#991B1B" : "#92400E" }}>{a.message}</li>
                ))}
                {zt.manualIntervention.map((m, i) => (
                  <li key={`manual-${i}`} style={{ color: "#991B1B" }}>{m.name}: {m.reason}</li>
                ))}
              </ul>
            </section>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <section style={{ border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "0.75rem" }}>
              <h2 style={{ fontSize: "1rem", color: C.emeraldDeep, marginTop: 0 }}>Startup Validation</h2>
              <p style={{ fontSize: "0.8125rem", margin: "0.25rem 0" }}>
                جداول: {zt.startupValidation.tables.present}/{zt.startupValidation.tables.expected}
              </p>
              {zt.startupValidation.tables.missing?.length > 0 && (
                <p style={{ fontSize: "0.75rem", color: "#991B1B" }}>
                  ناقص: {zt.startupValidation.tables.missing.slice(0, 8).join(", ")}
                  {zt.startupValidation.tables.missing.length > 8 ? "…" : ""}
                </p>
              )}
              <Link href="/admin/platform/health" style={{ fontSize: "0.75rem", color: C.emeraldDeep }}>تفاصيل AKP →</Link>
            </section>

            <section style={{ border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "0.75rem" }}>
              <h2 style={{ fontSize: "1rem", color: C.emeraldDeep, marginTop: 0 }}>Smart Migration Detection</h2>
              <p style={{ fontSize: "0.8125rem", margin: "0.25rem 0" }}>
                Applied: {zt.migrationState.applied.count} | Pending: {zt.migrationState.pending.count} | Failed: {zt.migrationState.failed.count}
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "0.75rem" }}>
                {zt.migrationState.scopes.map((s) => (
                  <li key={s.scope} style={{ color: s.status === "ok" ? C.emeraldDeep : "#991B1B" }}>
                    {s.status === "ok" ? "✓" : "○"} {s.scope} ({s.status})
                    {s.missingTables?.length ? ` — ${s.missingTables.slice(0, 2).join(", ")}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {audit && (
            <section style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", color: C.emeraldDeep }}>Health Score Breakdown</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))", gap: "0.5rem" }}>
                {(audit.healthBreakdown || []).map((b) => (
                  <div key={b.id} style={{ padding: "0.5rem", border: `1px solid ${C.line}`, borderRadius: "0.25rem", fontSize: "0.75rem" }}>
                    <div style={{ fontWeight: 600 }}>{b.label}</div>
                    <div style={{ color: b.score >= 80 ? C.emeraldDeep : "#991B1B" }}>{b.score}/100</div>
                    <div style={{ color: C.inkSoft }}>{b.detail}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", color: C.emeraldDeep }}>Automation Verification</h2>
            <p style={{ fontSize: "0.8125rem", color: zt.automationVerify.ok ? C.emeraldDeep : "#991B1B" }}>
              {zt.automationVerify.ok ? "✓ Deploy verified" : `✗ Failed: ${zt.automationVerify.failedChecks.join(", ")}`}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {(zt.automationVerify.checks || []).map((c) => (
                <span key={c.id} style={{ padding: "0.125rem 0.5rem", borderRadius: "999px", fontSize: "0.6875rem", background: c.ok ? "#DCFCE7" : "#FEE2E2", color: c.ok ? C.emeraldDeep : "#991B1B" }}>
                  {c.ok ? "✓" : "✗"} {c.label}
                </span>
              ))}
            </div>
          </section>

          {audit && (
            <section style={{ marginBottom: "1.5rem", padding: "1rem", background: C.parchmentDeep, borderRadius: "0.375rem" }}>
              <h2 style={{ fontSize: "1rem", color: C.emeraldDeep, marginTop: 0 }}>Final Production Audit</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: "0.5rem", fontSize: "0.8125rem" }}>
                <div>الجداول: {audit.tablesEnabled}</div>
                <div>Cron Jobs: {audit.cronJobsWorking}</div>
                <div>Queue: {audit.queueStatus}</div>
                <div>Workers: {audit.workersStatus}</div>
                <div>Migrations pending: {audit.migrationsPending}</div>
                <div>Deploy: {audit.deployVerified ? "verified" : "failed"}</div>
              </div>
            </section>
          )}
        </>
      )}

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", color: C.emeraldDeep }}>الأنظمة</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["النظام", "الحالة", "الدليل", "Cron"].map((h) => (
                  <th key={h} style={{ padding: "0.5rem", textAlign: "right", borderBottom: `1px solid ${C.line}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.systems.map((s) => {
                const sc = statusColor(s.status);
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "0.5rem", fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: "0.5rem" }}>
                      <span style={{ padding: "0.125rem 0.5rem", borderRadius: "999px", background: sc.bg, color: sc.color, fontSize: "0.75rem" }}>{s.status}</span>
                    </td>
                    <td style={{ padding: "0.5rem", color: C.inkSoft, fontSize: "0.8125rem" }}>{s.evidence}</td>
                    <td style={{ padding: "0.5rem", fontSize: "0.75rem" }}>{s.cron ? <Link href={s.cron}>{s.cron}</Link> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", color: C.emeraldDeep }}>Cron Jobs ({report.crons.length})</h2>
        <div style={{ maxHeight: "320px", overflow: "auto", border: `1px solid ${C.line}`, borderRadius: "0.375rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep, position: "sticky", top: 0 }}>
                {["المسار", "الجدولة", "HTTP", "آخر تشغيل", "المدة", "النتيجة", "نجاح", "فشل", "آخر خطأ"].map((h) => (
                  <th key={h} style={{ padding: "0.375rem", textAlign: "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.crons.map((c) => (
                <tr key={c.path} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.375rem", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }}>{c.path}</td>
                  <td style={{ padding: "0.375rem" }}>{c.schedule}</td>
                  <td style={{ padding: "0.375rem" }}>{c.httpStatus ?? "—"}</td>
                  <td style={{ padding: "0.375rem" }}>{c.lastRun ? new Date(c.lastRun).toLocaleString("ar-KW") : "—"}</td>
                  <td style={{ padding: "0.375rem" }}>{c.durationMs != null ? `${c.durationMs}ms` : "—"}</td>
                  <td style={{ padding: "0.375rem" }}>{c.lastResult ?? "—"}</td>
                  <td style={{ padding: "0.375rem" }}>{c.successCount ?? 0}</td>
                  <td style={{ padding: "0.375rem" }}>{c.failureCount ?? 0}</td>
                  <td style={{ padding: "0.375rem", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", color: "#991B1B" }}>{c.lastError || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <section>
          <h2 style={{ fontSize: "1rem", color: C.emeraldDeep }}>Routes</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "0.8125rem", maxHeight: "240px", overflow: "auto" }}>
            {report.routes.map((r) => (
              <li key={r.route} style={{ padding: "0.25rem 0", color: r.ok ? C.emeraldDeep : "#991B1B" }}>
                {r.ok ? "✓" : "✗"} <Link href={r.route}>{r.route}</Link> — {r.status} ({r.ms}ms)
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 style={{ fontSize: "1rem", color: C.emeraldDeep }}>APIs + سلامة البيانات</h2>
          <ul style={{ margin: "0 0 0.75rem", padding: 0, listStyle: "none", fontSize: "0.8125rem" }}>
            {report.apis.map((a) => (
              <li key={a.path} style={{ padding: "0.25rem 0", color: a.ok ? C.emeraldDeep : "#991B1B" }}>
                {a.ok ? "✓" : "✗"} {a.path}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: "0.8125rem", color: report.dataIntegrity.issueCount ? "#991B1B" : C.emeraldDeep }}>
            مشاكل سلامة البيانات: {report.dataIntegrity.issueCount}
          </p>
        </section>
      </div>
    </div>
  );
}

export default function ProductionLockdownPage() {
  return (
    <AdminShell section="lessons">
      <ProductionLockdownContent />
    </AdminShell>
  );
}
