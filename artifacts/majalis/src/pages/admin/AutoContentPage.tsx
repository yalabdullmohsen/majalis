import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AdminShell, useAdminShell } from "@/pages/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  adminApproveAutoContent,
  adminGetAutoImportedContent,
  adminGetAutoImportLogs,
  adminGetTrustedSources,
  adminRejectAutoContent,
  triggerAutoContentSync,
} from "@/lib/auto-content-service";
import type { AutoImportedContent, AutoImportLog, TrustedSource } from "@/lib/auto-content/auto-content-utils";

const STATUS_FILTERS = [
  ["all", "الكل"],
  ["needs_review", "قيد المراجعة"],
  ["published", "منشور"],
  ["rejected", "مرفوض"],
] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  needs_review: { bg: "#FEF3C7", text: "#92400E" },
  published: { bg: "#D1FAE5", text: C.emeraldDeep },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
};

function AutoContentAdmin() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<AutoImportedContent[]>([]);
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [logs, setLogs] = useState<AutoImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [contentRes, sourcesRes, logsRes] = await Promise.all([
        adminGetAutoImportedContent(filter === "all" ? undefined : filter),
        adminGetTrustedSources(),
        adminGetAutoImportLogs(10),
      ]);
      setItems(contentRes.data || []);
      setSources(sourcesRes.data || []);
      setLogs(logsRes.data || []);
    } catch {
      showError("تعذر تحميل المحتوى المستورد.");
    } finally {
      setLoading(false);
    }
  }, [filter, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.title.includes(q) ||
        i.source_name.includes(q) ||
        (i.category || "").includes(q),
    );
  }, [items, search]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerAutoContentSync();
      showSuccess(
        `تمت المزامنة: ${result.imported ?? 0} جديد، ${result.skipped ?? 0} متخطى، ${result.failed ?? 0} فشل`,
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
    showSuccess("تم اعتماد المادة ونشرها.");
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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>
            الاستيراد التلقائي للمحتوى
          </h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>
            مواد من مصادر RSS موثوقة — تُحفظ بحالة needs_review ولا تُعرض للعامة إلا بعد الاعتماد
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
      </div>

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
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                {item.status === "needs_review" && (
                  <>
                    <button type="button" onClick={() => handleApprove(item.id)} style={btnPrimary}>اعتماد</button>
                    <button type="button" onClick={() => handleReject(item.id)} style={btnDanger}>رفض</button>
                  </>
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

      {logs.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: C.emeraldDeep, marginBottom: "0.75rem" }}>آخر سجلات المزامنة</h3>
          {logs.map((log) => (
            <div key={log.id} style={{ fontSize: "0.75rem", color: C.inkSoft, padding: "0.25rem 0", borderBottom: `1px solid ${C.line}` }}>
              {log.status} — {log.imported_count} مستورد، {log.skipped_count} متخطى — {log.message}
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
