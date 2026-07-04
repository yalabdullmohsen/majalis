import { useCallback, useEffect, useRef, useState } from "react";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
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
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</p>
      {sub && <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: C.inkSoft }}>{sub}</p>}
    </div>
  );
}

const HEALTH_COLORS: Record<string, string> = {
  healthy: C.emeraldDeep,
  degraded: "#D97706",
  down: "#991B1B",
  unknown: C.inkSoft,
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>
            Auto Knowledge Engine
          </h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>
            Connectors → Verify → AI → Quality Gate → Auto-Publish → SEO → Index
            · Cron كل 6 ساعات · Health كل ساعة
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={handleHealth} disabled={checkingHealth} style={btnStyle(checkingHealth)}>
            {checkingHealth ? "جارٍ الفحص..." : "♥ فحص المصادر"}
          </button>
          <button type="button" onClick={handleRun} disabled={running} style={btnStyle(running, true)}>
            {running ? "جارٍ التشغيل..." : "▶ تشغيل كامل"}
          </button>
        </div>
      </div>

      {usingLegacy && (
        <div style={{ padding: "0.75rem 1rem", marginBottom: "1rem", borderRadius: "0.375rem", background: "#FEF3C7", border: "1px solid #F59E0B", fontSize: "0.8125rem", color: "#92400E" }}>
          ⚠️ نفّذ migration: supabase/auto_knowledge_engine_v13.sql في Supabase SQL Editor.
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
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
            <div style={{ padding: "0.75rem 1rem", marginBottom: "1rem", borderRadius: "0.375rem", background: "#FEE2E2", border: "1px solid #FCA5A5", fontSize: "0.8125rem", color: "#991B1B" }}>
              {systemHealth.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <div style={{ padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: "0.9375rem", fontWeight: 700, color: C.emeraldDeep }}>
                صحة Connectors
              </h3>
              {(stats?.connectors_health || []).length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا بيانات — شغّل Migration ثم Pipeline.</p>
              ) : (
                (stats?.connectors_health || []).map((c) => (
                  <div key={c.slug} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: `1px solid ${C.line}`, fontSize: "0.8125rem" }}>
                    <span>{c.name}</span>
                    <span style={{ color: HEALTH_COLORS[c.health_status] || C.inkSoft }}>
                      {c.health_status} · {c.items_published ?? 0} منشور
                    </span>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: "0.9375rem", fontWeight: 700, color: C.emeraldDeep }}>
                آخر التشغيلات
              </h3>
              {(stats?.runs_recent || []).length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا تشغيلات مسجّلة.</p>
              ) : (
                (stats?.runs_recent as Array<Record<string, unknown>>).slice(0, 8).map((r) => (
                  <div key={String(r.id)} style={{ fontSize: "0.75rem", color: C.inkSoft, padding: "0.25rem 0" }}>
                    {String(r.status)} — {String(r.fetched_count ?? 0)} مجلبة، {String(r.published_count ?? 0)} منشورة
                    {r.duration_ms ? ` · ${Math.round(Number(r.duration_ms) / 1000)}ث` : ""}
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginTop: "1.25rem", padding: "1rem", borderRadius: "0.375rem", background: C.parchmentDeep, fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.7 }}>
            <strong style={{ color: C.emeraldDeep }}>سياسة النشر التلقائي:</strong>{" "}
            المصادر الرسمية (ثقة ≥ 4) تجتاز Quality Gate تُنشر تلقائياً في القسم المناسب.
            AI يستخرج metadata فقط — لا يُنشئ فتاوى ولا أحاديث.
            <br />
            <strong style={{ color: C.emeraldDeep }}>Crons:</strong> knowledge-sync + auto-knowledge-sync كل 6h · connector-health كل 1h · maintenance أسبوعي.
          </div>
        </>
      )}
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
