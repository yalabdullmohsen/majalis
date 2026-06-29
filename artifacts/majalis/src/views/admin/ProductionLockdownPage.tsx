import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { fetchProductionLockdownReport, runProductionRecovery, type LockdownReport } from "@/lib/production-lockdown-api";

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
  if (status === "operational") return { bg: "#DCFCE7", color: C.emeraldDeep };
  if (status === "partial" || status === "degraded") return { bg: "#FEF3C7", color: "#92400E" };
  return { bg: "#FEE2E2", color: "#991B1B" };
}

export function ProductionLockdownContent() {
  const [report, setReport] = useState<LockdownReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchProductionLockdownReport());
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل تقرير الإغلاق");
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

  if (loading && !report) return <Loading />;
  if (error && !report) return <p style={{ color: "#991B1B" }}>{error}</p>;
  if (!report) return null;

  return (
    <div dir="rtl">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.375rem", color: C.emeraldDeep }}>Production Lockdown</h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>
            آخر تحديث: {new Date(report.at).toLocaleString("ar-KW")} — لا ميزات جديدة قبل الاستقرار
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" onClick={() => void load()} style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer" }}>تحديث</button>
          <button type="button" onClick={() => void handleRecovery()} disabled={recovering} style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: "none", background: C.emerald, color: C.parchment, cursor: "pointer" }}>
            {recovering ? "جاري…" : "تشغيل Recovery"}
          </button>
          <Link href="/admin/platform/health" style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, textDecoration: "none", color: C.emeraldDeep }}>AKP Health</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <ScoreRing score={report.healthScore} label="Health Score" />
        <ScoreRing score={report.readinessPct} label="Readiness %" />
        <ScoreRing score={Number(String(report.scores.systemsOperational).split("/")[0]) || 0} label={`أنظمة (${report.scores.systemsOperational})`} />
        <ScoreRing score={Number(String(report.scores.routesOk).split("/")[0]) || 0} label={`Routes (${report.scores.routesOk})`} />
      </div>

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
                    <td style={{ padding: "0.5rem", fontSize: "0.75rem" }}>{s.cron || "—"}</td>
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
                {r.ok ? "✓" : "✗"} {r.route} — {r.status} ({r.ms}ms)
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
