import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  adminApproveAutoContent,
  adminGetAutoImportedContent,
  adminGetAutoImportLogs,
  adminGetAutoImportRuns,
  adminGetTrustedSources,
  adminRejectAutoContent,
  triggerAutoContentSync,
} from "@/lib/auto-content-service";
import type {
  AutoImportedContent,
  AutoImportLog,
  AutoImportRun,
  TrustedSource,
} from "@/lib/auto-content/auto-content-utils";

const STATUS_FILTERS = [
  ["all", "الكل"],
  ["needs_review", "قيد المراجعة"],
  ["published", "منشور"],
  ["rejected", "مرفوض"],
] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  needs_review: { bg: "rgba(14,110,82,0.08)", text: "#0E6E52" },
  published: { bg: "#D1FAE5", text: C.emeraldDeep },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
  running: { bg: "#DBEAFE", text: "#1D4ED8" },
  completed: { bg: "#D1FAE5", text: C.emeraldDeep },
  failed: { bg: "#FEE2E2", text: "#991B1B" },
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

function AutoContentAdmin() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<AutoImportedContent[]>([]);
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [logs, setLogs] = useState<AutoImportLog[]>([]);
  const [runs, setRuns] = useState<AutoImportRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [contentRes, sourcesRes, logsRes, runsRes] = await Promise.all([
        adminGetAutoImportedContent(filter === "all" ? undefined : filter),
        adminGetTrustedSources(),
        adminGetAutoImportLogs(50),
        adminGetAutoImportRuns(10),
      ]);
      setItems(contentRes.data || []);
      setSources(sourcesRes.data || []);
      setLogs(logsRes.data || []);
      setRuns(runsRes.data || []);
    } catch {
      showError("تعذر تحميل المحتوى المستورد.");
    } finally {
      setLoading(false);
    }
  }, [filter, showError]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return items;
    return items.filter(
      (i) =>
        (i.title ?? "").includes(q) ||
        (i.source_name ?? "").includes(q) ||
        (i.category || "").includes(q),
    );
  }, [items, search]);

  const errorLogs = useMemo(
    () => logs.filter((l) => l.status === "failed" || l.error_details),
    [logs],
  );

  const displayedLogs = showErrorsOnly ? errorLogs : logs;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerAutoContentSync();
      showSuccess(
        `تمت المزامنة: ${result.imported ?? 0} جديد، ${result.skipped ?? 0} متخطى، ${result.failed ?? 0} فشل (${Math.round((result.durationMs || 0) / 1000)}ث)`,
      );
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "فشل تشغيل المزامنة.");
    } finally {
      setSyncing(false);
    }
  };

  const handleApprove = async (id: string) => {
    const { error } = await adminApproveAutoContent(id);
    if (error) return showError(error.message);
    showSuccess("تم اعتماد المادة ونشرها — ستظهر في /updates فوراً.");
    load();
  };

  const handleReject = async (id: string) => {
    if (!confirm("رفض هذه المادة؟")) return;
    const { error } = await adminRejectAutoContent(id);
    if (error) return showError(error.message);
    showSuccess("تم رفض المادة.");
    load();
  };

  const reviewCount = items.filter((i) => i.status === "needs_review").length;
  const lastRun = runs[0];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>
            الاستيراد التلقائي للمحتوى
          </h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>
            خط أنابيب: إزالة التكرار → التحقق من المصدر → التصنيف → تحليل AI → slug → SEO → needs_review
            · Cron كل 6 ساعات
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            background: C.emerald,
            color: "white",
            border: "none",
            cursor: syncing ? "wait" : "pointer",
            opacity: syncing ? 0.7 : 1,
          }}
        >
          {syncing ? "جارٍ المزامنة..." : "▶ تشغيل المزامنة الآن"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <Stat label="قيد المراجعة" value={reviewCount} />
        <Stat label="مصادر نشطة" value={sources.filter((s) => s.is_active).length} />
        <Stat label="إجمالي المواد" value={items.length} />
        <Stat label="منشور" value={items.filter((i) => i.status === "published").length} />
        <Stat label="أخطاء السجل" value={errorLogs.length} />
      </div>

      {lastRun && (
        <div style={{ padding: "0.75rem 1rem", marginBottom: "1rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, fontSize: "0.8125rem" }}>
          <strong>آخر تشغيل:</strong>{" "}
          {formatDate(lastRun.started_at)} —{" "}
          <span style={{ color: STATUS_COLORS[lastRun.status]?.text }}>{lastRun.status}</span>
          {" · "}
          {lastRun.imported_count} مستورد، {lastRun.skipped_count} متخطى، {lastRun.failed_count} فشل
          {lastRun.duration_ms ? ` · ${Math.round(lastRun.duration_ms / 1000)}ث` : ""}
        </div>
      )}

      {sources.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: C.emeraldDeep, marginBottom: "0.5rem" }}>حالة المصادر</h3>
          <div style={{ display: "grid", gap: "0.35rem" }}>
            {sources.map((s) => (
              <div key={s.id} style={{ fontSize: "0.75rem", color: C.inkSoft, display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ color: s.is_active ? C.emeraldDeep : "#991B1B" }}>{s.is_active ? "●" : "○"}</span>
                <span>{s.name}</span>
                <span>· ثقة {s.trust_level}%</span>
                <span>· آخر مزامنة: {formatDate(s.last_synced_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث..."
        style={{ width: "100%", maxWidth: "20rem", marginBottom: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}` }}
      />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {STATUS_FILTERS.map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            style={{
              padding: "0.375rem 0.75rem",
              borderRadius: "0.375rem",
              border: `1px solid ${filter === v ? C.emerald : C.line}`,
              background: filter === v ? C.sage : C.panel,
              color: filter === v ? C.emeraldDeep : C.inkSoft,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.8125rem",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>لا توجد مواد مستوردة. شغّل المزامنة أو أضف مصادر RSS في Supabase.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {filtered.map((item) => (
            <article
              key={item.id}
              style={{
                padding: "1rem",
                borderRadius: "0.5rem",
                border: `1px solid ${C.line}`,
                background: C.panel,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: C.emeraldDeep }}>{item.title}</p>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.8125rem", color: C.inkSoft }}>
                    {item.source_name} · {item.content_type} · {item.category || "—"}
                    {item.pipeline_stage ? ` · ${item.pipeline_stage}` : ""}
                  </p>
                  {item.summary && (
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: C.ink, lineHeight: 1.6 }}>
                      {item.summary.slice(0, 200)}{item.summary.length > 200 ? "…" : ""}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "left" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                      background: STATUS_COLORS[item.status]?.bg || C.parchmentDeep,
                      color: STATUS_COLORS[item.status]?.text || C.ink,
                    }}
                  >
                    {item.status}
                  </span>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: C.inkSoft }}>
                    جودة: {item.quality_score}%
                    {item.source_verified ? " · ✓ مصدر" : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                style={{ marginTop: "0.5rem", fontSize: "0.75rem", background: "none", border: "none", color: C.brassDeep, cursor: "pointer", fontFamily: "inherit" }}
              >
                {expandedId === item.id ? "▲ إخفاء SEO" : "▼ SEO & slug"}
              </button>

              {expandedId === item.id && (
                <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: C.parchmentDeep, borderRadius: "0.375rem", fontSize: "0.8125rem" }}>
                  <p><strong>Slug:</strong> {item.slug}</p>
                  <p><strong>SEO Title:</strong> {item.seo_title || "—"}</p>
                  <p><strong>SEO Description:</strong> {item.seo_description || "—"}</p>
                  {item.tags && item.tags.length > 0 && <p><strong>Tags:</strong> {item.tags.join("، ")}</p>}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                {item.status === "needs_review" && (
                  <>
                    <button type="button" onClick={() => handleApprove(item.id)} style={btnPrimary}>اعتماد</button>
                    <button type="button" onClick={() => handleReject(item.id)} style={btnDanger}>رفض</button>
                  </>
                )}
                {item.status === "published" && item.slug && (
                  <Link href={`/updates/auto/${item.slug}`} style={btnLink}>معاينة عامة</Link>
                )}
                {item.original_url && (
                  <a href={item.original_url} target="_blank" rel="noopener noreferrer" style={btnLink}>
                    فتح المصدر
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {runs.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: C.emeraldDeep, marginBottom: "0.75rem" }}>سجل تشغيلات Pipeline</h3>
          {runs.map((run) => (
            <div key={run.id} style={{ fontSize: "0.75rem", color: C.inkSoft, padding: "0.35rem 0", borderBottom: `1px solid ${C.line}` }}>
              {formatDate(run.started_at)} — {run.trigger_type} —{" "}
              <span style={{ color: STATUS_COLORS[run.status]?.text }}>{run.status}</span>
              {" · "}
              {run.imported_count} مستورد، {run.skipped_count} متخطى، {run.failed_count} فشل
              {run.error_summary ? ` · ${run.error_summary}` : ""}
            </div>
          ))}
        </div>
      )}

      {displayedLogs.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: C.emeraldDeep, margin: 0 }}>
              سجل العمليات {showErrorsOnly ? "(أخطاء فقط)" : ""}
            </h3>
            <button
              type="button"
              onClick={() => setShowErrorsOnly(!showErrorsOnly)}
              style={{ fontSize: "0.75rem", background: "none", border: `1px solid ${C.line}`, borderRadius: "0.25rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}
            >
              {showErrorsOnly ? "عرض الكل" : "أخطاء فقط"}
            </button>
          </div>
          {displayedLogs.map((log) => (
            <div key={log.id} style={{ fontSize: "0.75rem", color: C.inkSoft, padding: "0.35rem 0", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ color: log.status === "failed" ? "#991B1B" : C.emeraldDeep }}>{log.status}</span>
              {log.pipeline_stage ? ` · ${log.pipeline_stage}` : ""}
              {" · "}
              {log.imported_count} مستورد، {log.skipped_count} متخطى
              {log.item_title ? ` · ${log.item_title.slice(0, 40)}` : ""}
              {log.message ? ` — ${log.message}` : ""}
              {log.error_details && (
                <pre style={{ margin: "0.25rem 0 0", fontSize: "0.6875rem", whiteSpace: "pre-wrap", color: "#991B1B" }}>
                  {JSON.stringify(log.error_details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: "0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.125rem 0 0", fontSize: "1.25rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</p>
    </div>
  );
}

const btnPrimary = {
  padding: "0.375rem 0.75rem",
  borderRadius: "0.375rem",
  background: C.emerald,
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: "0.8125rem",
} as const;

const btnDanger = {
  ...btnPrimary,
  background: "#dc2626",
} as const;

const btnLink = {
  padding: "0.375rem 0.75rem",
  borderRadius: "0.375rem",
  background: C.parchmentDeep,
  color: C.emeraldDeep,
  textDecoration: "none",
  fontSize: "0.8125rem",
} as const;

export default function AutoContentPage() {
  return (
    <AdminShell section="dashboard" onSectionChange={() => {}}>
      <Link href="/admin" style={{ display: "inline-block", marginBottom: "1rem", fontSize: "0.8125rem", color: C.brassDeep }}>
        ← العودة للوحة التحكم
      </Link>
      <AutoContentAdmin />
    </AdminShell>
  );
}
