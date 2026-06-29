import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  fetchUnifiedPlatform,
  runUnifiedPlatformCycle,
  retryUnifiedFailures,
  pauseGkeSource,
  runZeroTouchActivation,
  type UnifiedPlatformPayload,
} from "@/lib/autonomous-platform-api";

function ScoreRing({ score, target, label }: { score: number; target?: number; label: string }) {
  const threshold = target ?? 90;
  const color = score >= threshold ? C.emeraldDeep : score >= 60 ? "#92400E" : "#991B1B";
  return (
    <div style={{ textAlign: "center", padding: "1rem" }}>
      <div style={{ fontSize: "2.75rem", fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: "0.35rem" }}>{label}</div>
      {target != null && (
        <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.25rem" }}>الهدف ≥ {target}</div>
      )}
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
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

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ flex: "1 1 140px", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.875rem" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{label}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.25rem" }}>{sub}</div>}
    </div>
  );
}

export function AutonomousPlatformDashboardContent() {
  const [data, setData] = useState<UnifiedPlatformPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchUnifiedPlatform());
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل لوحة المنصة");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 90_000);
    return () => window.clearInterval(id);
  }, [load]);

  const handleRun = async () => {
    if (!confirm("تشغيل دورة موحدة (AKP + GKE Shadow)؟")) return;
    setRunning(true);
    try {
      await runUnifiedPlatformCycle("full");
      await load();
    } finally {
      setRunning(false);
    }
  };

  const handleRetry = async () => {
    setRunning(true);
    try {
      await retryUnifiedFailures();
      await load();
    } finally {
      setRunning(false);
    }
  };

  const handleActivate = async () => {
    if (!confirm("تشغيل Zero-Touch Activation (Migration + Seed + GKE Init)؟")) return;
    setRunning(true);
    try {
      await runZeroTouchActivation();
      await load();
    } finally {
      setRunning(false);
    }
  };

  if (loading && !data) {
    return (
      <div>
        <Loading />
        <p style={{ textAlign: "center", color: C.inkSoft }}>جارٍ تحميل المنصة المؤتمتة…</p>
      </div>
    );
  }

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

  const imp = data.import_jobs;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1280px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, color: C.emeraldDeep }}>المنصة المؤتمتة — Autonomous Production</h1>
          <p style={{ margin: "0.35rem 0 0", color: C.inkSoft, fontSize: "0.875rem" }}>
            AKP v{data.platformVersion} · GKE v{data.gkeVersion} · {data.shadow_mode ? "Shadow Mode" : "Production"} ·{" "}
            {new Date(data.at).toLocaleString("ar")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" disabled={running} onClick={() => void handleRun()} style={{ padding: "0.45rem 0.9rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.375rem" }}>
            Run Now
          </button>
          <button type="button" disabled={running} onClick={() => void handleRetry()} style={{ padding: "0.45rem 0.9rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel }}>
            Retry Failed
          </button>
          <button type="button" disabled={running} onClick={() => void handleActivate()} style={{ padding: "0.45rem 0.9rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel }}>
            Zero-Touch Activate
          </button>
          <button type="button" onClick={() => void load()} style={{ padding: "0.45rem 0.9rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel }}>
            تحديث
          </button>
        </div>
      </div>

      {!data.operational && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
          <strong>المنصة غير جاهزة 100%</strong> — Health Score {data.healthScore}/{data.healthScoreTarget}
          {data.criticalSecretsMissing.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>أسرار حرجة ناقصة: {data.criticalSecretsMissing.join(", ")}</div>
          )}
          <div style={{ marginTop: "0.35rem", color: C.inkSoft }}>{data.note}</div>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ flex: "0 0 180px", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem" }}>
          <ScoreRing score={data.healthScore} target={data.healthScoreTarget} label="Health Score" />
        </div>
        <div style={{ flex: "1 1 400px", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <MetricCard label="مصادر GKE" value={imp.gke_trusted_sources} sub="مصادر موثوقة حقيقية" />
          <MetricCard label="مستورد اليوم" value={imp.imported_today} sub="Shadow Mode" />
          <MetricCard label="Review Queue" value={imp.review_queue} />
          <MetricCard label="منشور تلقائياً" value={imp.auto_published_today} sub={data.auto_publish_enabled ? "مفعّل" : "معطّل (Shadow)"} />
          <MetricCard label="فشل اليوم" value={imp.failed_today} />
          <MetricCard label="معدل التكرار" value={`${imp.duplicate_rate}%`} />
          <MetricCard label="متوسط الجودة" value={imp.quality_average || "—"} />
        </div>
      </div>

      {data.alerts.length > 0 && (
        <Section title="تنبيهات">
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {data.alerts.slice(0, 12).map((a, i) => (
              <div
                key={i}
                style={{
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.8125rem",
                  background: a.severity === "error" ? "#FEE2E2" : a.severity === "warning" ? "#FEF3C7" : "#EFF6FF",
                  border: `1px solid ${C.line}`,
                }}
              >
                <Badge ok={a.severity === "info"} label={a.severity} /> [{a.component}] {a.message}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="صحة الأنظمة الفرعية">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <Badge ok={data.akp.readinessPct >= 70} label={`AKP ${data.akp.readinessPct}%`} />
          <Badge ok={Boolean(data.gke.pipeline_ok)} label={`GKE Pipeline ${data.gke.pipeline_ok ? "✓" : "✗"}`} />
          <Badge ok={data.gke.tables.present >= 5} label={`GKE Tables ${data.gke.tables.present}/${data.gke.tables.expected}`} />
          <Badge ok={data.queue.status === "operational"} label={`Queue: ${data.queue.status}`} />
          <Badge ok={data.akp.security.cronAuthConfigured} label="Cron Auth" />
          <Badge ok={!data.shadow_mode} label={data.shadow_mode ? "Shadow Mode ON" : "Shadow OFF"} />
        </div>
      </Section>

      <Section title="Secrets">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem" }}>
          {data.secrets.map((s) => (
            <div key={s.key} style={{ padding: "0.65rem", background: s.present ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${C.line}`, borderRadius: "0.375rem", fontSize: "0.8125rem" }}>
              <code>{s.key}</code> {s.critical && <span style={{ color: "#991B1B" }}>*</span>}
              <div><Badge ok={s.present} label={s.present ? "موجود" : "مفقود"} /></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Cron Jobs">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.line}` }}>
                <th style={{ textAlign: "right", padding: "0.5rem" }}>المسار</th>
                <th style={{ textAlign: "right", padding: "0.5rem" }}>الجدولة</th>
                <th style={{ textAlign: "right", padding: "0.5rem" }}>آخر تشغيل</th>
              </tr>
            </thead>
            <tbody>
              {(data.crons?.crons || []).slice(0, 12).map((c) => (
                <tr key={c.path} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.5rem" }}><code style={{ fontSize: "0.75rem" }}>{c.path}</code></td>
                  <td style={{ padding: "0.5rem" }}>{c.schedule}</td>
                  <td style={{ padding: "0.5rem" }}>{c.lastRun ? new Date(c.lastRun).toLocaleString("ar") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {data.gke.acquisition?.best_sources && (
        <Section title="Source Health — أفضل المصادر">
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {data.gke.acquisition.best_sources.map((s: { slug: string; name: string; reputation_score: number }) => (
              <div key={s.slug} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", fontSize: "0.8125rem" }}>
                <span>{s.name}</span>
                <span>
                  ثقة: {s.reputation_score}
                  <button
                    type="button"
                    style={{ marginRight: "0.5rem", fontSize: "0.75rem" }}
                    onClick={() => void pauseGkeSource(s.slug, true).then(() => load())}
                  >
                    Pause
                  </button>
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="روابط سريعة">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.875rem" }}>
          <Link href="/admin/platform/health" style={{ color: C.emeraldDeep }}>AKP Health</Link>
          <Link href="/admin/data-acquisition" style={{ color: C.emeraldDeep }}>Data Acquisition</Link>
          <Link href="/admin/knowledge-engine" style={{ color: C.emeraldDeep }}>GKE Architecture</Link>
          <Link href="/admin/production-lockdown" style={{ color: C.emeraldDeep }}>Production Lockdown</Link>
          <Link href="/admin/sources" style={{ color: C.emeraldDeep }}>المصادر</Link>
          <Link href="/admin/review-center" style={{ color: C.emeraldDeep }}>Review Queue</Link>
        </div>
      </Section>

      <div style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: "1rem" }}>
        آخر نجاح: {data.lastSuccessfulRun ? new Date(data.lastSuccessfulRun).toLocaleString("ar") : "—"}
        {data.lastError && <> · آخر خطأ: {data.lastError}</>}
      </div>
    </div>
  );
}

export function AutonomousPlatformDashboardPage() {
  return (
    <AdminShell section="autonomous-ai">
      <AutonomousPlatformDashboardContent />
    </AdminShell>
  );
}

export default AutonomousPlatformDashboardPage;
