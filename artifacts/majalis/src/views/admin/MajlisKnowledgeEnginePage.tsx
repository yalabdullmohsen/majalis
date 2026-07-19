import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { getMkeDashboard, runMkeEngine } from "@/lib/majlis-knowledge-engine-api";
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminShell } from "@/views/admin/AdminShell";

type AkpStats = {
  platformVersion?: string;
  readinessPct?: number;
  health?: { score?: number; database?: string };
  avgDurationMs?: number;
  retryQueue?: { total?: number; pending?: number };
  sourceStatuses?: Array<{ slug: string; name: string; status: string; lastError?: string }>;
  counts?: {
    today?: { items?: number; mkeRuns?: number };
    sources?: number;
    sourcesHealthy?: number;
    sourcesDead?: number;
    queuePending?: number;
    queueFailed?: number;
    retryQueue?: number;
    published?: number;
    rejected?: number;
    duplicates?: number;
    dlq?: number;
    reviewPending?: number;
    alerts?: number;
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
    <div className="mke-stat" style={color ? { "--mke-val-color": color } as React.CSSProperties : undefined}>
      <div className="mke-stat__value">{value}</div>
      <div className="mke-stat__label">{label}</div>
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="mke-service-badge"
      style={{
        "--mke-sb-bg": ok ? "#D1FAE5" : "#FEE2E2",
        "--mke-sb-color": ok ? "var(--majalis-emerald-deep)" : "#991B1B",
      } as React.CSSProperties}
    >
      {label}: {ok ? "\u2713" : "\u2717"}
    </span>
  );
}

function MajlisKnowledgeEngineContent() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [engineVersion, setEngineVersion] = useState("2.0.0");
  const [stats, setStats] = useState<MkeStats | null>(null);
  const [akp, setAkp] = useState<AkpStats | null>(null);
  const [platforms, setPlatforms] = useState<Array<{ type: string; adapter: string }>>([]);
  const [intelligenceLayers, setIntelligenceLayers] = useState<Array<{ id: string; label: string }>>([]);
  const [pipelineStages, setPipelineStages] = useState<Array<{ id: string; label: string }>>([]);
  const [runResult, setRunResult] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getMkeDashboard()
      .then((r) => {
        setEngineVersion(r.engineVersion || "2.0.0");
        setStats((r.stats as MkeStats) || null);
        setAkp((r.akp as AkpStats) || null);
        setPlatforms(r.platforms || []);
        setIntelligenceLayers(r.intelligenceLayers || []);
        setPipelineStages(r.pipelineStages || []);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const r = await runMkeEngine("full");
      setRunResult(r.ok
        ? `\u2713 ${r.published ?? 0} \u0645\u0646\u0634\u0648\u0631 \u00b7 ${r.pendingReview ?? 0} \u0645\u0631\u0627\u062c\u0639\u0629 \u00b7 ${r.duplicates ?? 0} \u0645\u0643\u0631\u0631`
        : `\u2717 ${r.error || "\u0641\u0634\u0644"}`);
      load();
    } catch {
      setRunResult("\u2717 \u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u062a\u0634\u063a\u064a\u0644");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="mke-header">
        <div>
          <h2 className="mke-title">
            Majlis Autonomous Platform v{engineVersion}
          </h2>
          <p className="mke-subtitle">
            \u0646\u0638\u0627\u0645 \u062a\u0634\u063a\u064a\u0644 \u0630\u0627\u062a\u064a 24/7 \u2014 \u0627\u0643\u062a\u0634\u0627\u0641 \u00b7 \u062c\u0648\u062f\u0629 \u00b7 \u0642\u0631\u0627\u0631 \u00b7 \u0646\u0634\u0631 \u00b7 \u0634\u0641\u0627\u0621 \u00b7 \u062a\u0639\u0644\u0645
          </p>
        </div>
        <div className="mke-actions">
          <Link href="/admin/automation/dashboard" className="mke-link">Phase 5</Link>
          <Link href="/admin/automation/center" className="mke-link">Phase 6</Link>
          <Link href="/admin/sources" className="mke-link">\u0627\u0644\u0645\u0635\u0627\u062f\u0631</Link>
          <button type="button" onClick={handleRun} disabled={running} className="mke-run-btn">
            {running ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u2026" : "\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0645\u062d\u0631\u0643"}
          </button>
        </div>
      </div>

      {runResult && <p className="mke-run-result">{runResult}</p>}

      {loading ? <SkeletonCardGrid count={6} /> : (
        <>
          <div className="mke-stats-row">
            <StatCard label="\u0635\u062d\u0629 \u0627\u0644\u0646\u0638\u0627\u0645" value={stats?.health?.score ?? "\u2014"} color={stats?.health?.status === "healthy" ? "var(--majalis-emerald-deep)" : "#173D35"} />
            <StatCard label="\u0627\u0644\u0645\u0635\u0627\u062f\u0631" value={stats?.counts?.sources ?? (stats?.subsystems as { sources?: { total?: number } } | undefined)?.sources?.total ?? stats?.sourcesTotal ?? 0} />
            <StatCard label="\u0627\u0644\u0645\u0646\u0635\u0627\u062a" value={stats?.platformsSupported ?? platforms.length} />
            <StatCard label="\u0645\u0633\u0648\u062f\u0627\u062a" value={stats?.counts?.drafts ?? stats?.drafts ?? 0} />
            <StatCard label="\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629" value={stats?.counts?.pendingReview ?? stats?.pendingReview ?? 0} color="#173D35" />
            <StatCard label="\u0645\u0646\u0634\u0648\u0631 \u0627\u0644\u064a\u0648\u0645" value={stats?.counts?.publishedToday ?? stats?.publishedToday ?? 0} />
            <StatCard label="Queue" value={stats?.subsystems?.queue ? (stats.subsystems.queue as { pending?: number }).pending ?? 0 : stats?.queue?.pending ?? 0} />
            <StatCard label="Self-Heal" value={stats?.counts?.self_heal_log ?? "\u2014"} />
            {akp && (
              <>
                <StatCard label="AKP \u062c\u0627\u0647\u0632\u064a\u0629 %" value={akp.readinessPct ?? "\u2014"} />
                <StatCard label="\u0645\u0646\u0634\u0648\u0631 AKP \u0627\u0644\u064a\u0648\u0645" value={akp.counts?.published ?? akp.productionVelocity?.itemsToday ?? 0} />
                <StatCard label="DLQ" value={akp.counts?.dlq ?? 0} color="#991B1B" />
                <StatCard label="\u0645\u0631\u0627\u062c\u0639\u0629 AKP" value={akp.counts?.reviewPending ?? 0} color="#173D35" />
              </>
            )}
          </div>

          {akp?.pipelines && (
            <section className="mke-section">
              <h3 className="mke-section-h3">\u062e\u0637\u0648\u0637 \u0627\u0644\u0625\u0646\u062a\u0627\u062c (Phase 2)</h3>
              <div className="mke-row-wrap">
                {Object.entries(akp.pipelines).map(([key, p]) => (
                  <StatCard
                    key={key}
                    label={`${p.label || key} (${p.publishedToday ?? 0}/${p.quota ?? "\u2014"})`}
                    value={p.publishedToday ?? 0}
                  />
                ))}
              </div>
              {akp.lastRun && (
                <p className="mke-small-info">
                  \u0622\u062e\u0631 Run: {akp.lastRun.status} \u2014 {akp.lastRun.started_at ? new Date(akp.lastRun.started_at).toLocaleString("ar-KW") : "\u2014"}
                </p>
              )}
              {akp.lastError && (
                <p className="mke-small-err">
                  \u0622\u062e\u0631 \u062e\u0637\u0623: {akp.lastError.message}
                </p>
              )}
              {akp.health?.score != null && (
                <p className="mke-small-info">
                  Health Score: {akp.health.score}% \u00b7 \u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u062a\u0646\u0641\u064a\u0630: {akp.avgDurationMs ?? "\u2014"}ms \u00b7 Retry Queue: {akp.retryQueue?.total ?? akp.counts?.retryQueue ?? 0}
                </p>
              )}
              {akp.sourceStatuses && akp.sourceStatuses.length > 0 && (
                <div className="mke-source-statuses">
                  {akp.sourceStatuses.map((s) => (
                    <span
                      key={s.slug}
                      className="mke-source-status"
                      style={{
                        "--mke-ss-bg": s.status === "available" || s.status === "slow" ? "#ecfdf5" : "#fef2f2",
                        "--mke-ss-color": s.status === "available" || s.status === "slow" ? "var(--majalis-emerald-deep)" : "#991B1B",
                      } as React.CSSProperties}
                      title={s.lastError || s.status}
                    >
                      {s.name}: {s.status}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {intelligenceLayers.length > 0 && (
            <section className="mke-section">
              <h3 className="mke-section-h3">Intelligence Layers ({intelligenceLayers.length})</h3>
              <div className="mke-row-wrap">
                {intelligenceLayers.map((l) => (
                  <span key={l.id} className="mke-tag">{l.label}</span>
                ))}
              </div>
            </section>
          )}

          <section className="mke-section">
            <h3 className="mke-section-h3">\u062d\u0627\u0644\u0629 \u0627\u0644\u062e\u062f\u0645\u0627\u062a</h3>
            <div className="mke-service-badges">
              <StatusBadge ok={stats?.vision?.visionEnabled ?? false} label="Vision AI" />
              <StatusBadge ok={(stats?.subsystems?.vision as { visionEnabled?: boolean })?.visionEnabled ?? stats?.vision?.visionEnabled ?? false} label="Vision AI v2" />
              <StatusBadge ok={stats?.database?.status === "connected"} label="قاعدة البيانات" />
              <StatusBadge ok={stats?.search?.embeddings ?? stats?.search?.status === "embeddings_ready"} label="البحث الدلالي" />
              <StatusBadge ok={Boolean(stats?.subsystems?.notifications)} label="الإشعارات" />
            </div>
          </section>

          {stats?.extractionMetrics && (
            <section className="mke-section">
              <h3 className="mke-section-h3">\u062f\u0642\u0629 \u0627\u0644\u0627\u0633\u062a\u062e\u0631\u0627\u062c</h3>
              <div className="mke-row-wrap">
                <StatCard label="Vision AI %" value={stats.extractionMetrics.visionAccuracy ?? "\u2014"} />
                <StatCard label="\u0643\u0634\u0641 \u0627\u0644\u062a\u0643\u0631\u0627\u0631 %" value={stats.extractionMetrics.duplicateDetectionRate ?? "\u2014"} />
                <StatCard label="\u0631\u0628\u0637 \u0627\u0644\u0634\u064a\u0648\u062e %" value={stats.extractionMetrics.sheikhMatchRate ?? "\u2014"} />
              </div>
            </section>
          )}

          <section className="mke-section">
            <h3 className="mke-section-h3">Pipeline ({pipelineStages.length} \u0645\u0631\u0627\u062d\u0644)</h3>
            <p className="mke-pipeline-text">
              {pipelineStages.map((s) => s.label).join(" \u2192 ")}
            </p>
          </section>

          <section className="mke-section">
            <h3 className="mke-section-h3">\u0627\u0644\u0645\u0646\u0635\u0627\u062a \u0627\u0644\u0645\u062f\u0639\u0648\u0645\u0629 ({platforms.length})</h3>
            <p className="mke-pipeline-text mke-pipeline-text--spaced">
              {platforms.slice(0, 30).map((p) => p.type).join(" \u00b7 ")}
              {platforms.length > 30 ? " \u2026" : ""}
            </p>
          </section>

          {stats?.sourcesByType && Object.keys(stats.sourcesByType).length > 0 && (
            <section className="mke-section">
              <h3 className="mke-section-h3">\u0627\u0644\u0645\u0635\u0627\u062f\u0631 \u062d\u0633\u0628 \u0627\u0644\u0646\u0648\u0639</h3>
              <div className="mke-row-wrap">
                {Object.entries(stats.sourcesByType).map(([type, count]) => (
                  <span key={type} className="mke-tag-tiny">
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
