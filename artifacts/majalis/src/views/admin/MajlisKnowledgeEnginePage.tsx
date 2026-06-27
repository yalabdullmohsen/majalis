import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { getMkeDashboard, runMkeEngine } from "@/lib/majlis-knowledge-engine-api";
import { getTknDashboard, getTknSettings, updateTknQuotas } from "@/lib/trusted-knowledge-network-api";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminShell } from "@/views/admin/AdminShell";

type AkpStats = {
  platformVersion?: string;
  readinessPct?: number;
  counts?: {
    today?: { items?: number; mkeRuns?: number };
    sources?: number;
    queuePending?: number;
    queueFailed?: number;
    published?: number;
    rejected?: number;
    dlq?: number;
    reviewPending?: number;
  };
  pipelines?: Record<string, { label?: string; quota?: number; publishedToday?: number }>;
  productionVelocity?: { itemsToday?: number; pctOfQuota?: number };
  lastRun?: { started_at?: string; status?: string } | null;
  lastError?: { message?: string; created_at?: string } | null;
  services?: Record<string, { status?: string }>;
};

type MkeStats = {
  engineVersion?: string;
  health?: { score?: number; status?: string };
  intelligenceLayers?: Array<{ id: string; label: string }>;
  subsystems?: Record<string, unknown>;
  counts?: Record<string, number>;
  sourcesTotal?: number;
  platformsSupported?: number;
  drafts?: number;
  pendingReview?: number;
  publishedToday?: number;
  duplicates?: number;
  rejected?: number;
  vision?: { visionEnabled?: boolean; capabilities?: string[]; fallback?: string };
  instagram?: { configured?: boolean; manualAssistMode?: boolean };
  database?: { status?: string };
  search?: { status?: string; embeddings?: boolean };
  queue?: { pending?: number; failed?: number };
  extractionMetrics?: {
    visionAccuracy?: number | null;
    duplicateDetectionRate?: number | null;
    sheikhMatchRate?: number | null;
  };
  sourcesByType?: Record<string, number>;
};

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem", minWidth: "110px" }}>
      <div style={{ fontSize: "1.35rem", fontWeight: 700, color: color || C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.78rem", color: C.inkSoft, marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "0.2rem 0.5rem",
      borderRadius: "0.25rem",
      fontSize: "0.75rem",
      background: ok ? "#D1FAE5" : "#FEE2E2",
      color: ok ? C.emeraldDeep : "#991B1B",
    }}>
      {label}: {ok ? "✓" : "✗"}
    </span>
  );
}

function MajlisKnowledgeEngineContent() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [engineVersion, setEngineVersion] = useState("2.0.0");
  const [stats, setStats] = useState<MkeStats | null>(null);
  const [akp, setAkp] = useState<AkpStats | null>(null);
  const [tkn, setTkn] = useState<Record<string, unknown> | null>(null);
  const [quotas, setQuotas] = useState<Record<string, number>>({});
  const [quotasBusy, setQuotasBusy] = useState(false);
  const [quotasSaved, setQuotasSaved] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<Array<{ type: string; adapter: string }>>([]);
  const [intelligenceLayers, setIntelligenceLayers] = useState<Array<{ id: string; label: string }>>([]);
  const [pipelineStages, setPipelineStages] = useState<Array<{ id: string; label: string }>>([]);
  const [runResult, setRunResult] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getMkeDashboard().then((r) => {
        setEngineVersion(r.engineVersion || "2.0.0");
        setStats((r.stats as MkeStats) || null);
        setAkp((r.akp as AkpStats) || null);
        setPlatforms(r.platforms || []);
        setIntelligenceLayers(r.intelligenceLayers || []);
        setPipelineStages(r.pipelineStages || []);
      }).catch(() => setStats(null)),
      getTknDashboard().then((r) => setTkn((r.dashboard as Record<string, unknown>) || null)).catch(() => setTkn(null)),
      getTknSettings().then((r) => {
        const daily = (r.settings as { dailyQuotas?: Record<string, number> })?.dailyQuotas;
        if (daily) setQuotas(daily);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const r = await runMkeEngine("full");
      setRunResult(r.ok
        ? `✓ ${r.published ?? 0} منشور · ${r.pendingReview ?? 0} مراجعة · ${r.duplicates ?? 0} مكرر`
        : `✗ ${r.error || "فشل"}`);
      load();
    } catch {
      setRunResult("✗ خطأ في التشغيل");
    } finally {
      setRunning(false);
    }
  };

  const handleSaveQuotas = async () => {
    setQuotasBusy(true);
    setQuotasSaved(null);
    try {
      const r = await updateTknQuotas(quotas);
      setQuotasSaved(r.ok ? "✓ تم حفظ الحصص اليومية" : `✗ ${r.error || "فشل الحفظ"}`);
      load();
    } catch {
      setQuotasSaved("✗ خطأ في الحفظ");
    } finally {
      setQuotasBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>
            Majlis Autonomous Platform v{engineVersion}
          </h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            نظام تشغيل ذاتي 24/7 — اكتشاف · جودة · قرار · نشر · شفاء · تعلم
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8125rem", alignItems: "center" }}>
          <Link href="/admin/automation/dashboard" style={{ color: C.emeraldDeep }}>Phase 5</Link>
          <Link href="/admin/automation/center" style={{ color: C.emeraldDeep }}>Phase 6</Link>
          <Link href="/admin/sources" style={{ color: C.emeraldDeep }}>المصادر</Link>
          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            style={{
              padding: "0.4rem 0.75rem",
              background: C.emeraldDeep,
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
              cursor: running ? "wait" : "pointer",
              fontSize: "0.8125rem",
            }}
          >
            {running ? "جاري التشغيل…" : "تشغيل المحرك"}
          </button>
        </div>
      </div>

      {runResult && (
        <p style={{ fontSize: "0.8125rem", marginBottom: "1rem", color: C.inkSoft }}>{runResult}</p>
      )}

      {loading ? <Loading /> : (
        <>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <StatCard label="صحة النظام" value={stats?.health?.score ?? "—"} color={stats?.health?.status === "healthy" ? C.emeraldDeep : "#92400E"} />
            <StatCard label="المصادر" value={stats?.counts?.sources ?? stats?.subsystems?.sources ? (stats.subsystems as { sources?: { total?: number } }).sources?.total ?? stats?.sourcesTotal ?? 0 : stats?.sourcesTotal ?? 0} />
            <StatCard label="المنصات" value={stats?.platformsSupported ?? platforms.length} />
            <StatCard label="مسودات" value={stats?.counts?.drafts ?? stats?.drafts ?? 0} />
            <StatCard label="بانتظار المراجعة" value={stats?.counts?.pendingReview ?? stats?.pendingReview ?? 0} color="#92400E" />
            <StatCard label="منشور اليوم" value={stats?.counts?.publishedToday ?? stats?.publishedToday ?? 0} />
            <StatCard label="Queue" value={stats?.subsystems?.queue ? (stats.subsystems.queue as { pending?: number }).pending ?? 0 : stats?.queue?.pending ?? 0} />
            <StatCard label="Self-Heal" value={stats?.counts?.self_heal_log ?? "—"} />
            {akp && (
              <>
                <StatCard label="AKP جاهزية %" value={akp.readinessPct ?? "—"} />
                <StatCard label="منشور AKP اليوم" value={akp.counts?.published ?? akp.productionVelocity?.itemsToday ?? 0} />
                <StatCard label="DLQ" value={akp.counts?.dlq ?? 0} color="#991B1B" />
                <StatCard label="مراجعة AKP" value={akp.counts?.reviewPending ?? 0} color="#92400E" />
              </>
            )}
          </div>

          {tkn && (
            <section style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>Trusted Knowledge Network (Phase 5)</h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                <StatCard label="مستورد اليوم" value={(tkn.today as { imported?: number })?.imported ?? 0} />
                <StatCard label="منشور" value={(tkn.today as { published?: number })?.published ?? 0} />
                <StatCard label="مرفوض" value={(tkn.today as { rejected?: number })?.rejected ?? 0} color="#991B1B" />
                <StatCard label="Retry Queue" value={(tkn.queue as { retry?: number })?.retry ?? 0} />
                <StatCard label="Review Queue" value={(tkn.queue as { review?: number })?.review ?? 0} color="#92400E" />
                <StatCard label="Dead Letter" value={(tkn.queue as { deadLetter?: number })?.deadLetter ?? 0} color="#991B1B" />
                <StatCard label="متوسط الاستيراد (ms)" value={(tkn.performance as { avgImportMs?: number })?.avgImportMs ?? "—"} />
                {(tkn.sources as { best?: { name?: string } })?.best && (
                  <StatCard label="أفضل مصدر" value={(tkn.sources as { best?: { name?: string } }).best?.name?.slice(0, 12) ?? "—"} />
                )}
                {(tkn.sources as { worst?: { name?: string } })?.worst && (
                  <StatCard label="أسوأ مصدر" value={(tkn.sources as { worst?: { name?: string } }).worst?.name?.slice(0, 12) ?? "—"} color="#991B1B" />
                )}
              </div>
              {Object.keys(quotas).length > 0 && (
                <div style={{ marginTop: "1rem", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem" }}>
                  <h4 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "0.875rem" }}>الحصص اليومية (قابلة للتعديل)</h4>
                  <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                    {Object.entries(quotas).map(([key, val]) => (
                      <label key={key} style={{ fontSize: "0.8125rem" }}>
                        {key}
                        <input
                          type="number"
                          min={0}
                          value={val}
                          onChange={(e) => setQuotas({ ...quotas, [key]: Number(e.target.value) || 0 })}
                          style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.4rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, fontFamily: "inherit" }}
                        />
                      </label>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.75rem" }}>
                    <button
                      type="button"
                      disabled={quotasBusy}
                      onClick={handleSaveQuotas}
                      style={{ padding: "0.4rem 0.75rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: quotasBusy ? "wait" : "pointer", fontSize: "0.8125rem" }}
                    >
                      {quotasBusy ? "جاري الحفظ…" : "حفظ الحصص"}
                    </button>
                    {quotasSaved && <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>{quotasSaved}</span>}
                  </div>
                </div>
              )}
            </section>
          )}

          {akp?.pipelines && (
            <section style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>خطوط الإنتاج (Phase 2)</h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {Object.entries(akp.pipelines).map(([key, p]) => (
                  <StatCard
                    key={key}
                    label={`${p.label || key} (${p.publishedToday ?? 0}/${p.quota ?? "—"})`}
                    value={p.publishedToday ?? 0}
                  />
                ))}
              </div>
              {akp.lastRun && (
                <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.5rem" }}>
                  آخر Run: {akp.lastRun.status} — {akp.lastRun.started_at ? new Date(akp.lastRun.started_at).toLocaleString("ar-KW") : "—"}
                </p>
              )}
              {akp.lastError && (
                <p style={{ fontSize: "0.75rem", color: "#991B1B", marginTop: "0.25rem" }}>
                  آخر خطأ: {akp.lastError.message}
                </p>
              )}
            </section>
          )}

          {intelligenceLayers.length > 0 && (
            <section style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>Intelligence Layers ({intelligenceLayers.length})</h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {intelligenceLayers.map((l) => (
                  <span key={l.id} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", background: C.parchmentDeep, borderRadius: "0.25rem" }}>
                    {l.label}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>حالة الخدمات</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              <StatusBadge ok={stats?.vision?.visionEnabled ?? false} label="Vision AI" />
              <StatusBadge ok={(stats?.subsystems?.vision as { visionEnabled?: boolean })?.visionEnabled ?? stats?.vision?.visionEnabled ?? false} label="Vision v2" />
              <StatusBadge ok={stats?.database?.status === "connected"} label="Database" />
              <StatusBadge ok={stats?.search?.embeddings ?? stats?.search?.status === "embeddings_ready"} label="Semantic Search" />
              <StatusBadge ok={Boolean(stats?.subsystems?.notifications)} label="Notifications" />
            </div>
          </section>

          {stats?.extractionMetrics && (
            <section style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>دقة الاستخراج</h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <StatCard label="Vision AI %" value={stats.extractionMetrics.visionAccuracy ?? "—"} />
                <StatCard label="كشف التكرار %" value={stats.extractionMetrics.duplicateDetectionRate ?? "—"} />
                <StatCard label="ربط الشيوخ %" value={stats.extractionMetrics.sheikhMatchRate ?? "—"} />
              </div>
            </section>
          )}

          <section style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>Pipeline ({pipelineStages.length} مراحل)</h3>
            <p style={{ fontSize: "0.75rem", color: C.inkSoft }}>
              {pipelineStages.map((s) => s.label).join(" → ")}
            </p>
          </section>

          <section style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>المنصات المدعومة ({platforms.length})</h3>
            <p style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.6 }}>
              {platforms.slice(0, 30).map((p) => p.type).join(" · ")}
              {platforms.length > 30 ? " …" : ""}
            </p>
          </section>

          {stats?.sourcesByType && Object.keys(stats.sourcesByType).length > 0 && (
            <section>
              <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>المصادر حسب النوع</h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {Object.entries(stats.sourcesByType).map(([type, count]) => (
                  <span key={type} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: C.parchmentDeep, borderRadius: "0.25rem" }}>
                    {type}: {count}
                  </span>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default function MajlisKnowledgeEnginePage() {
  return (
    <AdminShell section="knowledge-engine" onSectionChange={() => {}}>
      <MajlisKnowledgeEngineContent />
    </AdminShell>
  );
}

export { MajlisKnowledgeEngineContent };
