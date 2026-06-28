import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  getContentProductionDashboard,
  runContentProductionJob,
  type ContentProductionDashboard,
} from "@/lib/content-production-api";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminShell } from "@/views/admin/AdminShell";

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: "0.5rem",
        padding: "1rem",
        minWidth: "110px",
      }}
    >
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: color || C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

function ContentProductionDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ContentProductionDashboard | null>(null);
  const [runningJob, setRunningJob] = useState<string | null>(null);

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
    try {
      await runContentProductionJob(jobId);
      load();
    } finally {
      setRunningJob(null);
    }
  };

  const prod = data?.production;
  const obs = data?.observability;
  const lastRun = obs?.runs?.[0] as { job_id?: string; started_at?: string; status?: string; duration_ms?: number } | undefined;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>إنتاج المحتوى الذاتي — Phase 4</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            Source → Validation → Dedup → Classification → Quality → Publishing → Indexing → Search → Statistics
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8125rem", flexWrap: "wrap" }}>
          <Link href="/admin/automation/review" style={{ color: C.emeraldDeep }}>مركز المراجعة</Link>
          <Link href="/admin/automation/dashboard" style={{ color: C.emeraldDeep }}>أتمتة الدروس</Link>
          <Link href="/admin/auto-content" style={{ color: C.emeraldDeep }}>المقالات RSS</Link>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <StatCard label="جاهزية النظام" value={`${data?.readiness?.score ?? 0}%`} />
            <StatCard label="إنتاج اليوم" value={prod?.today?.published ?? 0} />
            <StatCard label="إنتاج الأسبوع" value={prod?.week?.published ?? 0} />
            <StatCard label="إنتاج الشهر" value={prod?.month?.published ?? 0} />
            <StatCard label="مرفوض اليوم" value={prod?.today?.rejected ?? 0} color="#92400E" />
            <StatCard label="مكرر اليوم" value={prod?.today?.duplicate ?? 0} />
            <StatCard label="مصادر نشطة" value={data?.readiness?.activeSources ?? 0} />
            <StatCard label="تنبيهات" value={data?.readiness?.openAlerts ?? 0} color="#991B1B" />
          </div>

          <section style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>Cron Jobs</h3>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {(data?.jobs || []).map((job: NonNullable<ContentProductionDashboard["jobs"]>[number]) => (
                <div
                  key={job.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.625rem 0.75rem",
                    background: C.parchmentDeep,
                    borderRadius: "0.375rem",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div>
                    <strong>{job.name_ar}</strong> · {job.interval_label}
                    {job.last_run_at && (
                      <span style={{ color: C.inkSoft, marginRight: "0.5rem" }}>
                        {" "}
                        — آخر تشغيل: {new Date(job.last_run_at).toLocaleString("ar-EG")}
                        {job.last_duration_ms ? ` (${job.last_duration_ms}ms)` : ""}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={runningJob === job.id}
                    onClick={() => triggerJob(job.id)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "0.25rem",
                      border: "none",
                      background: C.emerald,
                      color: C.parchment,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "0.75rem",
                    }}
                  >
                    {runningJob === job.id ? "..." : "تشغيل"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>Pipelines ({Object.keys(data?.pipelines || {}).length})</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {Object.entries(data?.pipelines || {}).map(([id, p]) => {
                const pipe = p as { labelAr?: string; dailyQuota?: number; weeklyQuota?: number };
                return (
                  <span
                    key={id}
                    style={{
                      padding: "0.35rem 0.65rem",
                      borderRadius: "999px",
                      background: C.sage,
                      fontSize: "0.75rem",
                    }}
                  >
                    {pipe.labelAr || id}
                    {pipe.dailyQuota ? ` · ${pipe.dailyQuota}/يوم` : ""}
                    {pipe.weeklyQuota ? ` · ${pipe.weeklyQuota}/أسبوع` : ""}
                  </span>
                );
              })}
            </div>
          </section>

          <section style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>Monitoring</h3>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              <StatCard label="Retry Queue" value={obs?.retries?.length ?? 0} />
              <StatCard label="Dead Letter" value={obs?.dlq?.length ?? 0} />
              <StatCard label="سجلات" value={obs?.logs?.length ?? 0} />
            </div>
            {lastRun && (
              <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>
                آخر Cron: {lastRun.job_id} — {lastRun.status} — {lastRun.duration_ms ?? "?"}ms
              </p>
            )}
            <div style={{ display: "grid", gap: "0.35rem", maxHeight: "200px", overflowY: "auto" }}>
              {(obs?.logs || []).slice(0, 12).map((log: { id?: string; stage?: string; message?: string; level?: string }) => (
                <div key={log.id} style={{ fontSize: "0.75rem", padding: "0.35rem", background: C.panel, borderRadius: "0.25rem" }}>
                  [{log.level}] {log.stage}: {log.message}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>المصادر الموثقة ({data?.sources?.length ?? 0})</h3>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              {(data?.sources || []).map((s: NonNullable<ContentProductionDashboard["sources"]>[number]) => (
                <div key={s.slug} style={{ fontSize: "0.8125rem" }}>
                  <strong>{s.name}</strong> · {s.pipeline} · ثقة {s.trust_level}%
                  {!s.active && " (معطّل)"}
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
    <AdminShell section="knowledge-engine">
      <ContentProductionDashboardContent />
    </AdminShell>
  );
}

export function ContentProductionSection() {
  return <ContentProductionDashboardContent />;
}
