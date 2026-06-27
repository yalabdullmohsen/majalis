import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { invalidateLessonsCache } from "@/lib/lessons-service";
import {
  approveAutomationDraft,
  listAutomationReview,
  rejectAutomationDraft,
  type AutomationAuditRecord,
} from "@/lib/lesson-automation-api";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";

type DraftRow = {
  id: string;
  source_url?: string;
  parsed_payload?: Record<string, unknown>;
  confidence_score?: number;
  automation_status?: string;
  decision_reason?: string;
  created_at: string;
};

const DECISION_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "#D1FAE5", text: C.emeraldDeep },
  pending_review: { bg: "#FEF3C7", text: "#92400E" },
  duplicate: { bg: "#FFEDD5", text: "#C2410C" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
};

function formatDt(iso?: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

function AutomationReviewContent() {
  const { showSuccess, showError } = useAdminShell();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [autoPublished, setAutoPublished] = useState<AutomationAuditRecord[]>([]);
  const [duplicates, setDuplicates] = useState<AutomationAuditRecord[]>([]);
  const [rejected, setRejected] = useState<AutomationAuditRecord[]>([]);
  const [tab, setTab] = useState<"pending" | "auto" | "duplicate" | "rejected">("pending");

  const load = useCallback(() => {
    setLoading(true);
    listAutomationReview()
      .then((r) => {
        setDrafts((r.drafts as DraftRow[]) || []);
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
        showError(res.error || res.validation?.errors?.[0]?.message || "تعذر الاعتماد");
        return;
      }
      invalidateLessonsCache();
      showSuccess("تم اعتماد الدرس");
      load();
    } catch {
      showError("تعذر الاعتماد");
    } finally {
      setBusy(false);
    }
  };

  const onReject = async (draftId: string) => {
    setBusy(true);
    try {
      await rejectAutomationDraft(draftId);
      showSuccess("تم الرفض");
      load();
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    ["pending", `مسودات (${drafts.length})`],
    ["auto", `منشور تلقائيًا (${autoPublished.length})`],
    ["duplicate", `مكرر (${duplicates.length})`],
    ["rejected", `مرفوض (${rejected.length})`],
  ] as const;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>مركز مراجعة الأتمتة</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            مسودات مشكوك فيها، منشورات تلقائية، وتكرارات — لا نشر تلقائي بدون استيفاء الشروط.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8125rem" }}>
          <Link href="/admin/automation/sources" style={{ color: C.emeraldDeep }}>المصادر</Link>
          <Link href="/admin" style={{ color: C.emeraldDeep }}>← لوحة الإدارة</Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              border: `1px solid ${tab === key ? C.emerald : C.line}`,
              background: tab === key ? "#E8F5E9" : C.panel,
              color: tab === key ? C.emeraldDeep : C.inkSoft,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.8125rem",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {tab === "pending" && drafts.map((d) => {
            const title = String(d.parsed_payload?.title || "بدون عنوان");
            const sc = DECISION_COLORS.pending_review;
            return (
              <article key={d.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <strong>{title}</strong>
                    <span style={{ marginInlineStart: "0.5rem", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: sc.bg, color: sc.text, fontSize: "0.7rem" }}>مراجعة</span>
                    <p style={{ margin: "0.25rem 0", fontSize: "0.8125rem", color: C.inkSoft }}>
                      ثقة: {Math.round((d.confidence_score ?? 0) * 100)}% · {formatDt(d.created_at)}
                    </p>
                    {d.decision_reason && <p style={{ margin: 0, fontSize: "0.75rem", color: "#92400E" }}>{d.decision_reason}</p>}
                    {d.source_url && <a href={d.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem" }}>{d.source_url}</a>}
                  </div>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <button type="button" disabled={busy} onClick={() => onApprove(d)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "inherit" }}>اعتماد</button>
                    <button type="button" disabled={busy} onClick={() => onReject(d.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}>رفض</button>
                  </div>
                </div>
              </article>
            );
          })}

          {tab === "pending" && drafts.length === 0 && <p style={{ color: C.inkSoft }}>لا توجد مسودات بانتظار المراجعة.</p>}

          {tab === "auto" && autoPublished.map((a) => (
            <AuditCard key={a.id} record={a} />
          ))}
          {tab === "auto" && autoPublished.length === 0 && <p style={{ color: C.inkSoft }}>لا توجد عناصر منشورة تلقائيًا بعد.</p>}

          {tab === "duplicate" && duplicates.map((a) => (
            <AuditCard key={a.id} record={a} />
          ))}
          {tab === "duplicate" && duplicates.length === 0 && <p style={{ color: C.inkSoft }}>لا تكرارات مسجّلة.</p>}

          {tab === "rejected" && rejected.map((a) => (
            <AuditCard key={a.id} record={a} />
          ))}
          {tab === "rejected" && rejected.length === 0 && <p style={{ color: C.inkSoft }}>لا عناصر مرفوضة.</p>}
        </div>
      )}
    </div>
  );
}

function AuditCard({ record }: { record: AutomationAuditRecord }) {
  const sc = DECISION_COLORS[record.decision] || { bg: C.parchmentDeep, text: C.inkSoft };
  const title = String(record.parsed_payload?.title || record.source_url?.slice(0, 60) || "—");
  return (
    <article style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.875rem" }}>
      <strong>{title}</strong>
      <span style={{ marginInlineStart: "0.5rem", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: sc.bg, color: sc.text, fontSize: "0.7rem" }}>{record.decision}</span>
      <p style={{ margin: "0.25rem 0", fontSize: "0.8125rem", color: C.inkSoft }}>
        ثقة: {Math.round((record.confidence_score ?? 0) * 100)}% · {formatDt(record.created_at)}
      </p>
      {record.reason && <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{record.reason}</p>}
      <a href={record.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem" }}>{record.source_url}</a>
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
