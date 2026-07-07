import { useCallback, useEffect, useState } from "react";
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

function scoreColor(v: number) {
  return v >= 80 ? "#065F46" : v >= 50 ? "#0E6E52" : "#991B1B";
}

function Score({ value, label }: { value?: number; label: string }) {
  const v = value ?? 0;
  return (
    <div className="aup-score">
      <div className="aup-score__val" style={{ "--aup-sv-color": scoreColor(v) } as React.CSSProperties}>{v}</div>
      <div className="aup-score__label">{label}</div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="aup-stat">
      <div className="aup-stat__val" style={color ? { "--aup-stat-color": color } as React.CSSProperties : undefined}>{value}</div>
      <div className="aup-stat__label">{label}</div>
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="aup-panel">
      <div className="aup-panel-head">
        <strong className="aup-panel-title">{title}</strong>
        {action}
      </div>
      <div className="aup-panel-body">{children}</div>
    </div>
  );
}

function statusColor(s: string) {
  if (s === "available") return "#065F46";
  if (s === "slow") return "#0E6E52";
  if (s === "dead" || s === "blocked") return "#991B1B";
  if (s === "unauthorized") return "#7C3AED";
  return "var(--majalis-ink-soft)";
}

function StatusBadge({ status }: { status: string }) {
  const c = statusColor(status);
  return (
    <span
      className="aup-sb"
      style={{ "--aup-sb-bg": c + "22", "--aup-sb-color": c } as React.CSSProperties}
    >
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
      className="aup-run-btn"
      style={busy ? { "--aup-rb-bg": "var(--majalis-line)" } as React.CSSProperties : undefined}
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
    <div className="aup-wrapper">
      <div className="aup-header">
        <div>
          <h2 className="aup-title">
            منصة المعرفة الذاتية — v{dashboard?.platformVersion || "2.0"}
          </h2>
          <p className="aup-subtitle">
            {dashboard?.date} · تعمل 24/7 · {counts?.sources || 0} مصدر · {Object.keys(dashboard?.pipelines || {}).length} خط إنتاج
          </p>
        </div>
        <div className="aup-actions">
          <RunBtn label="تشغيل كامل" busy={busy === "full"} onClick={() => run("full")} />
          <RunBtn label="جلب" busy={busy === "fetch"} onClick={() => run("fetch")} />
          <RunBtn label="تحقق" busy={busy === "validate"} onClick={() => run("validate")} />
          <RunBtn label="مراقبة" busy={busy === "monitor"} onClick={() => run("monitor")} />
          <RunBtn label="استرداد" busy={busy === "recovery"} onClick={() => run("recovery")} />
          <button type="button" onClick={refresh} className="aup-refresh-btn">تحديث</button>
        </div>
      </div>

      <div className="aup-scores-row">
        <Score value={health?.score} label="صحة المنصة" />
        <Score value={dashboard?.readinessPct} label="جاهزية الإنتاج" />
        <Score value={velocity?.pctOfQuota} label="% الحصة اليومية" />
      </div>

      <div className="aup-stats-row">
        <Stat label="نشر اليوم" value={counts?.published ?? 0} color="#065F46" />
        <Stat label="مصادر نشطة" value={`${counts?.sourcesHealthy ?? 0}/${counts?.sources ?? 0}`} />
        <Stat label="مصادر معطلة" value={counts?.sourcesDead ?? 0} color={(counts?.sourcesDead ?? 0) > 0 ? "#991B1B" : undefined} />
        <Stat label="قيد المراجعة" value={counts?.reviewPending ?? 0} color={(counts?.reviewPending ?? 0) > 0 ? "#0E6E52" : undefined} />
        <Stat label="DLQ" value={counts?.dlq ?? 0} color={(counts?.dlq ?? 0) > 0 ? "#991B1B" : undefined} />
        <Stat label="تنبيهات مفتوحة" value={counts?.alerts ?? 0} color={(counts?.alerts ?? 0) > 0 ? "#0E6E52" : undefined} />
        <Stat label="مكررات اليوم" value={counts?.duplicates ?? 0} />
        <Stat label="قائمة الانتظار" value={counts?.queuePending ?? 0} />
        <Stat label="إعادة المحاولة" value={counts?.retryPending ?? 0} />
        <Stat label="قرارات MKE" value={counts?.today?.decisions ?? 0} />
      </div>

      <div className="aup-status-bar">
        <span>قاعدة البيانات: <strong style={{ color: health?.database === "connected" ? "#065F46" : "#991B1B" }}>{health?.database || "—"}</strong></span>
        <span>MKE: <strong>{health?.mke || "—"}</strong></span>
        <span>أتمتة: <strong>{health?.automation || "—"}</strong></span>
        <span>آخر تشغيل: <strong>{fmtDt(dashboard?.lastRun?.started_at)}</strong></span>
        <span>مدة: <strong>{fmtMs(dashboard?.lastRun?.duration_ms)}</strong></span>
      </div>

      <div className="aup-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="aup-tab"
            style={{
              "--aup-tab-bg": tab === t.key ? "var(--majalis-emerald-deep)" : "transparent",
              "--aup-tab-color": tab === t.key ? "#fff" : "var(--majalis-ink-soft)",
              "--aup-tab-fw": tab === t.key ? "700" : "400",
            } as React.CSSProperties}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <Loading />}

      {!loading && tab === "overview" && (
        <>
          <Panel title="خطوط الإنتاج — إنجاز اليوم">
            <div className="aup-pipeline-grid">
              {Object.entries(dashboard?.pipelines || {}).map(([type, p]) => {
                const pct = p.quota ? Math.round(((p.publishedToday || 0) / p.quota) * 100) : 0;
                const color = pct >= 80 ? "#065F46" : pct >= 40 ? "#0E6E52" : "var(--majalis-ink-soft)";
                return (
                  <div key={type} className="aup-pipeline-card">
                    <div className="aup-pipeline-name">{p.label || type}</div>
                    <div className="aup-pipeline-count" style={{ "--aup-pc-color": color } as React.CSSProperties}>
                      {p.publishedToday ?? 0} <span className="aup-pipeline-sub">/ {p.quota ?? "—"}</span>
                    </div>
                    <div className="aup-pipeline-bar">
                      <div className="aup-pipeline-fill" style={{ "--aup-pf-w": `${Math.min(100, pct)}%`, "--aup-pf-color": color } as React.CSSProperties} />
                    </div>
                    <div style={{ fontSize: "0.65rem", color, marginTop: "0.2rem" }}>{pct}%</div>
                    <div className="aup-pipeline-sub">{p.quotaPeriod || "daily"}</div>
                    <div style={{ marginTop: "0.4rem" }}>
                      <RunBtn label="تشغيل" busy={busy === type} onClick={() => run(type)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="آخر تشغيلات Pipeline">
            {(dashboard?.pipelineRuns || []).length === 0 ? (
              <p className="aup-empty">لا سجلات بعد — شغّل المنصة أولاً.</p>
            ) : (
              <div className="aup-runs-grid">
                {(dashboard?.pipelineRuns || []).slice(0, 10).map((r) => (
                  <div key={r.id} className="aup-run-row">
                    <strong className="aup-run-name">{r.pipeline}</strong>
                    <StatusBadge status={r.status} />
                    <span>إنتاج: {r.produced ?? 0}</span>
                    <span>نشر: {r.published ?? 0}</span>
                    <span>{fmtMs(r.duration_ms)}</span>
                    <span style={{ color: "var(--majalis-ink-soft)" }}>{fmtDt(r.started_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="جدول Cron">
            <div>
              {Object.entries(dashboard?.cronSchedules || {}).map(([mode, cfg]) => (
                <div key={mode} className="aup-cron-row">
                  <span className="aup-cron-key">{mode}</span>
                  <span className="aup-cron-val">{cfg.schedule}</span>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {!loading && tab === "sources" && (
        <Panel title="حالة المصادر">
          {(dashboard?.sourceStatuses || []).length === 0 ? (
            <p className="aup-empty">لا مصادر — شغّل bootstrap أولاً.</p>
          ) : (
            <div className="aup-sources-grid">
              {(dashboard?.sourceStatuses || []).map((s) => (
                <div key={s.slug} className="aup-source-card">
                  <div className="aup-source-row">
                    <strong className="aup-source-name">{s.name || s.slug}</strong>
                    <StatusBadge status={s.status} />
                    {s.latencyMs && <span className="aup-source-meta">⏱ {fmtMs(s.latencyMs)}</span>}
                    {s.lastFetch && <span className="aup-source-meta">آخر جلب: {fmtDt(s.lastFetch)}</span>}
                  </div>
                  {s.lastError && <div className="aup-source-err">{s.lastError}</div>}
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
            <p className="aup-empty">لا عناصر قيد المراجعة — المنصة تعمل بسلاسة.</p>
          ) : (
            <div className="aup-grid-gap">
              {reviewItems.map((item) => (
                <div key={item.id} className="aup-review-card">
                  <div className="aup-review-head">
                    <StatusBadge status={item.content_type} />
                    {item.source_slug && <span style={{ fontSize: "0.7rem", color: "var(--majalis-ink-soft)" }}>{item.source_slug}</span>}
                    <span className="aup-review-date">{fmtDt(item.created_at)}</span>
                  </div>
                  <div className="aup-review-text">
                    {item.payload?.title || item.payload?.text?.slice(0, 120) || "(لا عنوان)"}
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button type="button" onClick={() => reviewDecide(item.id, "approved")} className="aup-approve-btn">قبول</button>
                    <button type="button" onClick={() => reviewDecide(item.id, "rejected")} className="aup-reject-btn">رفض</button>
                    <button type="button" onClick={() => reviewDecide(item.id, "duplicate")} className="aup-dup-btn">مكرر</button>
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
            <p className="aup-ok">لا تنبيهات — كل شيء يعمل بشكل طبيعي.</p>
          ) : (
            <div className="aup-grid-gap">
              {alerts.map((alert) => {
                const sevColor = alert.severity === "critical" ? "#991B1B" : alert.severity === "error" ? "#DC2626" : alert.severity === "warning" ? "#0E6E52" : "var(--majalis-emerald-deep)";
                return (
                  <div
                    key={alert.id}
                    className="aup-alert-card"
                    style={{ "--aup-al-border": `${sevColor}44`, "--aup-al-bg": `${sevColor}08` } as React.CSSProperties}
                  >
                    <div className="aup-alert-head">
                      <span
                        className="aup-alert-sev"
                        style={{ "--aup-als-bg": sevColor + "22", "--aup-als-color": sevColor } as React.CSSProperties}
                      >
                        {alert.severity}
                      </span>
                      <strong className="aup-alert-title">{alert.title}</strong>
                      <span className="aup-alert-comp">{alert.component}</span>
                    </div>
                    {alert.message && <div className="aup-alert-msg">{alert.message}</div>}
                    <div className="aup-alert-foot">
                      <span className="aup-alert-time">{fmtDt(alert.created_at)}</span>
                      <button type="button" onClick={() => resolveAlert(alert.id)} className="aup-resolve-btn">تم الحل</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {dashboard?.lastError && (
        <div className="aup-last-error">
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
