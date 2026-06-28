import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { fetchProductionHealth, type ProductionHealthPayload } from "@/lib/autonomous-platform-api";

function ReadinessRing({ pct }: { pct: number }) {
  const color = pct >= 100 ? C.emeraldDeep : pct >= 70 ? "#92400E" : "#991B1B";
  return (
    <div style={{ textAlign: "center", padding: "1rem" }}>
      <div style={{ fontSize: "2.75rem", fontWeight: 800, color, lineHeight: 1 }}>{pct}%</div>
      <div style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: "0.35rem" }}>Production Readiness</div>
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.2rem 0.55rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: ok ? "#DCFCE7" : "#FEE2E2",
        color: ok ? C.emeraldDeep : "#991B1B",
      }}
    >
      {label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: C.emeraldDeep }}>{title}</h2>
      {children}
    </section>
  );
}

function PlatformHealthContent() {
  const [health, setHealth] = useState<ProductionHealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductionHealth();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل حالة المنصة");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading && !health) {
    return (
      <div>
        <Loading />
        <p style={{ textAlign: "center", color: C.inkSoft }}>جارٍ تحليل جاهزية الإنتاج…</p>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: "900px" }}>
        <h1 style={{ color: "#991B1B" }}>خطأ في تحميل لوحة الصحة</h1>
        <p style={{ color: C.inkSoft }}>{error}</p>
        <button type="button" onClick={() => void load()} style={{ marginTop: "0.75rem", padding: "0.5rem 1rem" }}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!health) return null;

  const criticalMissing = health.infrastructure.filter((i) => i.priority === "critical" && !i.present);

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, color: C.emeraldDeep }}>Production Health — AKP v3</h1>
          <p style={{ margin: "0.35rem 0 0", color: C.inkSoft, fontSize: "0.875rem" }}>
            المرجع الرئيسي لحالة المنصة · {health.platformVersion} · {health.at ? new Date(health.at).toLocaleString("ar") : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.8125rem", alignItems: "center" }}>
          <Link href="/admin/platform/checklist" style={{ color: C.emeraldDeep }}>Checklist</Link>
          <Link href="/admin/sources" style={{ color: C.emeraldDeep }}>المصادر</Link>
          <Link href="/admin/platform/analytics" style={{ color: C.emeraldDeep }}>الإحصائيات</Link>
          <button type="button" onClick={() => void load()} style={{ padding: "0.4rem 0.8rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel }}>
            تحديث
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ flex: "1 1 180px", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem" }}>
          <ReadinessRing pct={health.readinessPct} />
        </div>
        <div style={{ flex: "2 1 320px", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <StatusBadge ok={health.migration.ok} label={health.migration.ok ? "Migration v3 ✓" : `Migration ${health.migration.appliedPct}%`} />
            <StatusBadge ok={(health.database.sources?.db || 0) > 0} label={`مصادر: ${health.database.sources?.db ?? 0}`} />
            <StatusBadge ok={(health.database.pipelineRuns?.length || 0) > 0} label={`Pipeline runs: ${health.database.pipelineRuns?.length ?? 0}`} />
            <StatusBadge ok={health.security.cronAuthConfigured} label="Cron Auth" />
          </div>
          {health.blockers.length > 0 && (
            <div style={{ fontSize: "0.8125rem" }}>
              <strong style={{ color: "#991B1B" }}>عوائق التفعيل:</strong>
              <ul style={{ margin: "0.35rem 0 0", paddingRight: "1.25rem" }}>
                {health.blockers.map((b, i) => (
                  <li key={i} style={{ color: b.severity === "warning" ? "#92400E" : "#991B1B" }}>
                    [{b.type}] {b.impact}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {health.ok && <p style={{ margin: 0, color: C.emeraldDeep, fontWeight: 600 }}>✓ Production Readiness = 100%</p>}
        </div>
      </div>

      {criticalMissing.length > 0 && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1.25rem" }}>
          <strong>إجراءات مطلوبة من المالك (Vercel + GitHub Actions):</strong>
          <ul style={{ margin: "0.5rem 0 0", paddingRight: "1.25rem", fontSize: "0.875rem" }}>
            {health.ownerActions.map((a) => (
              <li key={a.secret}>
                <code>{a.secret}</code> → {a.addTo}: {a.impact}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Section title="البنية التحتية — Secrets (تفصيلي)">
        {health.infrastructure.map((item) => (
          <div key={item.key} style={{ marginBottom: "1rem", padding: "1rem", background: item.present ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${C.line}`, borderRadius: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <strong><code>{item.key}</code></strong>
              <StatusBadge ok={item.present} label={item.present ? "موجود" : "مفقود"} />
            </div>
            {item.whyRequired && <p style={{ margin: "0.35rem 0", fontSize: "0.8125rem" }}><strong>لماذا:</strong> {item.whyRequired}</p>}
            {item.stoppedFunctions && item.stoppedFunctions.length > 0 && !item.present && (
              <div style={{ fontSize: "0.8125rem", marginTop: "0.35rem" }}>
                <strong>متوقف:</strong>
                <ul style={{ margin: "0.25rem 0 0", paddingRight: "1.25rem" }}>{item.stoppedFunctions.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
            )}
            {item.howToFix && !item.present && (
              <div style={{ fontSize: "0.8125rem", marginTop: "0.35rem" }}>
                <strong>الإصلاح:</strong>
                <ol style={{ margin: "0.25rem 0 0", paddingRight: "1.25rem" }}>{item.howToFix.map((f) => <li key={f}>{f}</li>)}</ol>
              </div>
            )}
            {item.howToVerify && (
              <div style={{ fontSize: "0.8125rem", marginTop: "0.35rem" }}>
                <strong>التحقق:</strong>
                <ul style={{ margin: "0.25rem 0 0", paddingRight: "1.25rem" }}>{item.howToVerify.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
            )}
          </div>
        ))}
      </Section>

      <Section title="Migration — Expected vs Actual">
        {health.migration.expectedVsActual && (
          <div style={{ fontSize: "0.8125rem", display: "grid", gap: "0.75rem" }}>
            <div>
              <strong>Tables:</strong> {health.migration.expectedVsActual.actual.tables.present.length}/{health.migration.expectedVsActual.expected.tables.length} present
              {health.migration.expectedVsActual.actual.tables.missing.length > 0 && (
                <span style={{ color: "#991B1B" }}> — missing: {health.migration.expectedVsActual.actual.tables.missing.join(", ")}</span>
              )}
            </div>
            <div>
              <strong>Indexes:</strong>{" "}
              {health.migration.expectedVsActual.actual.indexes.skipped
                ? `(skipped — ${health.migration.expectedVsActual.actual.indexes.reason})`
                : `${health.migration.expectedVsActual.actual.indexes.present.length}/${health.migration.expectedVsActual.expected.indexes.length}`}
            </div>
            <div>
              <strong>Policies:</strong>{" "}
              {health.migration.expectedVsActual.actual.policies.skipped
                ? `(skipped — ${health.migration.expectedVsActual.actual.policies.reason})`
                : `${health.migration.expectedVsActual.actual.policies.present.length}/${health.migration.expectedVsActual.expected.policies.length}`}
            </div>
          </div>
        )}
        {health.migration.missing.length > 0 ? (
          <div>
            <p style={{ color: "#991B1B", fontSize: "0.875rem" }}>
              جداول ناقصة ({health.migration.missing.length}):
            </p>
            <ul style={{ fontSize: "0.8125rem", columns: 2 }}>
              {health.migration.missing.map((t) => (
                <li key={t}><code>{t}</code></li>
              ))}
            </ul>
          </div>
        ) : (
          <p style={{ color: C.emeraldDeep, fontSize: "0.875rem" }}>✓ جميع جداول v3 موجودة ({health.migration.present.length})</p>
        )}
        {health.bootstrap.blockedReason && (
          <p style={{ fontSize: "0.8125rem", color: "#92400E", marginTop: "0.5rem" }}>
            Bootstrap: {health.bootstrap.blockedReason}
          </p>
        )}
      </Section>

      <Section title="صحة قاعدة البيانات">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem" }}>
          {Object.entries(health.database.counts).map(([table, count]) => {
            const reason = health.database.emptyReasons[table];
            return (
              <div key={table} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "0.65rem", fontSize: "0.75rem" }}>
                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{table}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: count && count > 0 ? C.emeraldDeep : C.inkSoft }}>
                  {count === null ? "N/A" : count}
                </div>
                {reason && <div style={{ color: "#92400E", marginTop: "0.25rem" }}>{typeof reason === "string" ? reason : reason.message}</div>}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Cron Jobs — تفصيلي">
        {health.crons.blockReason && (
          <p style={{ color: "#991B1B", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>{health.crons.blockReason}</p>
        )}
        <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: "0.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px", fontSize: "0.75rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep, textAlign: "right" }}>
                {["Path", "Enabled", "Registered", "Last Run", "Last OK", "Last Fail", "Next", "Avg ms", "Items", "Reason"].map((h) => (
                  <th key={h} style={{ padding: "0.4rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {health.crons.crons.map((c) => (
                <tr key={c.path}>
                  <td style={{ padding: "0.4rem" }}><code>{c.path.split("/").pop()}</code></td>
                  <td style={{ padding: "0.4rem" }}>{c.enabled ? "✓" : "—"}</td>
                  <td style={{ padding: "0.4rem" }}>{c.registered ? "✓" : "✗"}</td>
                  <td style={{ padding: "0.4rem" }}>{c.lastRun?.slice(0, 16) ?? "—"}</td>
                  <td style={{ padding: "0.4rem" }}>{c.lastSuccess?.slice(0, 16) ?? "—"}</td>
                  <td style={{ padding: "0.4rem" }}>{c.lastFailure?.slice(0, 16) ?? "—"}</td>
                  <td style={{ padding: "0.4rem" }}>{c.nextRun ? String(c.nextRun).slice(0, 16) : "—"}</td>
                  <td style={{ padding: "0.4rem" }}>{c.averageRuntimeMs ?? "—"}</td>
                  <td style={{ padding: "0.4rem" }}>{c.itemsProcessed ?? 0}</td>
                  <td style={{ padding: "0.4rem", color: "#92400E" }}>{c.neverRunReason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {health.logs && (
        <Section title="Logs (مصنّفة)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
            {Object.entries(health.logs).map(([cat, data]) => (
              <div key={cat} style={{ border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "0.65rem", fontSize: "0.75rem" }}>
                <strong>{cat}</strong> ({data.count ?? data.entries.length})
                {data.entries.slice(0, 3).map((e, i) => (
                  <div key={i} style={{ color: C.inkSoft, marginTop: "0.25rem" }}>{e.component}/{e.event}</div>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}

      {health.database.pipelineRuns.length > 0 && (
        <Section title="آخر Pipeline Runs">
          <div style={{ overflowX: "auto", fontSize: "0.75rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${C.line}` }}>
              <thead>
                <tr style={{ background: C.parchmentDeep }}>
                  {["Pipeline", "Status", "Produced", "Published", "Duration", "Started"].map((h) => (
                    <th key={h} style={{ padding: "0.4rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {health.database.pipelineRuns.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: "0.4rem" }}>{r.pipeline}</td>
                    <td style={{ padding: "0.4rem" }}>{r.status}</td>
                    <td style={{ padding: "0.4rem" }}>{r.produced ?? 0}</td>
                    <td style={{ padding: "0.4rem" }}>{r.published ?? 0}</td>
                    <td style={{ padding: "0.4rem" }}>{r.duration_ms ? `${r.duration_ms}ms` : "—"}</td>
                    <td style={{ padding: "0.4rem" }}>{r.started_at?.slice(0, 16) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {health.database.selfHealing.length > 0 && (
        <Section title="Self-Healing Events">
          <ul style={{ fontSize: "0.8125rem", paddingRight: "1.25rem" }}>
            {health.database.selfHealing.map((e, i) => (
              <li key={i}>
                [{e.event_type}] {e.component} — {e.action_taken} ({e.success ? "✓" : "✗"})
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export function PlatformHealthPage() {
  return (
    <AdminShell section="lessons">
      <PlatformHealthContent />
    </AdminShell>
  );
}

export default PlatformHealthPage;
