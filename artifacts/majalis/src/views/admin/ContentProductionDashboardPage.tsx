import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  getContentProductionDashboard,
  runContentProductionJob,
  type ContentProductionDashboard,
} from "@/lib/content-production-api";
import { Loading } from "@/components/ui-common";
import { AdminShell } from "@/views/admin/AdminShell";

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="cpd-stat" style={color ? { "--cpd-val-color": color } as React.CSSProperties : undefined}>
      <div className="cpd-stat__value">{value}</div>
      <div className="cpd-stat__label">{label}</div>
    </div>
  );
}

function ContentProductionDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ContentProductionDashboard | null>(null);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getContentProductionDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const triggerJob = async (jobId: string) => {
    setRunningJob(jobId);
    setJobError(null);
    try {
      await runContentProductionJob(jobId);
      load();
    } catch {
      setJobError("\u062a\u0639\u0630\u0651\u0631 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0645\u0647\u0645\u0629.");
    } finally {
      setRunningJob(null);
    }
  };

  const prod = data?.production;
  const obs = data?.observability;
  const lastRun = obs?.runs?.[0] as { job_id?: string; started_at?: string; status?: string; duration_ms?: number } | undefined;

  return (
    <div>
      <div className="cpd-header">
        <div>
          <h2 className="cpd-title">\u0625\u0646\u062a\u0627\u062c \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0630\u0627\u062a\u064a \u2014 Phase 4</h2>
          <p className="cpd-subtitle">
            Source \u2192 Validation \u2192 Dedup \u2192 Classification \u2192 Quality \u2192 Publishing \u2192 Indexing \u2192 Search \u2192 Statistics
          </p>
        </div>
        <div className="cpd-links">
          <Link href="/admin/automation/review" className="cpd-link">\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629</Link>
          <Link href="/admin/automation/dashboard" className="cpd-link">\u0623\u062a\u0645\u062a\u0629 \u0627\u0644\u062f\u0631\u0648\u0633</Link>
          <Link href="/admin/auto-content" className="cpd-link">\u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062a RSS</Link>
        </div>
      </div>

      {jobError && (
        <p role="alert" className="cpd-error">{jobError}</p>
      )}

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="cpd-stats-row">
            <StatCard label="\u062c\u0627\u0647\u0632\u064a\u0629 \u0627\u0644\u0646\u0638\u0627\u0645" value={`${data?.readiness?.score ?? 0}%`} />
            <StatCard label="\u0625\u0646\u062a\u0627\u062c \u0627\u0644\u064a\u0648\u0645" value={prod?.today?.published ?? 0} />
            <StatCard label="\u0625\u0646\u062a\u0627\u062c \u0627\u0644\u0623\u0633\u0628\u0648\u0639" value={prod?.week?.published ?? 0} />
            <StatCard label="\u0625\u0646\u062a\u0627\u062c \u0627\u0644\u0634\u0647\u0631" value={prod?.month?.published ?? 0} />
            <StatCard label="\u0645\u0631\u0641\u0648\u0636 \u0627\u0644\u064a\u0648\u0645" value={prod?.today?.rejected ?? 0} color="#0E6E52" />
            <StatCard label="\u0645\u0643\u0631\u0631 \u0627\u0644\u064a\u0648\u0645" value={prod?.today?.duplicate ?? 0} />
            <StatCard label="\u0645\u0635\u0627\u062f\u0631 \u0646\u0634\u0637\u0629" value={data?.readiness?.activeSources ?? 0} />
            <StatCard label="\u062a\u0646\u0628\u064a\u0647\u0627\u062a" value={data?.readiness?.openAlerts ?? 0} color="#991B1B" />
          </div>

          <section className="cpd-section">
            <h3 className="cpd-section-h3">Cron Jobs</h3>
            <div className="cpd-jobs-list">
              {(data?.jobs || []).map((job: NonNullable<ContentProductionDashboard["jobs"]>[number]) => (
                <div key={job.id} className="cpd-job-row">
                  <div>
                    <strong>{job.name_ar}</strong> \u00b7 {job.interval_label}
                    {job.last_run_at && (
                      <span className="cpd-job-time">
                        {" "}
                        \u2014 \u0622\u062e\u0631 \u062a\u0634\u063a\u064a\u0644: {new Date(job.last_run_at).toLocaleString("ar-EG")}
                        {job.last_duration_ms ? ` (${job.last_duration_ms}ms)` : ""}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={runningJob === job.id}
                    onClick={() => triggerJob(job.id)}
                    className="cpd-job-btn"
                  >
                    {runningJob === job.id ? "..." : "\u062a\u0634\u063a\u064a\u0644"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="cpd-section">
            <h3 className="cpd-section-h3">Pipelines ({Object.keys(data?.pipelines || {}).length})</h3>
            <div className="cpd-pipelines">
              {Object.entries(data?.pipelines || {}).map(([id, p]) => {
                const pipe = p as { labelAr?: string; dailyQuota?: number; weeklyQuota?: number };
                return (
                  <span key={id} className="cpd-pipeline-tag">
                    {pipe.labelAr || id}
                    {pipe.dailyQuota ? ` \u00b7 ${pipe.dailyQuota}/\u064a\u0648\u0645` : ""}
                    {pipe.weeklyQuota ? ` \u00b7 ${pipe.weeklyQuota}/\u0623\u0633\u0628\u0648\u0639` : ""}
                  </span>
                );
              })}
            </div>
          </section>

          <section className="cpd-section">
            <h3 className="cpd-section-h3">Monitoring</h3>
            <div className="cpd-monitor-row">
              <StatCard label="Retry Queue" value={obs?.retries?.length ?? 0} />
              <StatCard label="Dead Letter" value={obs?.dlq?.length ?? 0} />
              <StatCard label="\u0633\u062c\u0644\u0627\u062a" value={obs?.logs?.length ?? 0} />
            </div>
            {lastRun && (
              <p className="cpd-last-run">
                \u0622\u062e\u0631 Cron: {lastRun.job_id} \u2014 {lastRun.status} \u2014 {lastRun.duration_ms ?? "?"}ms
              </p>
            )}
            <div className="cpd-logs-list">
              {(obs?.logs || []).slice(0, 12).map((log: { id?: string; stage?: string; message?: string; level?: string }) => (
                <div key={log.id} className="cpd-log-item">
                  [{log.level}] {log.stage}: {log.message}
                </div>
              ))}
            </div>
          </section>

          <section className="cpd-section">
            <h3 className="cpd-section-h3">\u0627\u0644\u0645\u0635\u0627\u062f\u0631 \u0627\u0644\u0645\u0648\u062b\u0642\u0629 ({data?.sources?.length ?? 0})</h3>
            <div className="cpd-sources-list">
              {(data?.sources || []).map((s: NonNullable<ContentProductionDashboard["sources"]>[number]) => (
                <div key={s.slug} className="cpd-source-item">
                  <strong>{s.name}</strong> \u00b7 {s.pipeline} \u00b7 \u062b\u0642\u0629 {s.trust_level}%
                  {!s.active && " (\u0645\u0639\u0637\u0651\u0644)"}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function ContentProductionDashboardPage() {
  return (
    <AdminShell section="knowledge-engine" onSectionChange={() => {}}>
      <ContentProductionDashboardContent />
    </AdminShell>
  );
}

export function ContentProductionSection() {
  return <ContentProductionDashboardContent />;
}
