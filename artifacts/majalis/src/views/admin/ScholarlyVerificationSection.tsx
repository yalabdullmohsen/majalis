import { useCallback, useEffect, useState } from "react";
import { Loading } from "@/components/ui-common";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  fetchScholarlyDashboard,
  runScholarlyScan,
  searchScholarly,
  type ScholarlyDashboard,
  type ScholarlyVerificationReport,
} from "@/lib/scholarly-verification-service";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="svs-stat">
      <p className="svs-stat__label">{label}</p>
      <p className="svs-stat__value">{value}</p>
      {sub && <p className="svs-stat__sub">{sub}</p>}
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
      showError("\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u0648\u062b\u064a\u0642 \u0627\u0644\u0639\u0644\u0645\u064a.");
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
      showSuccess("\u0627\u0643\u062a\u0645\u0644 \u0641\u062d\u0635 \u0627\u0644\u062a\u0648\u062b\u064a\u0642.");
      await load();
    } catch {
      showError("\u0641\u0634\u0644 \u0641\u062d\u0635 \u0627\u0644\u062a\u0648\u062b\u064a\u0642.");
    } finally {
      setScanning(false);
    }
  };

  const handleSearch = async () => {
    try {
      const result = await searchScholarly({ query: searchQ, limit: 20 });
      setSearchResults(result.results ?? []);
    } catch {
      showError("\u0641\u0634\u0644 \u0627\u0644\u0628\u062d\u062b \u0627\u0644\u0639\u0644\u0645\u064a.");
    }
  };

  if (loading && !data) return <Loading />;

  const sectionStats = report?.section_stats ?? {};

  return (
    <div>
      <div className="svs-header">
        <div>
          <h2 className="svs-title">\u0627\u0644\u062a\u0648\u062b\u064a\u0642 \u0648\u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0639\u0644\u0645\u064a</h2>
          <p className="svs-subtitle">
            \u0644\u0627 \u0646\u0634\u0631 \u0628\u062f\u0648\u0646 \u0645\u0635\u062f\u0631 \u2014 \u0645\u0631\u0627\u062c\u0639\u0629 \u0634\u0627\u0645\u0644\u0629 \u0642\u0628\u0644 \u0627\u0644\u0638\u0647\u0648\u0631 \u0627\u0644\u0639\u0627\u0645
          </p>
        </div>
        <div className="svs-btn-group">
          <button type="button" disabled={scanning} onClick={() => handleScan(false)} className="svs-btn--primary">
            {scanning ? "\u062c\u0627\u0631\u064a \u0627\u0644\u0641\u062d\u0635\u2026" : "\u0641\u062d\u0635 \u0627\u0644\u062a\u0648\u062b\u064a\u0642"}
          </button>
          <button type="button" disabled={scanning} onClick={() => handleScan(true)} className="svs-btn">
            \u0641\u062d\u0635 + \u0631\u0648\u0627\u0628\u0637
          </button>
        </div>
      </div>

      <div className="svs-stats-grid">
        <StatCard label="\u0627\u0643\u062a\u0645\u0627\u0644 \u0627\u0644\u062a\u0648\u062b\u064a\u0642" value={`${report?.documentation_completeness_percent ?? 0}%`} />
        <StatCard label="\u0645\u0648\u062b\u0651\u0642" value={report?.verified_count ?? 0} />
        <StatCard label="\u064a\u062d\u062a\u0627\u062c \u0645\u0631\u0627\u062c\u0639\u0629" value={report?.needs_review_count ?? 0} />
        <StatCard label="\u0645\u0631\u0641\u0648\u0636" value={report?.rejected_count ?? 0} />
        <StatCard label="\u0645\u0643\u0631\u0631" value={report?.duplicate_count ?? 0} />
        <StatCard label="\u0631\u0648\u0627\u0628\u0637 \u0645\u0639\u0637\u0644\u0629" value={report?.broken_links_count ?? 0} />
        <StatCard label="\u062c\u0627\u0647\u0632\u064a\u0629 \u0627\u0644\u0645\u0631\u062c\u0639" value={`${report?.readiness_score ?? 0}%`} sub={`${report?.items_scanned ?? 0} \u0639\u0646\u0635\u0631`} />
      </div>

      <h3 className="svs-section-h3">\u062c\u0648\u062f\u0629 \u0643\u0644 \u0642\u0633\u0645</h3>
      <div className="svs-table-wrap">
        <table className="svs-table">
          <thead>
            <tr className="svs-thead-row">
              <th className="svs-th">\u0627\u0644\u0642\u0633\u0645</th>
              <th className="svs-th">\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a</th>
              <th className="svs-th">\u0645\u0648\u062b\u0651\u0642</th>
              <th className="svs-th">\u0645\u0631\u0627\u062c\u0639\u0629</th>
              <th className="svs-th">\u0645\u0631\u0641\u0648\u0636</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sectionStats).map(([type, stats]) => (
              <tr key={type}>
                <td className="svs-td">{type}</td>
                <td className="svs-td">{stats.total}</td>
                <td className="svs-td svs-td--accent">{stats.verified}</td>
                <td className="svs-td">{stats.needs_review}</td>
                <td className="svs-td svs-td--red">{stats.rejected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="svs-section-h3">\u0628\u062d\u062b \u0639\u0644\u0645\u064a \u0645\u062a\u0642\u062f\u0645</h3>
      <div className="svs-search-row">
        <input
          type="search"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="\u0645\u0635\u062f\u0631\u060c \u0645\u0624\u0644\u0641\u060c \u0639\u0646\u0648\u0627\u0646\u2026"
          className="svs-search-input"
        />
        <button type="button" onClick={handleSearch} className="svs-search-btn">
          \u0628\u062d\u062b
        </button>
      </div>
      {searchResults.length > 0 && (
        <ul className="svs-results">
          {searchResults.map((r, i) => (
            <li key={`${r.content_id}-${i}`}>
              <strong>{String(r.title ?? r.content_id)}</strong> \u2014 {String(r.source_name)} ({String(r.verification_status)})
            </li>
          ))}
        </ul>
      )}

      {report?.next_priorities && report.next_priorities.length > 0 && (
        <div className="svs-priorities">
          <h3 className="svs-priorities-h3">\u0623\u0648\u0644\u0648\u064a\u0627\u062a \u0627\u0644\u062a\u0637\u0648\u064a\u0631</h3>
          <ul className="svs-priorities-ul">
            {report.next_priorities.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
