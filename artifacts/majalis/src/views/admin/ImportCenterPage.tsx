import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  cancelImportJobApi,
  fetchImportCenter,
  retryImportJobApi,
  type ImportCenterDashboard,
  type ImportJobSummary,
} from "@/lib/import-center-api";
import { ContentFileImport } from "@/views/admin/ContentFileImport";

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

function statusColor(status: string) {
  switch (status) {
    case "completed":
      return { bg: "#D1FAE5", text: C.emeraldDeep };
    case "failed":
      return { bg: "#FEE2E2", text: "#991B1B" };
    case "cancelled":
      return { bg: "#F3F4F6", text: "#4B5563" };
    default:
      return { bg: "#DBEAFE", text: "#1D4ED8" };
  }
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: "0.5rem",
        padding: "1rem",
        minWidth: "140px",
        flex: "1 1 140px",
      }}
    >
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.35rem 0 0", fontSize: "1.35rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</p>
      {hint ? <p style={{ margin: "0.25rem 0 0", fontSize: "0.6875rem", color: C.inkSoft }}>{hint}</p> : null}
    </div>
  );
}

function JobRow({ job, onRetry, onCancel }: { job: ImportJobSummary; onRetry?: () => void; onCancel?: () => void }) {
  const colors = statusColor(job.status);
  return (
    <tr>
      <td style={{ padding: "0.5rem", fontSize: "0.8125rem" }}>{formatDate(job.startedAt)}</td>
      <td style={{ padding: "0.5rem", fontSize: "0.8125rem" }}>{job.label || job.type}</td>
      <td style={{ padding: "0.5rem", fontSize: "0.8125rem", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis" }}>
        {job.filename || "—"}
      </td>
      <td style={{ padding: "0.5rem" }}>
        <span style={{ background: colors.bg, color: colors.text, padding: "0.15rem 0.45rem", borderRadius: "999px", fontSize: "0.75rem" }}>
          {job.status}
        </span>
      </td>
      <td style={{ padding: "0.5rem", fontSize: "0.8125rem" }}>{job.totalRows}</td>
      <td style={{ padding: "0.5rem", fontSize: "0.8125rem" }}>{job.imported}</td>
      <td style={{ padding: "0.5rem", fontSize: "0.8125rem" }}>{job.skipped}</td>
      <td style={{ padding: "0.5rem", fontSize: "0.8125rem" }}>{job.rejected}</td>
      <td style={{ padding: "0.5rem", fontSize: "0.8125rem" }}>{job.executionTimeMs ? `${job.executionTimeMs}ms` : "—"}</td>
      <td style={{ padding: "0.5rem" }}>
        {(job.status === "failed" || job.status === "cancelled") && onRetry ? (
          <button type="button" onClick={onRetry} style={{ fontSize: "0.75rem", marginLeft: "0.25rem" }}>
            إعادة
          </button>
        ) : null}
        {["queued", "processing", "validating", "importing"].includes(job.status) && onCancel ? (
          <button type="button" onClick={onCancel} style={{ fontSize: "0.75rem" }}>
            إلغاء
          </button>
        ) : null}
      </td>
    </tr>
  );
}

function ImportCenterContent() {
  const [data, setData] = useState<ImportCenterDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await fetchImportCenter(40);
      if (!dashboard.ok) throw new Error("تعذّر تحميل مركز الاستيراد");
      setData(dashboard);
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(id);
  }, [load]);

  const handleRetry = async (jobId: string) => {
    await retryImportJobApi(jobId);
    await load();
  };

  const handleCancel = async (jobId: string) => {
    await cancelImportJobApi(jobId);
    await load();
  };

  if (loading && !data) {
    return (
      <div>
        <Loading />
        <p style={{ textAlign: "center", color: C.inkSoft, fontSize: "0.875rem" }}>جارٍ تحميل مركز الاستيراد…</p>
      </div>
    );
  }

  const metrics = data?.metrics;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", color: C.emeraldDeep }}>مركز الاستيراد</h1>
          <p style={{ margin: "0.35rem 0 0", color: C.inkSoft, fontSize: "0.875rem" }}>
            Universal Import Engine — جميع أنواع المحتوى عبر محرك واحد
          </p>
        </div>
        <ContentFileImport onDone={load} />
      </div>

      {error ? (
        <p style={{ color: "#991B1B", marginTop: "1rem" }}>{error}</p>
      ) : null}

      {metrics ? (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
          <MetricCard label="نجاح آخر 30 يوماً" value={metrics.successRate30d != null ? `${metrics.successRate30d}%` : "—"} />
          <MetricCard label="متوسط زمن التنفيذ" value={metrics.avgExecutionTimeMs ? `${metrics.avgExecutionTimeMs}ms` : "—"} />
          <MetricCard label="سرعة الاستيراد" value={metrics.avgImportSpeedRowsPerSec ? `${metrics.avgImportSpeedRowsPerSec} ص/ث` : "—"} />
          <MetricCard label="مهام نشطة" value={String(metrics.activeJobs)} />
          <MetricCard label="مكتمل (30 يوم)" value={String(metrics.completedLast30d)} hint={`فشل: ${metrics.failedLast30d}`} />
        </div>
      ) : null}

      <section style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>آخر العمليات</h2>
        <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: "0.5rem", background: C.panel }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "880px" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep, textAlign: "right" }}>
                {["التاريخ", "النوع", "الملف", "الحالة", "الصفوف", "مستورد", "متخطى", "مرفوض", "المدة", ""].map((h) => (
                  <th key={h} style={{ padding: "0.5rem", fontSize: "0.75rem", color: C.inkSoft }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.recentJobs || []).map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onRetry={() => void handleRetry(job.id)}
                  onCancel={() => void handleCancel(job.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem" }}>آخر الأخطاء</h3>
          {(data?.latestErrors || []).length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.8125rem", color: C.inkSoft }}>لا أخطاء حديثة</p>
          ) : (
            (data?.latestErrors || []).slice(0, 5).map((job) => (
              <div key={job.id} style={{ marginBottom: "0.75rem", fontSize: "0.8125rem" }}>
                <strong>{job.filename || job.type}</strong>
                <pre style={{ whiteSpace: "pre-wrap", margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#991B1B" }}>
                  {job.errors[0]?.message || "—"}
                </pre>
              </div>
            ))
          )}
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem" }}>آخر المرفوض</h3>
          {(data?.latestRejected || []).slice(0, 5).map((job) => (
            <p key={job.id} style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem" }}>
              {job.filename || job.type}: {job.rejected} صف
            </p>
          ))}
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem" }}>آخر المكرر</h3>
          {(data?.latestDuplicates || []).slice(0, 5).map((job) => (
            <p key={job.id} style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem" }}>
              {job.filename || job.type}: {job.duplicates} مكرر
            </p>
          ))}
        </section>
      </div>

      <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: C.inkSoft }}>
        <Link href="/admin">← العودة للوحة التحكم</Link>
      </p>
    </div>
  );
}

export function ImportCenterPage() {
  return (
    <AdminShell section="lessons" onSectionChange={() => {}}>
      <ImportCenterContent />
    </AdminShell>
  );
}

export default ImportCenterPage;
