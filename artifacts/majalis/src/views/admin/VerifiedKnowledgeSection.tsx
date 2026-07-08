import { useCallback, useEffect, useState } from "react";
import { SkeletonCardGrid } from "@/components/ui-common";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  bootstrapVerifiedKnowledge,
  fetchVerifiedKnowledgeDashboard,
  runVerifiedKnowledgeCycle,
  type QualityGap,
  type QualityReport,
  type VerifiedKnowledgeDashboard,
} from "@/lib/verified-knowledge-service";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="svs-stat">
      <p className="svs-stat__label">{label}</p>
      <p className="svs-stat__value">{value}</p>
      {sub && <p className="svs-stat__sub">{sub}</p>}
    </div>
  );
}

function gapLabel(reason: string) {
  if (reason === "empty_section") return "\u0642\u0633\u0645 \u0641\u0627\u0631\u063a";
  if (reason === "unverified_content") return "\u0645\u062d\u062a\u0648\u0649 \u063a\u064a\u0631 \u0645\u0648\u062b\u0651\u0642";
  return reason;
}

function priorityColor(priority: QualityGap["priority"]) {
  if (priority === "high") return "#991B1B";
  if (priority === "medium") return "#0E6E52";
  return "var(--majalis-ink-soft)";
}

export function VerifiedKnowledgeSection() {
  const { showSuccess, showError } = useAdminShell();
  const [data, setData] = useState<VerifiedKnowledgeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  const report = data?.report as QualityReport | undefined;
  const sources = data?.sources;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchVerifiedKnowledgeDashboard();
      setData(result);
    } catch {
      showError("\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0644\u0648\u062d\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u0645\u0648\u062b\u0642\u0629.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRun = async (checkLinks = false) => {
    setRunning(true);
    try {
      await runVerifiedKnowledgeCycle({ checkLinks, persistVerification: true });
      showSuccess("\u0627\u0643\u062a\u0645\u0644\u062a \u062f\u0648\u0631\u0629 \u0627\u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0648\u0627\u0644\u062a\u062d\u0642\u0642.");
      await load();
    } catch {
      showError("\u0641\u0634\u0644\u062a \u062f\u0648\u0631\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u0645\u0648\u062b\u0642\u0629.");
    } finally {
      setRunning(false);
    }
  };

  const handleBootstrap = async () => {
    setBootstrapping(true);
    try {
      await bootstrapVerifiedKnowledge({ persistProvenance: true });
      showSuccess("\u0627\u0643\u062a\u0645\u0644\u062a \u062a\u0647\u064a\u0626\u0629 \u0627\u0644\u0623\u0630\u0643\u0627\u0631 \u0648\u0627\u0644\u0623\u062d\u0627\u062f\u064a\u062b.");
      await load();
    } catch {
      showError("\u0641\u0634\u0644\u062a \u062a\u0647\u064a\u0626\u0629 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0645\u0648\u062b\u0642.");
    } finally {
      setBootstrapping(false);
    }
  };

  if (loading && !data) return <SkeletonCardGrid count={6} />;

  const totals = report?.totals ?? {};
  const gaps = report?.gaps ?? [];
  const sections = report?.sections ?? {};

  return (
    <div>
      <div className="svs-header">
        <div>
          <h2 className="svs-title">\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u0645\u0648\u062b\u0642\u0629</h2>
          <p className="svs-subtitle">
            \u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0630\u0643\u064a \u2014 \u0645\u0635\u0627\u062f\u0631 \u0631\u0633\u0645\u064a\u0629 \u2014 \u0646\u0634\u0631 \u062a\u0644\u0642\u0627\u0626\u064a \u0639\u0646\u062f \u062b\u0642\u0629 \u2265 90%
          </p>
        </div>
        <div className="svs-btn-group">
          <button type="button" disabled={running} onClick={() => handleRun(false)} className="svs-btn--primary">
            {running ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u2026" : "\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u062f\u0648\u0631\u0629"}
          </button>
          <button type="button" disabled={running} onClick={() => handleRun(true)} className="svs-btn">
            \u062f\u0648\u0631\u0629 + \u0641\u062d\u0635 \u0631\u0648\u0627\u0628\u0637
          </button>
          <button type="button" disabled={bootstrapping} onClick={handleBootstrap} className="svs-btn">
            {bootstrapping ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0647\u064a\u0626\u0629\u2026" : "\u062a\u0647\u064a\u0626\u0629 \u0627\u0644\u0623\u0630\u0643\u0627\u0631/\u0627\u0644\u0623\u062d\u0627\u062f\u064a\u062b"}
          </button>
        </div>
      </div>

      <div className="svs-stats-grid">
        <StatCard label="\u0627\u0644\u0645\u0635\u0627\u062f\u0631" value={sources?.total ?? totals.sources_total ?? 0} sub={`${sources?.active ?? totals.sources_active ?? 0} \u0646\u0634\u0637`} />
        <StatCard label="\u0623\u0630\u0643\u0627\u0631 \u0645\u0648\u062b\u0651\u0642\u0629" value={totals.verified_adhkar ?? 0} />
        <StatCard label="\u0623\u062d\u0627\u062f\u064a\u062b \u0645\u0648\u062b\u0651\u0642\u0629" value={totals.verified_hadith ?? 0} />
        <StatCard label="\u0633\u062c\u0644 \u0627\u0644\u0645\u0635\u0627\u062f\u0631" value={totals.provenance_verified ?? 0} />
        <StatCard label="\u0641\u062c\u0648\u0627\u062a" value={totals.gaps_count ?? gaps.length} />
        <StatCard label="Seed corpus" value={totals.seed_corpus_total ?? 0} />
      </div>

      {(report?.recommendations?.length ?? 0) > 0 && (
        <div className="vks-recs">
          <p className="vks-recs-title">\u062a\u0648\u0635\u064a\u0627\u062a</p>
          <ul className="vks-recs-list">
            {report?.recommendations?.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="svs-section-h3">\u0641\u062c\u0648\u0627\u062a \u0627\u0644\u0645\u062d\u062a\u0648\u0649</h3>
      <div className="svs-table-wrap">
        <table className="svs-table">
          <thead>
            <tr className="svs-thead-row">
              <th className="svs-th">\u0627\u0644\u0642\u0633\u0645</th>
              <th className="svs-th">\u0627\u0644\u0633\u0628\u0628</th>
              <th className="svs-th">\u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629</th>
            </tr>
          </thead>
          <tbody>
            {gaps.length === 0 ? (
              <tr>
                <td colSpan={3} className="svs-td svs-td--center">
                  \u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u062c\u0648\u0627\u062a \u2014 \u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u062a\u062d\u062a\u0648\u064a \u0639\u0644\u0649 \u0645\u062d\u062a\u0648\u0649
                </td>
              </tr>
            ) : (
              gaps.map((gap) => (
                <tr key={`${gap.section}-${gap.reason}`}>
                  <td className="svs-td">{gap.section}</td>
                  <td className="svs-td">{gapLabel(gap.reason)}</td>
                  <td
                    className="vks-td--priority"
                    style={{ "--vks-priority-color": priorityColor(gap.priority) } as React.CSSProperties}
                  >
                    {gap.priority}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className="svs-section-h3">\u062c\u0648\u062f\u0629 \u0627\u0644\u0623\u0642\u0633\u0627\u0645</h3>
      <div className="svs-table-wrap">
        <table className="svs-table">
          <thead>
            <tr className="svs-thead-row">
              <th className="svs-th">\u0627\u0644\u0642\u0633\u0645</th>
              <th className="svs-th">Seed</th>
              <th className="svs-th">DB</th>
              <th className="svs-th">\u0645\u0648\u062b\u0651\u0642</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sections).map(([key, stats]) => (
              <tr key={key}>
                <td className="svs-td">{key}</td>
                <td className="svs-td">
                  {stats.seed ?? stats.seed_items ?? stats.seed_categories ?? "\u2014"}
                </td>
                <td className="svs-td">{stats.db?.total ?? 0}</td>
                <td className="svs-td svs-td--accent">{stats.db?.verified ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="svs-section-h3">\u0633\u062c\u0644 \u0627\u0644\u0645\u0635\u0627\u062f\u0631 \u0627\u0644\u0631\u0633\u0645\u064a\u0629</h3>
      <div className="svs-table-wrap">
        <table className="svs-table">
          <thead>
            <tr className="svs-thead-row">
              <th className="svs-th">\u0627\u0644\u0645\u0635\u062f\u0631</th>
              <th className="svs-th">\u0627\u0644\u0646\u0648\u0639</th>
              <th className="svs-th">\u0627\u0644\u062b\u0642\u0629</th>
              <th className="svs-th">\u0627\u0644\u062d\u0627\u0644\u0629</th>
            </tr>
          </thead>
          <tbody>
            {(sources?.sources ?? []).slice(0, 30).map((src) => (
              <tr key={src.slug}>
                <td className="svs-td">{src.name_ar ?? src.name}</td>
                <td className="svs-td">{src.import_method ?? src.source_type}</td>
                <td className="svs-td">{src.trust_level}%</td>
                <td
                  className="vks-td--active"
                  style={{ "--vks-src-color": src.is_active ? "var(--majalis-emerald-deep)" : "var(--majalis-ink-soft)" } as React.CSSProperties}
                >
                  {src.is_active ? "\u0646\u0634\u0637" : "\u0645\u0639\u0637\u0651\u0644"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
