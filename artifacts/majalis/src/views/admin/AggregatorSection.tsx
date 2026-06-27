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
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";
import { ContentFileImport } from "./ContentFileImport";

const monoTextarea: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", minHeight: "12rem", resize: "vertical",
  padding: "0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`,
  background: "#fffdf8", color: C.ink, fontSize: "0.8125rem", lineHeight: 1.6,
  fontFamily: "ui-monospace, Menlo, monospace", direction: "ltr", textAlign: "left",
};

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
    setLoading(false);
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

  if (loading || !stats) return <Loading />;

  return (
    <div>
      <AdminSectionToolbar
        title="محرك تجميع المحتوى (Content Aggregator)"
        actions={
          <ContentFileImport onDone={load} />
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "فهرس CMS / محتوى", value: stats.indexTotal },
          { label: "عمليات استيراد", value: stats.importJobsTotal },
          { label: "أذكار موثقة", value: stats.verifiedAdhkarTotal },
          { label: "مفاتيح dedup", value: stats.duplicateKeys },
          { label: "مجدولة", value: stats.scheduledCount },
          { label: "مؤرشفة", value: stats.archivedCount },
          { label: "سجل اليوم", value: stats.auditLogsToday },
        ].map((c) => (
          <div key={c.label} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: C.emeraldDeep }}>{c.value.toLocaleString("ar")}</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>{c.label}</p>
          </div>
        ))}
      </div>

      {(stats.lastImportAt || stats.sources.length > 0) && (
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.7 }}>
          {stats.lastImportAt && (
            <>
              آخر استيراد: {stats.lastImportType || "—"} — {stats.lastImportStatus || "—"}
              {stats.lastImportImported != null ? ` (${stats.lastImportImported} صف)` : ""}
              {" · "}
              {new Date(stats.lastImportAt).toLocaleString("ar")}
              <br />
            </>
          )}
          {stats.sources.length > 0 && <>مصادر العداد: {stats.sources.join("، ")}</>}
        </p>
      )}

      <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem", color: C.emeraldDeep }}>استيراد محتوى (JSON)</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as CmsContentKind)}
            style={{ padding: "0.5rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, fontFamily: "inherit" }}
          >
            {CMS_CONTENT_KINDS.map((k) => (
              <option key={k} value={k}>{CMS_KIND_LABELS[k]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={runImport}
            disabled={running || !jsonText.trim()}
            style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", border: "none", background: C.emerald, color: C.parchment, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
          >
            {running ? "جارٍ الاستيراد…" : "تشغيل Aggregator"}
          </button>
        </div>
        <textarea
          style={monoTextarea}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={'[{"title":"…","external_key":"…","speaker_name":"…"}]'}
          spellCheck={false}
        />
        {lastResult && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: C.inkSoft }}>
            آخر عملية: {lastResult.inserted} إضافة · {lastResult.updated} تحديث · {lastResult.duplicates} تكرار · {lastResult.errors} خطأ
          </p>
        )}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "1rem" }}>آخر عمليات الاستيراد</h3>
          {jobs.length === 0 ? (
            <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>لا توجد عمليات استيراد بعد</p>
          ) : (
            <ul style={{ margin: 0, paddingInlineStart: "1.1rem", fontSize: "0.8125rem", lineHeight: 1.9 }}>
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

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "1rem" }}>سجل التدقيق (Audit)</h3>
          {audit.length === 0 ? (
            <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>لا سجلات بعد</p>
          ) : (
            <ul style={{ margin: 0, paddingInlineStart: "1.1rem", fontSize: "0.8125rem", lineHeight: 1.9 }}>
              {audit.map((a) => (
                <li key={a.id}>{a.action} — {a.table_name}</li>
              ))}
            </ul>
          )}
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "1rem" }}>تكرارات محتملة</h3>
          {duplicates.length === 0 ? (
            <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>لا تكرارات في external_key</p>
          ) : (
            <ul style={{ margin: 0, paddingInlineStart: "1.1rem", fontSize: "0.8125rem", lineHeight: 1.9 }}>
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
