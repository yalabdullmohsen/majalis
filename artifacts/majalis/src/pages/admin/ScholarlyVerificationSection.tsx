import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { useAdminShell } from "@/pages/admin/AdminShell";
import {
  fetchScholarlyDashboard,
  runScholarlyScan,
  searchScholarly,
  type ScholarlyDashboard,
  type ScholarlyVerificationReport,
} from "@/lib/scholarly-verification-service";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</p>
      {sub && <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: C.inkSoft }}>{sub}</p>}
    </div>
  );
}

export function ScholarlyVerificationSection() {
  const { showSuccess, showError } = useAdminShell();
  const [data, setData] = useState<ScholarlyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Array<Record<string, unknown>>>([]);

  const report = data?.report as ScholarlyVerificationReport | undefined;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchScholarlyDashboard();
      setData(result);
    } catch {
      showError("تعذر تحميل لوحة التوثيق العلمي.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleScan = async (checkLinks = false) => {
    setScanning(true);
    try {
      await runScholarlyScan({ checkLinks, persist: false });
      showSuccess("اكتمل فحص التوثيق.");
      await load();
    } catch {
      showError("فشل فحص التوثيق.");
    } finally {
      setScanning(false);
    }
  };

  const handleSearch = async () => {
    try {
      const result = await searchScholarly({ query: searchQ, limit: 20 });
      setSearchResults(result.results ?? []);
    } catch {
      showError("فشل البحث العلمي.");
    }
  };

  if (loading && !data) return <Loading />;

  const sectionStats = report?.section_stats ?? {};

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, color: C.emeraldDeep }}>التوثيق والتحقق العلمي</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: C.inkSoft }}>
            لا نشر بدون مصدر — مراجعة شاملة قبل الظهور العام
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={scanning}
            onClick={() => handleScan(false)}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: C.emerald, color: "#fff", cursor: "pointer" }}
          >
            {scanning ? "جاري الفحص…" : "فحص التوثيق"}
          </button>
          <button
            type="button"
            disabled={scanning}
            onClick={() => handleScan(true)}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer" }}
          >
            فحص + روابط
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <StatCard label="اكتمال التوثيق" value={`${report?.documentation_completeness_percent ?? 0}%`} />
        <StatCard label="موثّق" value={report?.verified_count ?? 0} />
        <StatCard label="يحتاج مراجعة" value={report?.needs_review_count ?? 0} />
        <StatCard label="مرفوض" value={report?.rejected_count ?? 0} />
        <StatCard label="مكرر" value={report?.duplicate_count ?? 0} />
        <StatCard label="روابط معطلة" value={report?.broken_links_count ?? 0} />
        <StatCard label="جاهزية المرجع" value={`${report?.readiness_score ?? 0}%`} sub={`${report?.items_scanned ?? 0} عنصر`} />
      </div>

      <h3 style={{ color: C.emeraldDeep }}>جودة كل قسم</h3>
      <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ textAlign: "right", background: C.panel }}>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>القسم</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>الإجمالي</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>موثّق</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>مراجعة</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>مرفوض</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sectionStats).map(([type, stats]) => (
              <tr key={type}>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{type}</td>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{stats.total}</td>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}`, color: C.emeraldDeep }}>{stats.verified}</td>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{stats.needs_review}</td>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}`, color: "#991B1B" }}>{stats.rejected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ color: C.emeraldDeep }}>بحث علمي متقدم</h3>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          type="search"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="مصدر، مؤلف، عنوان…"
          style={{ flex: 1, minWidth: "200px", padding: "0.5rem", borderRadius: "0.375rem", border: `1px solid ${C.line}` }}
        />
        <button type="button" onClick={handleSearch} style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: C.emerald, color: "#fff" }}>
          بحث
        </button>
      </div>
      {searchResults.length > 0 && (
        <ul style={{ fontSize: "0.875rem", paddingInlineStart: "1.25rem" }}>
          {searchResults.map((r, i) => (
            <li key={`${r.content_id}-${i}`}>
              <strong>{String(r.title ?? r.content_id)}</strong> — {String(r.source_name)} ({String(r.verification_status)})
            </li>
          ))}
        </ul>
      )}

      {report?.next_priorities && report.next_priorities.length > 0 && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}` }}>
          <h3 style={{ margin: "0 0 0.5rem", color: C.emeraldDeep }}>أولويات التطوير</h3>
          <ul style={{ margin: 0, paddingInlineStart: "1.25rem", color: C.inkSoft, fontSize: "0.875rem" }}>
            {report.next_priorities.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
