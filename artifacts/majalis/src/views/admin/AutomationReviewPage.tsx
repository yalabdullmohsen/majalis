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
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
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

function confidenceColor(score: number) {
  const pct = Math.round(score * 100);
  if (pct >= 75) return { bg: "#D1FAE5", text: C.emeraldDeep };
  if (pct >= 45) return { bg: "#FEF3C7", text: "#92400E" };
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
        showError(res.error || res.validation?.errors?.[0]?.message || "تعذر الاعتماد");
        return;
      }
      invalidateLessonsCache();
      showSuccess("تم اعتماد الدرس — يظهر الآن في المنصة");
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

  const onReAnalyze = async (draftId: string) => {
    setBusy(true);
    try {
      const res = await reAnalyzeAutomationDraft(draftId);
      if (!res.ok) {
        showError(res.error || "تعذر إعادة التحليل");
        return;
      }
      showSuccess("تم إعادة التحليل من المصدر");
      load();
    } catch {
      showError("تعذر إعادة التحليل");
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
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>مركز مراجعة المحتوى</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            مسودات مكتشفة تلقائيًا من المصادر الموثوقة — لا نشر بدون مراجعة بشرية.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8125rem" }}>
          <Link href="/admin/sources" style={{ color: C.emeraldDeep }}>المصادر</Link>
          <Link href="/admin" style={{ color: C.emeraldDeep }}>← لوحة الإدارة</Link>
        </div>
      </div>

      {pendingCount > 0 && (
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#1E40AF" }}>
          تم العثور على <strong>{pendingCount}</strong> {pendingCount === 1 ? "درس جديد" : "دروس جديدة"} بحاجة للمراجعة.
        </div>
      )}

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
            const conf = confidenceColor(d.confidence_score ?? 0);
            const speaker = String(d.parsed_payload?.speaker_name || d.parsed_payload?.sheikh_name || "—");
            const mosque = String(d.parsed_payload?.mosque || d.parsed_payload?.location || "—");
            return (
              <article key={d.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.875rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 160px) 1fr", gap: "0.875rem" }}>
                  {d.image_url ? (
                    <img src={d.image_url} alt="إعلان" loading="lazy" decoding="async" style={{ width: "100%", borderRadius: "0.375rem", objectFit: "cover", maxHeight: "180px" }} />
                  ) : (
                    <div style={{ background: C.parchmentDeep, borderRadius: "0.375rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: C.inkSoft, minHeight: "100px" }}>
                      بدون صورة
                    </div>
                  )}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <strong>{title}</strong>
                        <span style={{ marginInlineStart: "0.5rem", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: sc.bg, color: sc.text, fontSize: "0.7rem" }}>مراجعة</span>
                        <span style={{ marginInlineStart: "0.35rem", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: conf.bg, color: conf.text, fontSize: "0.7rem" }}>
                          ثقة {Math.round((d.confidence_score ?? 0) * 100)}%
                        </span>
                        <p style={{ margin: "0.35rem 0", fontSize: "0.8125rem", color: C.inkSoft }}>
                          {speaker} · {mosque} · {formatDt(d.created_at)}
                        </p>
                        {d.decision_reason && <p style={{ margin: 0, fontSize: "0.75rem", color: "#92400E" }}>{d.decision_reason}</p>}
                        {d.missing_fields && d.missing_fields.length > 0 && (
                          <p style={{ margin: "0.25rem 0", fontSize: "0.75rem", color: "#991B1B" }}>
                            حقول ناقصة: {d.missing_fields.join("، ")}
                          </p>
                        )}
                        {d.source_url && <a href={d.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem" }}>{d.source_url}</a>}
                      </div>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignContent: "flex-start" }}>
                        <button type="button" disabled={busy} onClick={() => onApprove(d)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "inherit" }}>اعتماد</button>
                        <Link href={`/admin/content-import/url?draft=${d.id}`} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, textDecoration: "none", color: C.emeraldDeep, display: "inline-flex", alignItems: "center" }}>تعديل</Link>
                        {d.source_id && (
                          <button type="button" disabled={busy} onClick={() => onReAnalyze(d.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}>إعادة التحليل</button>
                        )}
                        <button type="button" disabled={busy} onClick={() => onReject(d.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}>رفض</button>
                      </div>
                    </div>
                    {d.extracted_text && (
                      <details style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: C.inkSoft }}>
                        <summary style={{ cursor: "pointer" }}>النص المستخرج</summary>
                        <pre style={{ whiteSpace: "pre-wrap", margin: "0.35rem 0 0", maxHeight: "120px", overflow: "auto" }}>{d.extracted_text.slice(0, 800)}</pre>
                      </details>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {tab === "pending" && drafts.length === 0 && <p style={{ color: C.inkSoft }}>لا توجد مسودات بانتظار المراجعة.</p>}

          {tab === "auto" && autoPublished.map((a) => (
            <AuditCard key={a.id} record={a} />
          ))}
          {tab === "auto" && autoPublished.length === 0 && <p style={{ color: C.inkSoft }}>لا توجد عناصر منشورة تلقائيًا بعد — تظهر هنا عند اجتياز شروط Phase 4.</p>}

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
