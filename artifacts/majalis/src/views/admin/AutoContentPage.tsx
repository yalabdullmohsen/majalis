import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { arabicMatchAny } from "@/lib/arabic-search";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";
import { SkeletonCardGrid } from "@/components/ui-common";
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
  ["all", "\u0627\u0644\u0643\u0644"],
  ["needs_review", "\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629"],
  ["published", "\u0645\u0646\u0634\u0648\u0631"],
  ["rejected", "\u0645\u0631\u0641\u0648\u0636"],
] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  needs_review: { bg: "rgba(23,61,53,0.08)", text: "#173D35" },
  published: { bg: "#D1FAE5", text: "var(--majalis-emerald-deep)" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
  running: { bg: "#DBEAFE", text: "#1D4ED8" },
  completed: { bg: "#D1FAE5", text: "var(--majalis-emerald-deep)" },
  failed: { bg: "#FEE2E2", text: "#991B1B" },
};

function formatDate(iso?: string) {
  if (!iso) return "\u2014";
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="acp-stat">
      <p className="acp-stat__label">{label}</p>
      <p className="acp-stat__value">{value}</p>
    </div>
  );
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
      showError("\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0645\u0633\u062a\u0648\u0631\u062f.");
    } finally {
      setLoading(false);
    }
  }, [filter, showError]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = useMemo(
    () => items.filter((i) => arabicMatchAny([i.title ?? "", i.source_name ?? "", i.category ?? ""], search)),
    [items, search],
  );

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
        `\u062a\u0645\u062a \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629: ${result.imported ?? 0} \u062c\u062f\u064a\u062f\u060c ${result.skipped ?? 0} \u0645\u062a\u062e\u0637\u0649\u060c ${result.failed ?? 0} \u0641\u0634\u0644 (${Math.round((result.durationMs || 0) / 1000)}\u062b)`,
      );
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "\u0641\u0634\u0644 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629.");
    } finally {
      setSyncing(false);
    }
  };

  const handleApprove = async (id: string) => {
    const { error } = await adminApproveAutoContent(id);
    if (error) return showError(error.message);
    showSuccess("\u062a\u0645 \u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0645\u0627\u062f\u0629 \u0648\u0646\u0634\u0631\u0647\u0627 \u2014 \u0633\u062a\u0638\u0647\u0631 \u0641\u064a /updates \u0641\u0648\u0631\u0627\u064b.");
    load();
  };

  const handleReject = async (id: string) => {
    if (!confirm("\u0631\u0641\u0636 \u0647\u0630\u0647 \u0627\u0644\u0645\u0627\u062f\u0629\u061f")) return;
    const { error } = await adminRejectAutoContent(id);
    if (error) return showError(error.message);
    showSuccess("\u062a\u0645 \u0631\u0641\u0636 \u0627\u0644\u0645\u0627\u062f\u0629.");
    load();
  };

  const reviewCount = items.filter((i) => i.status === "needs_review").length;
  const lastRun = runs[0];

  return (
    <div>
      <div className="acp-header">
        <div>
          <h2 className="acp-title">\u0627\u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0627\u0644\u062a\u0644\u0642\u0627\u0626\u064a \u0644\u0644\u0645\u062d\u062a\u0648\u0649</h2>
          <p className="acp-subtitle">
            \u062e\u0637 \u0623\u0646\u0627\u0628\u064a\u0628: \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u062a\u0643\u0631\u0627\u0631 \u2192 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0645\u0635\u062f\u0631 \u2192 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u2192 \u062a\u062d\u0644\u064a\u0644 AI \u2192 slug \u2192 SEO \u2192 needs_review
            \u00b7 Cron \u0643\u0644 6 \u0633\u0627\u0639\u0627\u062a
          </p>
        </div>
        <button type="button" onClick={handleSync} disabled={syncing} className="acp-sync-btn">
          {syncing ? "\u062c\u0627\u0631\u0650 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629..." : "\u25b6 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0622\u0646"}
        </button>
      </div>

      <div className="acp-stats-grid">
        <Stat label="\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629" value={reviewCount} />
        <Stat label="\u0645\u0635\u0627\u062f\u0631 \u0646\u0634\u0637\u0629" value={sources.filter((s) => s.is_active).length} />
        <Stat label="\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0648\u0627\u062f" value={items.length} />
        <Stat label="\u0645\u0646\u0634\u0648\u0631" value={items.filter((i) => i.status === "published").length} />
        <Stat label="\u0623\u062e\u0637\u0627\u0621 \u0627\u0644\u0633\u062c\u0644" value={errorLogs.length} />
      </div>

      {lastRun && (
        <div className="acp-last-run">
          <strong>\u0622\u062e\u0631 \u062a\u0634\u063a\u064a\u0644:</strong>{" "}
          {formatDate(lastRun.started_at)} \u2014{" "}
          <span
            className="acp-last-run-status"
            style={{ "--acp-lrs-color": STATUS_COLORS[lastRun.status]?.text } as React.CSSProperties}
          >
            {lastRun.status}
          </span>
          {" \u00b7 "}
          {lastRun.imported_count} \u0645\u0633\u062a\u0648\u0631\u062f\u060c {lastRun.skipped_count} \u0645\u062a\u062e\u0637\u0649\u060c {lastRun.failed_count} \u0641\u0634\u0644
          {lastRun.duration_ms ? ` \u00b7 ${Math.round(lastRun.duration_ms / 1000)}\u062b` : ""}
        </div>
      )}

      {sources.length > 0 && (
        <div className="acp-sources">
          <h3 className="acp-sources-h3">\u062d\u0627\u0644\u0629 \u0627\u0644\u0645\u0635\u0627\u062f\u0631</h3>
          <div className="acp-sources-list">
            {sources.map((s) => (
              <div key={s.id} className="acp-source-item">
                <span className="acp-source-dot" style={{ "--acp-dot-color": s.is_active ? "var(--majalis-emerald-deep)" : "#991B1B" } as React.CSSProperties}>
                  {s.is_active ? "\u25cf" : "\u25cb"}
                </span>
                <span>{s.name}</span>
                <span>\u00b7 \u062b\u0642\u0629 {s.trust_level}%</span>
                <span>\u00b7 \u0622\u062e\u0631 \u0645\u0632\u0627\u0645\u0646\u0629: {formatDate(s.last_synced_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="\u0628\u062d\u062b..."
        className="acp-search"
      />

      <div className="acp-filter-row">
        {STATUS_FILTERS.map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            className="acp-filter-btn"
            style={filter === v ? {
              "--acp-fb-border": "var(--majalis-emerald)",
              "--acp-fb-bg": "var(--majalis-sage)",
              "--acp-fb-color": "var(--majalis-emerald-deep)",
            } as React.CSSProperties : undefined}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCardGrid count={6} />
      ) : filtered.length === 0 ? (
        <p className="acp-empty">\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0648\u0627\u062f \u0645\u0633\u062a\u0648\u0631\u062f\u0629. \u0634\u063a\u0651\u0644 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0623\u0648 \u0623\u0636\u0641 \u0645\u0635\u0627\u062f\u0631 RSS \u0641\u064a Supabase.</p>
      ) : (
        <div className="acp-list">
          {filtered.map((item) => (
            <article key={item.id} className="acp-card">
              <div className="acp-card-body">
                <div className="acp-card-info">
                  <p className="acp-card-title">{item.title}</p>
                  <p className="acp-card-meta">
                    {item.source_name} \u00b7 {item.content_type} \u00b7 {item.category || "\u2014"}
                    {item.pipeline_stage ? ` \u00b7 ${item.pipeline_stage}` : ""}
                  </p>
                  {item.summary && (
                    <p className="acp-card-summary">
                      {item.summary.slice(0, 200)}{item.summary.length > 200 ? "\u2026" : ""}
                    </p>
                  )}
                </div>
                <div className="acp-card-badge-area">
                  <span
                    className="acp-card-badge"
                    style={{
                      "--acp-cb-bg": STATUS_COLORS[item.status]?.bg,
                      "--acp-cb-color": STATUS_COLORS[item.status]?.text,
                    } as React.CSSProperties}
                  >
                    {item.status}
                  </span>
                  <p className="acp-card-quality">
                    \u062c\u0648\u062f\u0629: {item.quality_score}%
                    {item.source_verified ? " \u00b7 \u2713 \u0645\u0635\u062f\u0631" : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="acp-expand-btn"
              >
                {expandedId === item.id ? "\u25b2 \u0625\u062e\u0641\u0627\u0621 SEO" : "\u25bc SEO & slug"}
              </button>

              {expandedId === item.id && (
                <div className="acp-seo-box">
                  <p><strong>Slug:</strong> {item.slug}</p>
                  <p><strong>SEO Title:</strong> {item.seo_title || "\u2014"}</p>
                  <p><strong>SEO Description:</strong> {item.seo_description || "\u2014"}</p>
                  {item.tags && item.tags.length > 0 && <p><strong>Tags:</strong> {item.tags.join("\u060c ")}</p>}
                </div>
              )}

              <div className="acp-card-actions">
                {item.status === "needs_review" && (
                  <>
                    <button type="button" onClick={() => handleApprove(item.id)} className="acp-approve-btn">\u0627\u0639\u062a\u0645\u0627\u062f</button>
                    <button type="button" onClick={() => handleReject(item.id)} className="acp-reject-btn">\u0631\u0641\u0636</button>
                  </>
                )}
                {item.status === "published" && item.slug && (
                  <Link href={`/updates/auto/${item.slug}`} className="acp-view-link">\u0645\u0639\u0627\u064a\u0646\u0629 \u0639\u0627\u0645\u0629</Link>
                )}
                {item.original_url && (
                  <a href={item.original_url} target="_blank" rel="noopener noreferrer" className="acp-view-link">
                    \u0641\u062a\u062d \u0627\u0644\u0645\u0635\u062f\u0631
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {runs.length > 0 && (
        <div className="acp-runs-section">
          <h3 className="acp-section-h3">\u0633\u062c\u0644 \u062a\u0634\u063a\u064a\u0644\u0627\u062a Pipeline</h3>
          {runs.map((run) => (
            <div key={run.id} className="acp-run-item">
              {formatDate(run.started_at)} \u2014 {run.trigger_type} \u2014{" "}
              <span
                className="acp-run-status"
                style={{ "--acp-rs-color": STATUS_COLORS[run.status]?.text } as React.CSSProperties}
              >
                {run.status}
              </span>
              {" \u00b7 "}
              {run.imported_count} \u0645\u0633\u062a\u0648\u0631\u062f\u060c {run.skipped_count} \u0645\u062a\u062e\u0637\u0649\u060c {run.failed_count} \u0641\u0634\u0644
              {run.error_summary ? ` \u00b7 ${run.error_summary}` : ""}
            </div>
          ))}
        </div>
      )}

      {displayedLogs.length > 0 && (
        <div className="acp-logs-wrap">
          <div className="acp-logs-header">
            <h3 className="acp-section-h3 acp-section-h3--flush">
              \u0633\u062c\u0644 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a {showErrorsOnly ? "(\u0623\u062e\u0637\u0627\u0621 \u0641\u0642\u0637)" : ""}
            </h3>
            <button type="button" onClick={() => setShowErrorsOnly(!showErrorsOnly)} className="acp-logs-toggle">
              {showErrorsOnly ? "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" : "\u0623\u062e\u0637\u0627\u0621 \u0641\u0642\u0637"}
            </button>
          </div>
          {displayedLogs.map((log) => (
            <div key={log.id} className="acp-log-item">
              <span
                className="acp-log-status"
                style={{ "--acp-ls-color": log.status === "failed" ? "#991B1B" : "var(--majalis-emerald-deep)" } as React.CSSProperties}
              >
                {log.status}
              </span>
              {log.pipeline_stage ? ` \u00b7 ${log.pipeline_stage}` : ""}
              {" \u00b7 "}
              {log.imported_count} \u0645\u0633\u062a\u0648\u0631\u062f\u060c {log.skipped_count} \u0645\u062a\u062e\u0637\u0649
              {log.item_title ? ` \u00b7 ${log.item_title.slice(0, 40)}` : ""}
              {log.message ? ` \u2014 ${log.message}` : ""}
              {log.error_details && (
                <pre className="acp-log-err">
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

export default function AutoContentPage() {
  return (
    <AdminShell section="dashboard" onSectionChange={() => {}}>
      <Link href="/admin" className="acp-back-link">
        \u2190 \u0627\u0644\u0639\u0648\u062f\u0629 \u0644\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645
      </Link>
      <AutoContentAdmin />
    </AdminShell>
  );
}
