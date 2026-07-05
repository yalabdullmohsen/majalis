import { useCallback, useEffect, useState } from "react";
import { invalidateLessonsCache } from "@/lib/lessons-service";
import {
  approveContentDraft,
  extractLessonFromImageFile,
  extractLessonFromUrl,
  listContentDrafts,
  rejectContentDraft,
} from "@/lib/smart-cms-api";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { useAdminShell } from "./AdminShell";

type Draft = {
  id: string;
  source_type: string;
  source_url?: string;
  extracted_data: Record<string, unknown>;
  validation_errors?: { field: string; message: string }[];
  workflow_status: string;
  created_at: string;
};

export function SmartCmsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [previewDraftId, setPreviewDraftId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listContentDrafts("pending")
      .then((res) => setDrafts((res.drafts as Draft[]) || []))
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onImage = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await extractLessonFromImageFile(file);
      if (!res.ok) {
        showError(res.error || "تعذر استخراج البيانات من الصورة");
        return;
      }
      setPreview(res.extracted || null);
      setPreviewDraftId(String(res.draft?.id || ""));
      showSuccess("تم إنشاء مسودة — بانتظار المراجعة");
      load();
    } catch {
      showError("تعذر رفع الصورة");
    } finally {
      setBusy(false);
    }
  };

  const onUrlImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await extractLessonFromUrl(trimmed);
      if (!res.ok) {
        showError(res.error || "تعذر الاستيراد من الرابط");
        return;
      }
      setPreview(res.extracted || null);
      setPreviewDraftId(String(res.draft?.id || ""));
      showSuccess("تم استيراد المسودة من الرابط");
      load();
    } catch {
      showError("تعذر الاستيراد");
    } finally {
      setBusy(false);
    }
  };

  const onApprove = async (draftId: string) => {
    setBusy(true);
    try {
      const res = await approveContentDraft(draftId, preview || undefined);
      if (!res.ok) {
        const msgs = res.validation?.errors?.map((e) => e.message).join(" — ");
        showError(msgs || res.error || "تعذر الاعتماد");
        return;
      }
      invalidateLessonsCache();
      setPreview(null);
      setPreviewDraftId(null);
      showSuccess("تم اعتماد الدرس ونشره");
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
      const res = await rejectContentDraft(draftId);
      if (res && (res as { ok?: boolean }).ok === false) {
        showError((res as { error?: string }).error || "تعذّر رفض المسودة");
        return;
      }
      showSuccess("تم رفض المسودة");
      load();
    } catch {
      showError("تعذّر رفض المسودة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 0.5rem", color: C.emeraldDeep }}>إدارة المحتوى الذكية</h2>
      <p style={{ color: C.inkSoft, marginBottom: "1.25rem", fontSize: "0.875rem" }}>
        استخراج تلقائي من صورة أو رابط — مراجعة — اعتماد — نشر في المنصة وSEO دون تعديل الكود.
      </p>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginBottom: "1.5rem" }}>
        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>أتمتة المصادر المعتمدة</h3>
          <a
            href="/admin/automation/sources"
            style={{ display: "inline-block", padding: "0.5rem 1rem", background: "rgba(14,110,82,0.08)", color: "#0E6E52", borderRadius: "0.375rem", textDecoration: "none", fontFamily: "inherit", fontWeight: 600, fontSize: "0.875rem", marginInlineEnd: "0.5rem" }}
          >
            مصادر + Auto-Publish
          </a>
          <a
            href="/admin/automation/review"
            style={{ display: "inline-block", padding: "0.5rem 1rem", background: "#FFEDD5", color: "#C2410C", borderRadius: "0.375rem", textDecoration: "none", fontFamily: "inherit", fontWeight: 600, fontSize: "0.875rem" }}
          >
            مركز المراجعة
          </a>
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>إضافة درس من صورة</h3>
          <a
            href="/admin/content-import/image"
            style={{ display: "inline-block", padding: "0.5rem 1rem", background: "#DBEAFE", color: "#1D4ED8", borderRadius: "0.375rem", textDecoration: "none", fontFamily: "inherit", fontWeight: 600, fontSize: "0.875rem" }}
          >
            فتح واجهة الاستيراد من صورة
          </a>
          <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.5rem" }}>Vision + OCR + مراجعة + اعتماد</p>
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>إضافة درس من رابط</h3>
          <a
            href="/admin/content-import/url"
            style={{ display: "inline-block", padding: "0.5rem 1rem", background: "#EDE9FE", color: "#5B21B6", borderRadius: "0.375rem", textDecoration: "none", fontFamily: "inherit", fontWeight: 600, fontSize: "0.875rem" }}
          >
            Instagram / X / YouTube / Telegram / موقع
          </a>
          <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.5rem" }}>جلب + استخراج + مراجعة + اعتماد</p>
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>رفع سريع (JSON)</h3>
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => onImage(e.target.files?.[0] || null)}
          />
          <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.5rem" }}>معاينة JSON — للاختبار السريع</p>
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>استيراد من رابط</h3>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Instagram / YouTube / X / Telegram / RSS / موقع"
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", fontFamily: "inherit" }}
          />
          <button type="button" disabled={busy} onClick={onUrlImport} style={{ padding: "0.4rem 0.75rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
            استيراد
          </button>
        </section>
      </div>

      {preview && (
        <section style={{ background: "#F0FDF4", border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.5rem", color: C.emeraldDeep }}>معاينة المسودة</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.8125rem", margin: 0, direction: "rtl" }}>{JSON.stringify(preview, null, 2)}</pre>
          {previewDraftId && (
            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
              <button type="button" disabled={busy} onClick={() => onApprove(previewDraftId)} style={{ padding: "0.4rem 0.75rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
                اعتماد ونشر
              </button>
              <button type="button" disabled={busy} onClick={() => onReject(previewDraftId)} style={{ padding: "0.4rem 0.75rem", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
                رفض
              </button>
            </div>
          )}
        </section>
      )}

      <h3 style={{ color: C.emeraldDeep, fontSize: "1rem" }}>مسودات بانتظار المراجعة ({drafts.length})</h3>
      {loading ? (
        <Loading />
      ) : drafts.length === 0 ? (
        <p style={{ color: C.inkSoft }}>لا توجد مسودات معلّقة.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {drafts.map((d) => (
            <article key={d.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.75rem" }}>
              <strong>{String(d.extracted_data?.title || "بدون عنوان")}</strong>
              <p style={{ margin: "0.25rem 0", fontSize: "0.8125rem", color: C.inkSoft }}>
                {d.source_type} · {String(d.extracted_data?.speaker_name || "")} · {new Date(d.created_at).toLocaleString("ar")}
              </p>
              {(d.validation_errors || []).length > 0 && (
                <ul style={{ margin: "0.35rem 0", paddingInlineStart: "1.1rem", color: "#b91c1c", fontSize: "0.75rem" }}>
                  {d.validation_errors!.map((e, i) => (
                    <li key={i}>{e.message}</li>
                  ))}
                </ul>
              )}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => { setPreview(d.extracted_data); setPreviewDraftId(d.id); }} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}>معاينة</button>
                <button type="button" disabled={busy} onClick={() => onApprove(d.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "inherit" }}>اعتماد</button>
                <button type="button" disabled={busy} onClick={() => onReject(d.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}>رفض</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default SmartCmsSection;
