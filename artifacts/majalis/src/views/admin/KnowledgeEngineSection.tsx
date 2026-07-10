import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { SkeletonCardGrid } from "@/components/ui-common";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  fetchAkeStats,
  fetchSystemHealth,
  runAkeEngineManual,
  runAkeHealthCheck,
  type AkeEngineStats,
  type SystemHealth,
} from "@/lib/knowledge-engine-service";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="ken-stat">
      <p className="ken-stat__label">{label}</p>
      <p className="ken-stat__value">{value}</p>
      {sub && <p className="ken-stat__sub">{sub}</p>}
    </div>
  );
}

const HEALTH_COLORS: Record<string, string> = {
  healthy: "var(--majalis-emerald-deep)",
  degraded: "#97A59F",
  down: "#991B1B",
  unknown: "var(--majalis-ink-soft)",
};

export function KnowledgeEngineSection() {
  const { showSuccess, showError } = useAdminShell();
  const [stats, setStats] = useState<AkeEngineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [usingLegacy, setUsingLegacy] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    if (firstLoad.current) setLoading(true);
    try {
      const [result, health] = await Promise.all([
        fetchAkeStats(7),
        fetchSystemHealth(),
      ]);
      setStats(result.stats);
      setUsingLegacy(Boolean(result.usingLegacy));
      setSystemHealth(health);
    } catch {
      showError("تعذر تحميل إحصائيات Auto Knowledge Engine.");
    } finally {
      setLoading(false);
      firstLoad.current = false;
    }
  }, [showError]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await runAkeEngineManual({ checkLinks: true });
      const ake = result.autoKnowledgeEngine || result;
      showSuccess(
        `اكتمل التشغيل: ${ake.processed ?? ake.analyzed ?? 0} معالجة، ${ake.published ?? 0} منشور، ${ake.review ?? 0} للمراجعة`,
      );
      await load();
    } catch {
      showError("فشل تشغيل Auto Knowledge Engine.");
    } finally {
      setRunning(false);
    }
  };

  const handleHealth = async () => {
    setCheckingHealth(true);
    try {
      const result = await runAkeHealthCheck();
      const healthy = (result.results || []).filter((r: { healthy?: boolean }) => r.healthy).length;
      showSuccess(`فحص الصحة: ${healthy}/${result.checked ?? 0} مصدر سليم`);
      await load();
    } catch {
      showError("فشل فحص صحة المصادر.");
    } finally {
      setCheckingHealth(false);
    }
  };

  return (
    <div>
      <div className="ken-header">
        <div>
          <h2 className="ken-title">Auto Knowledge Engine</h2>
          <p className="ken-subtitle">
            Connectors → Verify → AI → Quality Gate → Auto-Publish → SEO → Index
            · Cron كل 6 ساعات · Health كل ساعة
          </p>
        </div>
        <div className="ken-btn-group">
          <button type="button" onClick={handleHealth} disabled={checkingHealth} className="ken-btn">
            {checkingHealth ? "جارٍ الفحص..." : "♥ فحص المصادر"}
          </button>
          <button type="button" onClick={handleRun} disabled={running} className="ken-btn ken-btn--primary">
            {running ? "جارٍ التشغيل..." : "▶ تشغيل كامل"}
          </button>
        </div>
      </div>

      {usingLegacy && (
        <div className="ken-legacy-warn">
          <AlertTriangle size={13} className="inline ml-1" />نفّذ migration: supabase/auto_knowledge_engine_v13.sql في Supabase SQL Editor.
        </div>
      )}

      {loading ? (
        <SkeletonCardGrid count={6} />
      ) : (
        <>
          <div className="ken-stats-grid">
            <StatCard label="آخر تشغيل (ث)" value={systemHealth?.metrics?.lastDurationMs ? Math.round(systemHealth.metrics.lastDurationMs / 1000) : "—"} />
            <StatCard label="مصادر نشطة" value={systemHealth?.metrics?.sourcesActive ?? stats?.connectors_active ?? 0} sub={`من ${systemHealth?.metrics?.sourcesTotal ?? stats?.connectors_total ?? 0}`} />
            <StatCard label="منشور" value={systemHealth?.metrics?.itemsPublished ?? 0} />
            <StatCard label="قيد المراجعة" value={systemHealth?.metrics?.itemsPending ?? stats?.items_review ?? 0} />
            <StatCard label="جديد اليوم" value={systemHealth?.metrics?.itemsNewToday ?? stats?.items_new_today ?? 0} />
            <StatCard label="منشور اليوم" value={systemHealth?.metrics?.itemsPublishedToday ?? stats?.items_published_today ?? 0} />
            <StatCard label="Supabase" value={systemHealth?.supabase?.status === "connected" ? "✓" : "✗"} />
            <StatCard label="Cron" value={systemHealth?.cron?.secretConfigured ? "✓" : "—"} />
            <StatCard label="AI" value={systemHealth?.ai?.status === "ready" ? "✓" : "fallback"} />
            <StatCard label="Queue" value={systemHealth?.queue?.pending ?? 0} sub={systemHealth?.queue?.status} />
          </div>

          {systemHealth?.errors && systemHealth.errors.length > 0 && (
            <div className="ken-errors-box">
              {systemHealth.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}

          <div className="ken-stats-grid">
            <StatCard label="مصادر سليمة" value={stats?.connectors_healthy ?? 0} />
            <StatCard label="جديد اليوم" value={stats?.items_new_today ?? 0} />
            <StatCard label="منشور اليوم" value={stats?.items_published_today ?? 0} />
            <StatCard label="قيد المراجعة" value={stats?.items_review ?? 0} />
            <StatCard label="مرفوض" value={stats?.items_rejected ?? 0} />
            <StatCard label="مكرر" value={stats?.items_duplicate ?? 0} />
            <StatCard label="مؤرشف" value={stats?.items_archived ?? 0} />
            <StatCard label="روابط مكسورة" value={stats?.broken_links ?? 0} />
            <StatCard label="جودة متوسطة" value={`${stats?.avg_quality ?? 0}%`} />
            <StatCard label="ثقة متوسطة" value={`${stats?.avg_trust ?? 0}%`} />
          </div>

          <div className="ken-panels-grid">
            <div className="ken-panel">
              <h3 className="ken-panel-h3">صحة Connectors</h3>
              {(stats?.connectors_health || []).length === 0 ? (
                <p className="ken-panel-empty">لا بيانات، شغّل Migration ثم Pipeline.</p>
              ) : (
                (stats?.connectors_health || []).map((c) => (
                  <div
                    key={c.slug}
                    className="ken-connector-row"
                  >
                    <span>{c.name}</span>
                    <span
                      className="ken-connector-status"
                      style={{ "--ken-status-color": HEALTH_COLORS[c.health_status] } as React.CSSProperties}
                    >
                      {c.health_status} · {c.items_published ?? 0} منشور
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="ken-panel">
              <h3 className="ken-panel-h3">آخر التشغيلات</h3>
              {(stats?.runs_recent || []).length === 0 ? (
                <p className="ken-panel-empty">لا تشغيلات مسجّلة.</p>
              ) : (
                (stats?.runs_recent as Array<Record<string, unknown>>).slice(0, 8).map((r) => (
                  <div key={String(r.id)} className="ken-run-row">
                    {String(r.status)}، {String(r.fetched_count ?? 0)} مجلبة، {String(r.published_count ?? 0)} منشورة
                    {r.duration_ms ? ` · ${Math.round(Number(r.duration_ms) / 1000)}ث` : ""}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="ken-policy-note">
            <strong>سياسة النشر التلقائي:</strong>{" "}
            المصادر الرسمية (ثقة ≥ 4) تجتاز Quality Gate تُنشر تلقائياً في القسم المناسب.
            AI يستخرج metadata فقط، لا يُنشئ فتاوى ولا أحاديث.
            <br />
            <strong>Crons:</strong> knowledge-sync + auto-knowledge-sync كل 6h · connector-health كل 1h · maintenance أسبوعي.
          </div>
        </>
      )}
    </div>
  );
}
