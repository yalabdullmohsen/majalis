import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";

const API_BASE = "/api/admin/autonomous-platform";

async function apiFetch(action: string, opts?: RequestInit) {
  const url = `${API_BASE}?action=${action}`;
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(action: string, body: object) {
  return apiFetch(action, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

type Dashboard = {
  platformVersion?: string;
  date?: string;
  health?: { score?: number; database?: string; mke?: string; automation?: string };
  counts?: {
    today?: { items?: number; mkeRuns?: number; decisions?: number };
    sources?: number;
    sourcesHealthy?: number;
    sourcesDead?: number;
    queuePending?: number;
    queueFailed?: number;
    retryQueue?: number;
    retryPending?: number;
    rejected?: number;
    published?: number;
    duplicates?: number;
    dlq?: number;
    reviewPending?: number;
    alerts?: number;
  };
  pipelines?: Record<string, { label?: string; quota?: number; quotaPeriod?: string; publishedToday?: number }>;
  sourceStatuses?: Array<{ slug: string; name: string; status: string; latencyMs?: number; lastError?: string; lastFetch?: string }>;
  pipelineRuns?: Array<{ id: string; pipeline: string; status: string; produced?: number; published?: number; duration_ms?: number; started_at?: string }>;
  productionVelocity?: { itemsToday?: number; quotaTotal?: number; pctOfQuota?: number };
  readinessPct?: number;
  lastRun?: { started_at?: string; duration_ms?: number } | null;
  lastError?: { message?: string; created_at?: string } | null;
  cronSchedules?: Record<string, { schedule?: string }>;
};

function Score({ value, label }: { value?: number; label: string }) {
  const v = value ?? 0;
  const color = v >= 80 ? "#065F46" : v >= 50 ? "#92400E" : "#991B1B";
  return (
    <div style={{ textAlign: "center", padding: "0.75rem 1rem", border: `1px solid ${C.line}`, borderRadius: "0.5rem", minWidth: "90px" }}>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, color }}>{v}</div>
      <div style={{ fontSize: "0.7rem", color: C.inkSoft, marginTop: "0.2rem" }}>{label}</div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.75rem 1rem", minWidth: "100px" }}>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: color || C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: C.inkSoft, marginTop: "0.15rem" }}>{label}</div>
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: "0.5rem", overflow: "hidden", marginBottom: "1rem" }}>
      <div style={{ background: C.parchmentDeep, padding: "0.5rem 0.875rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: "0.8125rem", color: C.emeraldDeep }}>{title}</strong>
        {action}
      </div>
      <div style={{ padding: "0.75rem 0.875rem" }}>{children}</div>
    </div>
  );
}

function statusColor(s: string) {
  if (s === "available") return "#065F46";
  if (s === "slow") return "#92400E";
  if (s === "dead" || s === "blocked") return "#991B1B";
  if (s === "unauthorized") return "#7C3AED";
  return C.inkSoft;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", background: statusColor(status) + "22", color: statusColor(status), fontWeight: 600 }}>
      {status}
    </span>
  );
}

function fmtMs(ms?: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtDt(iso?: string | null) {
  if (!iso) return "—";
  try { return new Intl.DateTimeFormat("ar-KW", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso)); }
  catch { return iso.slice(0, 16); }
}

function RunBtn({ label, busy, onClick }: { label: string; busy?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      style={{
        padding: "0.35rem 0.65rem",
        background: busy ? C.line : C.emeraldDeep,
        color: "#fff",
        border: "none",
        borderRadius: "0.375rem",
        cursor: busy ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        fontSize: "0.8rem",
        fontWeight: 600,
      }}
    >
      {busy ? "جاري..." : label}
    </button>
  );
}

type ReviewItem = { id: string; content_type: string; source_slug?: string; status: string; created_at: string; payload?: { title?: string; text?: string } };
type AlertItem = { id: string; severity: string; component: string; title: string; message?: string; created_at: string };

function AutonomousPlatformContent() {
  const { showError } = useAdminShell();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "sources" | "review" | "logs">("overview");

  const loadDashboard = useCallback(async () => {
    try {
      const data = await apiFetch("dashboard");
      setDashboard(data);
    } catch { setDashboard(null); }
  }, []);

  const loadReview = useCallback(async () => {
    try {
      const data = await apiFetch("review-queue");
      setReviewItems(data.items || []);
    } catch { setReviewItems([]); }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await apiFetch("alerts");
      setAlerts(data.alerts || []);
    } catch { setAlerts([]); }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([loadDashboard(), loadReview(), loadAlerts()]).finally(() => setLoading(false));
  }, [loadDashboard, loadReview, loadAlerts]);

  useEffect(() => { refresh(); }, [refresh]);

  const run = async (mode: string) => {
    setBusy(mode);
    try {
      await apiPost("run", { mode });
      refresh();
    } finally { setBusy(null); }
  };

  const resolveAlert = async (id: string) => {
    try {
      await apiFetch(`resolve-alert&id=${id}`);
      loadAlerts();
    } catch {
      showError("تعذر حل التنبيه.");
    }
  };

  const reviewDecide = async (id: string, decision: string) => {
    try {
      await apiPost("review-decide", { id, decision });
      loadReview();
    } catch {
      showError("تعذر تنفيذ القرار.");
    }
  };

  const counts = dashboard?.counts;
  const health = dashboard?.health;
  const velocity = dashboard?.productionVelocity;

  const TABS = [
    { key: "overview", label: "نظرة عامة" },
    { key: "sources", label: "المصادر" },
    { key: "review", label: `المراجعة (${reviewItems.length})` },
    { key: "logs", label: `التنبيهات (${alerts.length})` },
  ] as const;

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: "0 0 0.3rem", color: C.emeraldDeep, fontSize: "1.1rem" }}>
            منصة المعرفة الذاتية — v{dashboard?.platformVersion || "2.0"}
          </h2>
          <p style={{ margin: 0, fontSize: "0.78rem", color: C.inkSoft }}>
            {dashboard?.date} · تعمل 24/7 · {counts?.sources || 0} مصدر · {Object.keys(dashboard?.pipelines || {}).length} خط إنتاج
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <RunBtn label="تشغيل كامل" busy={busy === "full"} onClick={() => run("full")} />
          <RunBtn label="جلب" busy={busy === "fetch"} onClick={() => run("fetch")} />
          <RunBtn label="تحقق" busy={busy === "validate"} onClick={() => run("validate")} />
          <RunBtn label="مراقبة" busy={busy === "monitor"} onClick={() => run("monitor")} />
          <RunBtn label="استرداد" busy={busy === "recovery"} onClick={() => run("recovery")} />
          <button
            type="button"
            onClick={refresh}
            style={{ padding: "0.35rem 0.65rem", background: "transparent", border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit" }}
          >
            تحديث
          </button>
        </div>
      </div>

      {/* Health Scores */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <Score value={health?.score} label="صحة المنصة" />
        <Score value={dashboard?.readinessPct} label="جاهزية الإنتاج" />
        <Score value={velocity?.pctOfQuota} label="% الحصة اليومية" />
      </div>

      {/* Key Stats */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <Stat label="نشر اليوم" value={counts?.published ?? 0} color="#065F46" />
        <Stat label="مصادر نشطة" value={`${counts?.sourcesHealthy ?? 0}/${counts?.sources ?? 0}`} />
        <Stat label="مصادر معطلة" value={counts?.sourcesDead ?? 0} color={(counts?.sourcesDead ?? 0) > 0 ? "#991B1B" : undefined} />
        <Stat label="قيد المراجعة" value={counts?.reviewPending ?? 0} color={(counts?.reviewPending ?? 0) > 0 ? "#92400E" : undefined} />
        <Stat label="DLQ" value={counts?.dlq ?? 0} color={(counts?.dlq ?? 0) > 0 ? "#991B1B" : undefined} />
        <Stat label="تنبيهات مفتوحة" value={counts?.alerts ?? 0} color={(counts?.alerts ?? 0) > 0 ? "#92400E" : undefined} />
        <Stat label="مكررات اليوم" value={counts?.duplicates ?? 0} />
        <Stat label="قائمة الانتظار" value={counts?.queuePending ?? 0} />
        <Stat label="إعادة المحاولة" value={counts?.retryPending ?? 0} />
        <Stat label="قرارات MKE" value={counts?.today?.decisions ?? 0} />
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", marginBottom: "1rem", padding: "0.5rem 0.75rem", background: C.parchmentDeep, borderRadius: "0.375rem", flexWrap: "wrap" }}>
        <span>قاعدة البيانات: <strong style={{ color: health?.database === "connected" ? "#065F46" : "#991B1B" }}>{health?.database || "—"}</strong></span>
        <span>MKE: <strong>{health?.mke || "—"}</strong></span>
        <span>أتمتة: <strong>{health?.automation || "—"}</strong></span>
        <span>آخر تشغيل: <strong>{fmtDt(dashboard?.lastRun?.started_at)}</strong></span>
        <span>مدة: <strong>{fmtMs(dashboard?.lastRun?.duration_ms)}</strong></span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", borderBottom: `1px solid ${C.line}`, marginBottom: "1rem" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: "0.4rem 0.75rem",
              background: tab === t.key ? C.emeraldDeep : "transparent",
              color: tab === t.key ? "#fff" : C.inkSoft,
              border: "none",
              borderRadius: "0.375rem 0.375rem 0 0",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.8125rem",
              fontWeight: tab === t.key ? 700 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <Loading />}

      {!loading && tab === "overview" && (
        <>
          {/* Pipeline Stats */}
          <Panel title="خطوط الإنتاج — إنجاز اليوم">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.6rem" }}>
              {Object.entries(dashboard?.pipelines || {}).map(([type, p]) => {
                const pct = p.quota ? Math.round(((p.publishedToday || 0) / p.quota) * 100) : 0;
                const color = pct >= 80 ? "#065F46" : pct >= 40 ? "#92400E" : C.inkSoft;
                return (
                  <div key={type} style={{ padding: "0.6rem 0.75rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem" }}>
                    <div style={{ fontSize: "0.72rem", color: C.inkSoft, marginBottom: "0.2rem" }}>{p.label || type}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color }}>
                      {p.publishedToday ?? 0} <span style={{ fontSize: "0.7rem", color: C.inkSoft }}>/ {p.quota ?? "—"}</span>
                    </div>
                    <div style={{ marginTop: "0.35rem", height: "4px", background: C.line, borderRadius: "2px" }}>
                      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: "2px" }} />
                    </div>
                    <div style={{ fontSize: "0.65rem", color, marginTop: "0.2rem" }}>{pct}%</div>
                    <div style={{ fontSize: "0.65rem", color: C.inkSoft }}>{p.quotaPeriod || "daily"}</div>
                    <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.3rem" }}>
                      <RunBtn label="تشغيل" busy={busy === type} onClick={() => run(type)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Recent Runs */}
          <Panel title="آخر تشغيلات Pipeline">
            {(dashboard?.pipelineRuns || []).length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: C.inkSoft }}>لا سجلات بعد — شغّل المنصة أولاً.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.3rem" }}>
                {(dashboard?.pipelineRuns || []).slice(0, 10).map((r) => (
                  <div key={r.id} style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", background: C.parchmentDeep, borderRadius: "0.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <strong style={{ minWidth: "80px" }}>{r.pipeline}</strong>
                    <StatusBadge status={r.status} />
                    <span>إنتاج: {r.produced ?? 0}</span>
                    <span>نشر: {r.published ?? 0}</span>
                    <span>{fmtMs(r.duration_ms)}</span>
                    <span style={{ color: C.inkSoft }}>{fmtDt(r.started_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Cron Schedules */}
          <Panel title="جدول Cron">
            <div style={{ display: "grid", gap: "0.25rem" }}>
              {Object.entries(dashboard?.cronSchedules || {}).map(([mode, cfg]) => (
                <div key={mode} style={{ fontSize: "0.75rem", display: "flex", justifyContent: "space-between", padding: "0.25rem 0", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontFamily: "monospace" }}>{mode}</span>
                  <span style={{ color: C.inkSoft, fontFamily: "monospace" }}>{cfg.schedule}</span>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {!loading && tab === "sources" && (
        <Panel title="حالة المصادر">
          {(dashboard?.sourceStatuses || []).length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: C.inkSoft }}>لا مصادر — شغّل bootstrap أولاً.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.4rem" }}>
              {(dashboard?.sourceStatuses || []).map((s) => (
                <div key={s.slug} style={{ padding: "0.5rem 0.75rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.8125rem" }}>{s.name || s.slug}</strong>
                    <StatusBadge status={s.status} />
                    {s.latencyMs && <span style={{ fontSize: "0.7rem", color: C.inkSoft }}>⏱ {fmtMs(s.latencyMs)}</span>}
                    {s.lastFetch && <span style={{ fontSize: "0.7rem", color: C.inkSoft }}>آخر جلب: {fmtDt(s.lastFetch)}</span>}
                  </div>
                  {s.lastError && <div style={{ fontSize: "0.7rem", color: "#991B1B", marginTop: "0.2rem" }}>{s.lastError}</div>}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: "0.75rem" }}>
            <RunBtn label="فحص صحة المصادر" busy={busy === "monitor"} onClick={() => run("monitor")} />
          </div>
        </Panel>
      )}

      {!loading && tab === "review" && (
        <Panel
          title="طابور المراجعة الشرعية"
          action={<RunBtn label="تحديث" busy={false} onClick={loadReview} />}
        >
          {reviewItems.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: C.inkSoft }}>لا عناصر قيد المراجعة — المنصة تعمل بسلاسة.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {reviewItems.map((item) => (
                <div key={item.id} style={{ padding: "0.6rem 0.75rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                    <StatusBadge status={item.content_type} />
                    {item.source_slug && <span style={{ fontSize: "0.7rem", color: C.inkSoft }}>{item.source_slug}</span>}
                    <span style={{ fontSize: "0.7rem", color: C.inkSoft, marginRight: "auto" }}>{fmtDt(item.created_at)}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", marginBottom: "0.5rem", color: C.ink }}>
                    {item.payload?.title || item.payload?.text?.slice(0, 120) || "(لا عنوان)"}
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      type="button"
                      onClick={() => reviewDecide(item.id, "approved")}
                      style={{ padding: "0.25rem 0.6rem", background: "#065F46", color: "#fff", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}
                    >
                      قبول
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewDecide(item.id, "rejected")}
                      style={{ padding: "0.25rem 0.6rem", background: "#991B1B", color: "#fff", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}
                    >
                      رفض
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewDecide(item.id, "duplicate")}
                      style={{ padding: "0.25rem 0.6rem", background: C.line, color: C.ink, border: "none", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}
                    >
                      مكرر
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {!loading && tab === "logs" && (
        <Panel
          title="التنبيهات النشطة"
          action={<RunBtn label="تحديث" busy={false} onClick={loadAlerts} />}
        >
          {alerts.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "#065F46" }}>لا تنبيهات — كل شيء يعمل بشكل طبيعي.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {alerts.map((alert) => {
                const sevColor = alert.severity === "critical" ? "#991B1B" : alert.severity === "error" ? "#DC2626" : alert.severity === "warning" ? "#92400E" : C.emeraldDeep;
                return (
                  <div key={alert.id} style={{ padding: "0.6rem 0.75rem", border: `1px solid ${sevColor}44`, borderRadius: "0.375rem", background: `${sevColor}08` }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", background: sevColor + "22", color: sevColor, fontWeight: 700 }}>
                        {alert.severity}
                      </span>
                      <strong style={{ fontSize: "0.8rem" }}>{alert.title}</strong>
                      <span style={{ fontSize: "0.7rem", color: C.inkSoft, marginRight: "auto" }}>{alert.component}</span>
                    </div>
                    {alert.message && <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginBottom: "0.35rem" }}>{alert.message}</div>}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.65rem", color: C.inkSoft }}>{fmtDt(alert.created_at)}</span>
                      <button
                        type="button"
                        onClick={() => resolveAlert(alert.id)}
                        style={{ padding: "0.2rem 0.5rem", background: "transparent", border: `1px solid ${C.line}`, borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.7rem", fontFamily: "inherit" }}
                      >
                        تم الحل
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {/* Last Error */}
      {dashboard?.lastError && (
        <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", background: "#991B1B11", border: "1px solid #991B1B44", borderRadius: "0.375rem", fontSize: "0.75rem" }}>
          <strong style={{ color: "#991B1B" }}>آخر خطأ:</strong> {dashboard.lastError.message || JSON.stringify(dashboard.lastError).slice(0, 120)} · {fmtDt(dashboard.lastError.created_at)}
        </div>
      )}
    </div>
  );
}

export default function AutonomousPlatformPage() {
  return (
    <AdminShell section="knowledge-engine" onSectionChange={() => {}}>
      <AutonomousPlatformContent />
    </AdminShell>
  );
}
