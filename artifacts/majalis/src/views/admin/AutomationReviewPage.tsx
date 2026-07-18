import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { invalidateLessonsCache } from "@/lib/lessons-service";
import {
  approveAutomationDraft,
  listAutomationReview,
  rejectAutomationDraft,
  reAnalyzeAutomationDraft,
  type AutomationAuditRecord,
} from "@/lib/lesson-automation-api";
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";

type DraftRow = {
  id: string;
  source_id?: string;
  source_url?: string;
  image_url?: string;
  extracted_text?: string;
  parsed_payload?: Record<string, unknown>;
  confidence_score?: number;
  automation_status?: string;
  decision_reason?: string;
  warnings?: { field: string; message: string }[];
  missing_fields?: string[];
  created_at: string;
};

const DECISION_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "#D1FAE5", text: "var(--majalis-emerald-deep)" },
  pending_review: { bg: "rgba(14,110,82,0.08)", text: "#173D35" },
  duplicate: { bg: "rgba(14,110,82,.10)", text: "#28584D" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
};

function formatDt(iso?: string) {
  if (!iso) return "\u2014";
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

function confidenceColor(score: number) {
  const pct = Math.round(score * 100);
  if (pct >= 75) return { bg: "#D1FAE5", text: "var(--majalis-emerald-deep)" };
  if (pct >= 45) return { bg: "rgba(14,110,82,0.08)", text: "#173D35" };
  return { bg: "#FEE2E2", text: "#991B1B" };
}

function AutomationReviewContent() {
  const { showSuccess, showError } = useAdminShell();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [autoPublished, setAutoPublished] = useState<AutomationAuditRecord[]>([]);
  const [duplicates, setDuplicates] = useState<AutomationAuditRecord[]>([]);
  const [rejected, setRejected] = useState<AutomationAuditRecord[]>([]);
  const [tab, setTab] = useState<"pending" | "auto" | "duplicate" | "rejected">("pending");

  const load = useCallback(() => {
    setLoading(true);
    listAutomationReview()
      .then((r) => {
        setDrafts((r.drafts as DraftRow[]) || []);
        setPendingCount(Number(r.pendingCount) || (r.drafts as DraftRow[])?.length || 0);
        setAutoPublished((r.autoPublished as AutomationAuditRecord[]) || []);
        setDuplicates((r.duplicates as AutomationAuditRecord[]) || []);
        setRejected((r.rejected as AutomationAuditRecord[]) || []);
      })
      .catch(() => {
        setDrafts([]);
        setAutoPublished([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onApprove = async (draft: DraftRow) => {
    setBusy(true);
    try {
      const res = await approveAutomationDraft(draft.id, draft.parsed_payload);
      if (!res.ok) {
        showError(res.error || res.validation?.errors?.[0]?.message || "\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u0639\u062a\u0645\u0627\u062f");
        return;
      }
      invalidateLessonsCache();
      showSuccess("\u062a\u0645 \u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u062f\u0631\u0633 \u2014 \u064a\u0638\u0647\u0631 \u0627\u0644\u0622\u0646 \u0641\u064a \u0627\u0644\u0645\u0646\u0635\u0629");
      load();
    } catch {
      showError("\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u0639\u062a\u0645\u0627\u062f");
    } finally {
      setBusy(false);
    }
  };

  const onReject = async (draftId: string) => {
    setBusy(true);
    try {
      const res = await rejectAutomationDraft(draftId);
      if (res && res.ok === false) {
        showError(res.error || "\u062a\u0639\u0630\u0631 \u0627\u0644\u0631\u0641\u0636");
        return;
      }
      showSuccess("\u062a\u0645 \u0627\u0644\u0631\u0641\u0636");
      load();
    } catch {
      showError("\u062a\u0639\u0630\u0631 \u0627\u0644\u0631\u0641\u0636");
    } finally {
      setBusy(false);
    }
  };

  const onReAnalyze = async (draftId: string) => {
    setBusy(true);
    try {
      const res = await reAnalyzeAutomationDraft(draftId);
      if (!res.ok) {
        showError(res.error || "\u062a\u0639\u0630\u0631 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u062d\u0644\u064a\u0644");
        return;
      }
      showSuccess("\u062a\u0645 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0645\u0646 \u0627\u0644\u0645\u0635\u062f\u0631");
      load();
    } catch {
      showError("\u062a\u0639\u0630\u0631 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u062d\u0644\u064a\u0644");
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    ["pending", `\u0645\u0633\u0648\u062f\u0627\u062a (${drafts.length})`],
    ["auto", `\u0645\u0646\u0634\u0648\u0631 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627 (${autoPublished.length})`],
    ["duplicate", `\u0645\u0643\u0631\u0631 (${duplicates.length})`],
    ["rejected", `\u0645\u0631\u0641\u0648\u0636 (${rejected.length})`],
  ] as const;

  return (
    <div>
      <div className="arp-header">
        <div>
          <h2 className="arp-title">\u0645\u0631\u0643\u0632 \u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0645\u062d\u062a\u0648\u0649</h2>
          <p className="arp-subtitle">
            \u0645\u0633\u0648\u062f\u0627\u062a \u0645\u0643\u062a\u0634\u0641\u0629 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627 \u0645\u0646 \u0627\u0644\u0645\u0635\u0627\u062f\u0631 \u0627\u0644\u0645\u0648\u062b\u0648\u0642\u0629 \u2014 \u0644\u0627 \u0646\u0634\u0631 \u0628\u062f\u0648\u0646 \u0645\u0631\u0627\u062c\u0639\u0629 \u0628\u0634\u0631\u064a\u0629.
          </p>
        </div>
        <div className="arp-links">
          <Link href="/admin/sources" className="arp-link">\u0627\u0644\u0645\u0635\u0627\u062f\u0631</Link>
          <Link href="/admin" className="arp-link">\u2190 \u0644\u0648\u062d\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629</Link>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="arp-notice">
          \u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 <strong>{pendingCount}</strong> {pendingCount === 1 ? "\u062f\u0631\u0633 \u062c\u062f\u064a\u062f" : "\u062f\u0631\u0648\u0633 \u062c\u062f\u064a\u062f\u0629"} \u0628\u062d\u0627\u062c\u0629 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629.
        </div>
      )}

      <div className="arp-tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="arp-tab"
            style={tab === key ? {
              "--arp-tab-border": "var(--majalis-emerald)",
              "--arp-tab-bg": "#E8F5E9",
              "--arp-tab-color": "var(--majalis-emerald-deep)",
            } as React.CSSProperties : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <SkeletonCardGrid count={6} /> : (
        <div className="arp-list">
          {tab === "pending" && drafts.map((d) => {
            const title = String(d.parsed_payload?.title || "\u0628\u062f\u0648\u0646 \u0639\u0646\u0648\u0627\u0646");
            const sc = DECISION_COLORS.pending_review;
            const conf = confidenceColor(d.confidence_score ?? 0);
            const speaker = String(d.parsed_payload?.speaker_name || d.parsed_payload?.sheikh_name || "\u2014");
            const mosque = String(d.parsed_payload?.mosque || d.parsed_payload?.location || "\u2014");
            return (
              <article key={d.id} className="arp-card">
                <div className="arp-card-grid">
                  {d.image_url ? (
                    <img src={d.image_url} alt="\u0625\u0639\u0644\u0627\u0646" loading="lazy" decoding="async" className="arp-card-thumb" />
                  ) : (
                    <div className="arp-card-placeholder">\u0628\u062f\u0648\u0646 \u0635\u0648\u0631\u0629</div>
                  )}
                  <div>
                    <div className="arp-card-meta-row">
                      <div>
                        <strong>{title}</strong>
                        <span
                          className="arp-decision-badge"
                          style={{ "--arp-db-bg": sc.bg, "--arp-db-color": sc.text } as React.CSSProperties}
                        >
                          \u0645\u0631\u0627\u062c\u0639\u0629
                        </span>
                        <span
                          className="arp-conf-badge"
                          style={{ "--arp-cb-bg": conf.bg, "--arp-cb-color": conf.text } as React.CSSProperties}
                        >
                          \u062b\u0642\u0629 {Math.round((d.confidence_score ?? 0) * 100)}%
                        </span>
                        <p className="arp-card-subtext">
                          {speaker} \u00b7 {mosque} \u00b7 {formatDt(d.created_at)}
                        </p>
                        {d.decision_reason && <p className="arp-card-reason">{d.decision_reason}</p>}
                        {d.missing_fields && d.missing_fields.length > 0 && (
                          <p className="arp-card-missing">
                            \u062d\u0642\u0648\u0644 \u0646\u0627\u0642\u0635\u0629: {d.missing_fields.join("\u060c ")}
                          </p>
                        )}
                        {d.source_url && <a href={d.source_url} target="_blank" rel="noopener noreferrer" className="arp-card-url">{d.source_url}</a>}
                      </div>
                      <div className="arp-card-actions">
                        <button type="button" disabled={busy} onClick={() => onApprove(d)} className="arp-approve-btn">\u0627\u0639\u062a\u0645\u0627\u062f</button>
                        <Link href={`/admin/content-import/url?draft=${d.id}`} className="arp-edit-link">\u062a\u0639\u062f\u064a\u0644</Link>
                        {d.source_id && (
                          <button type="button" disabled={busy} onClick={() => onReAnalyze(d.id)} className="arp-small-btn">\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u062d\u0644\u064a\u0644</button>
                        )}
                        <button type="button" disabled={busy} onClick={() => onReject(d.id)} className="arp-small-btn">\u0631\u0641\u0636</button>
                      </div>
                    </div>
                    {d.extracted_text && (
                      <details className="arp-card-text">
                        <summary>\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0633\u062a\u062e\u0631\u062c</summary>
                        <pre>{d.extracted_text.slice(0, 800)}</pre>
                      </details>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {tab === "pending" && drafts.length === 0 && <p className="arp-empty">\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0633\u0648\u062f\u0627\u062a \u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629.</p>}

          {tab === "auto" && autoPublished.map((a) => <AuditCard key={a.id} record={a} />)}
          {tab === "auto" && autoPublished.length === 0 && <p className="arp-empty">\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0646\u0627\u0635\u0631 \u0645\u0646\u0634\u0648\u0631\u0629 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627 \u0628\u0639\u062f \u2014 \u062a\u0638\u0647\u0631 \u0647\u0646\u0627 \u0639\u0646\u062f \u0627\u062c\u062a\u064a\u0627\u0632 \u0634\u0631\u0648\u0637 Phase 4.</p>}

          {tab === "duplicate" && duplicates.map((a) => <AuditCard key={a.id} record={a} />)}
          {tab === "duplicate" && duplicates.length === 0 && <p className="arp-empty">\u0644\u0627 \u062a\u0643\u0631\u0627\u0631\u0627\u062a \u0645\u0633\u062c\u0651\u0644\u0629.</p>}

          {tab === "rejected" && rejected.map((a) => <AuditCard key={a.id} record={a} />)}
          {tab === "rejected" && rejected.length === 0 && <p className="arp-empty">\u0644\u0627 \u0639\u0646\u0627\u0635\u0631 \u0645\u0631\u0641\u0648\u0636\u0629.</p>}
        </div>
      )}
    </div>
  );
}

function AuditCard({ record }: { record: AutomationAuditRecord }) {
  const sc = DECISION_COLORS[record.decision] || { bg: "var(--majalis-parchment-deep)", text: "var(--majalis-ink-soft)" };
  const title = String(record.parsed_payload?.title || record.source_url?.slice(0, 60) || "\u2014");
  return (
    <article className="arp-audit-card">
      <strong>{title}</strong>
      <span
        className="arp-audit-badge"
        style={{ "--arp-ab-bg": sc.bg, "--arp-ab-color": sc.text } as React.CSSProperties}
      >
        {record.decision}
      </span>
      <p className="arp-audit-meta">
        \u062b\u0642\u0629: {Math.round((record.confidence_score ?? 0) * 100)}% \u00b7 {formatDt(record.created_at)}
      </p>
      {record.reason && <p className="arp-audit-reason">{record.reason}</p>}
      <a href={record.source_url} target="_blank" rel="noopener noreferrer" className="arp-audit-url">{record.source_url}</a>
    </article>
  );
}

export default function AutomationReviewPage() {
  return (
    <AdminShell section="lessons" onSectionChange={() => {}}>
      <AutomationReviewContent />
    </AdminShell>
  );
}

export { AutomationReviewContent };
