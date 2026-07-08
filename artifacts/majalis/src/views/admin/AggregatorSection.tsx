import { useEffect, useState } from "react";
import {
  CMS_CONTENT_KINDS,
  CMS_KIND_LABELS,
  type CmsContentKind,
  type ImportJobSummary,
} from "@/lib/cms/content-types";
import { runImportJob, previewDedup } from "@/lib/cms";
import { getCmsDashboardStats, getRecentImportJobs, getDuplicateReport } from "@/lib/cms/supabase-cms";
import { getRecentAuditLogs } from "@/lib/cms/audit-log";
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";
import { ContentFileImport } from "./ContentFileImport";
import { Phase2TrialImport } from "./Phase2TrialImport";

export function AggregatorSection() {
  const { showSuccess, showError } = useAdminShell();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getCmsDashboardStats>> | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<CmsContentKind>("lesson");
  const [jsonText, setJsonText] = useState("");
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<ImportJobSummary | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, j, d, a] = await Promise.all([
        getCmsDashboardStats(),
        getRecentImportJobs(8),
        getDuplicateReport(),
        getRecentAuditLogs(10),
      ]);
      setStats(s);
      setJobs(j);
      setDuplicates(d);
      setAudit(a);
    } catch {
      showError("تعذّر تحميل بيانات محرك التجميع.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runImport = async () => {
    let rows: Record<string, unknown>[];
    try {
      const parsed = JSON.parse(jsonText);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      showError(`JSON غير صالح: ${(e as Error).message}`);
      return;
    }
    if (rows.length === 0) {
      showError("لا توجد صفوف للاستيراد");
      return;
    }

    setRunning(true);
    try {
      const preview = await previewDedup(kind, rows[0]);
      if (preview.isDuplicate) {
        showError(`تحذير: الصف الأول يبدو مكرراً (${preview.matches[0]?.matchType})`);
      }

      const summary = await runImportJob(kind, rows, "json-bulk", { mergeOnDuplicate: true, validateLinks: false });
      setLastResult(summary);
      showSuccess(`اكتمل الاستيراد: ${summary.inserted} جديد · ${summary.updated} محدّث · ${summary.duplicates} مكرر · ${summary.errors} خطأ`);
      load();
    } catch (e) {
      showError(String((e as Error).message || e));
    } finally {
      setRunning(false);
    }
  };

  if (loading || !stats) return <SkeletonCardGrid count={6} />;

  return (
    <div>
      <AdminSectionToolbar
        title="محرك تجميع المحتوى (Content Aggregator)"
        actions={
          <>
            <Phase2TrialImport onDone={load} />
            <ContentFileImport onDone={load} />
          </>
        }
      />

      <div className="agg-stats-grid">
        {[
          { label: "فهرس CMS / محتوى", value: stats.indexTotal },
          { label: "عمليات استيراد", value: stats.importJobsTotal },
          { label: "أذكار موثقة", value: stats.verifiedAdhkarTotal },
          { label: "مفاتيح dedup", value: stats.duplicateKeys },
          { label: "مجدولة", value: stats.scheduledCount },
          { label: "مؤرشفة", value: stats.archivedCount },
          { label: "سجل اليوم", value: stats.auditLogsToday },
        ].map((c) => (
          <div key={c.label} className="agg-stat">
            <p className="agg-stat__value">{(c.value ?? 0).toLocaleString("ar")}</p>
            <p className="agg-stat__label">{c.label}</p>
          </div>
        ))}
      </div>

      {(stats.lastImportAt || (stats.sources ?? []).length > 0) && (
        <p className="agg-last-import">
          {stats.lastImportAt && (
            <>
              آخر استيراد: {stats.lastImportType || "—"} — {stats.lastImportStatus || "—"}
              {stats.lastImportImported != null ? ` (${stats.lastImportImported} صف)` : ""}
              {" · "}
              {new Date(stats.lastImportAt).toLocaleString("ar")}
              <br />
            </>
          )}
          {(stats.sources ?? []).length > 0 && <>مصادر العداد: {(stats.sources ?? []).join("، ")}</>}
        </p>
      )}

      <section className="agg-import-section">
        <h3 className="agg-import-h3">استيراد محتوى (JSON)</h3>
        <div className="agg-import-row">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as CmsContentKind)}
            className="agg-select"
          >
            {CMS_CONTENT_KINDS.map((k) => (
              <option key={k} value={k}>{CMS_KIND_LABELS[k]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={runImport}
            disabled={running || !jsonText.trim()}
            className="agg-run-btn"
          >
            {running ? "جارٍ الاستيراد…" : "تشغيل Aggregator"}
          </button>
        </div>
        <textarea
          className="blk-mono-textarea"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={'[{"title":"…","external_key":"…","speaker_name":"…"}]'}
          spellCheck={false}
        />
        {lastResult && (
          <p className="agg-last-result">
            آخر عملية: {lastResult.inserted} إضافة · {lastResult.updated} تحديث · {lastResult.duplicates} تكرار · {lastResult.errors} خطأ
          </p>
        )}
      </section>

      <div className="agg-panels-grid">
        <section className="agg-panel">
          <h3 className="agg-panel-h3">آخر عمليات الاستيراد</h3>
          {jobs.length === 0 ? (
            <p className="agg-panel-empty">لا توجد عمليات استيراد بعد</p>
          ) : (
            <ul className="agg-panel-ul">
              {jobs.map((j) => (
                <li key={j.id}>
                  {CMS_KIND_LABELS[j.content_kind as CmsContentKind] || j.content_kind}
                  {j.filename ? ` (${j.filename})` : ""} — {j.status} ({j.inserted_count} استورد · {j.updated_count} تخطى)
                  {j.total_rows != null ? ` / ${j.total_rows} صف` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="agg-panel">
          <h3 className="agg-panel-h3">سجل التدقيق (Audit)</h3>
          {audit.length === 0 ? (
            <p className="agg-panel-empty">لا سجلات بعد</p>
          ) : (
            <ul className="agg-panel-ul">
              {audit.map((a) => (
                <li key={a.id}>{a.action} — {a.table_name}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="agg-panel">
          <h3 className="agg-panel-h3">تكرارات محتملة</h3>
          {duplicates.length === 0 ? (
            <p className="agg-panel-empty">لا تكرارات في external_key</p>
          ) : (
            <ul className="agg-panel-ul">
              {duplicates.map((d) => (
                <li key={d.key}>{d.key} × {d.count}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
