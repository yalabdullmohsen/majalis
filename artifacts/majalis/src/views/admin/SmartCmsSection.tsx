import { useCallback, useEffect, useState } from "react";
import { invalidateLessonsCache } from "@/lib/lessons-service";
import {
  approveContentDraft,
  extractFromRawText,
  extractLessonFromImageFile,
  extractLessonFromUrl,
  listContentDrafts,
  rejectContentDraft,
} from "@/lib/smart-cms-api";
import { SkeletonCardGrid } from "@/components/ui-common";
import { useAdminShell } from "./AdminShell";

const ERROR_MESSAGES: Record<string, string> = {
  unknown_action:    "تعذّر تحليل المحتوى — يُرجى المحاولة مرة أخرى.",
  missing_text:      "يُرجى إدخال نص قبل التحليل.",
  missing_image:     "يُرجى رفع صورة.",
  missing_url:       "يُرجى إدخال رابط صحيح.",
  draft_not_found:   "لم يُعثر على المسودة.",
  extraction_failed: "تعذّر تحليل المحتوى — يُرجى المحاولة مرة أخرى.",
  credit_exhausted:  "رصيد API منتهٍ — يُرجى التواصل مع المشرف.",
  invalid_api_key:   "مفتاح API غير صالح — يُرجى التواصل مع المشرف.",
  rate_limit:        "تجاوزت حد الطلبات، انتظر دقيقة ثم أعد المحاولة.",
  timeout:           "انتهت مهلة الاتصال — يُرجى المحاولة مرة أخرى.",
  no_key:            "خدمة الذكاء الاصطناعي غير مضبوطة — تواصل مع المشرف.",
  network_error:     "تعذّر الاتصال بالخادم — تحقق من الشبكة وأعد المحاولة.",
  server_error:      "خطأ مؤقت في الخادم — يُرجى المحاولة مرة أخرى.",
  supabase_admin_missing: "تعذّر حفظ المسودة — تعذّر الاتصال بقاعدة البيانات.",
};

function translateError(raw?: string): string {
  if (!raw) return "تعذّر العملية.";
  return ERROR_MESSAGES[raw] ?? raw.replace(/_/g, " ");
}

type Draft = {
  id: string;
  source_type: string;
  source_url?: string;
  extracted_data: Record<string, unknown>;
  validation_errors?: { field: string; message: string }[];
  workflow_status: string;
  created_at: string;
};

type InputMode = "text" | "url" | "image";

const CONTENT_HINTS = [
  "درس أسبوعي", "قصة إسلامية", "حديث شريف", "فتوى", "مقال", "خبر",
  "إعلان", "مناسبة", "سيرة", "ترجمة عالم", "كتاب",
];

const TAB_LABELS: Record<InputMode, string> = { text: "لصق نص", url: "رابط", image: "صورة" };

export function SmartCmsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<InputMode>("text");

  const [rawText, setRawText] = useState("");
  const [hint, setHint] = useState("");
  const [url, setUrl] = useState("");

  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [previewDraftId, setPreviewDraftId] = useState<string | null>(null);
  const [previewEditing, setPreviewEditing] = useState(false);
  const [previewJson, setPreviewJson] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    listContentDrafts("pending")
      .then((res) => setDrafts((res.drafts as Draft[]) || []))
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSuccess = (res: { ok: boolean; error?: string; message?: string; extracted?: Record<string, unknown>; draft?: Record<string, unknown> }) => {
    if (!res.ok) { showError(res.message || translateError(res.error)); return false; }
    const ext = res.extracted || {};
    setPreview(ext);
    setPreviewJson(JSON.stringify(ext, null, 2));
    setPreviewDraftId(String(res.draft?.id || ""));
    showSuccess("تم التحليل — راجع المسودة وأكملها ثم اعتمدها");
    load();
    return true;
  };

  const onTextAnalyze = async () => {
    const text = rawText.trim();
    if (!text) return;
    setBusy(true);
    try {
      const res = await extractFromRawText(text, hint || undefined);
      handleSuccess(res);
    } catch { showError("تعذّر التحليل"); }
    finally { setBusy(false); }
  };

  const onImage = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await extractLessonFromImageFile(file);
      handleSuccess(res);
    } catch { showError("تعذّر رفع الصورة"); }
    finally { setBusy(false); }
  };

  const onUrlImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await extractLessonFromUrl(trimmed);
      handleSuccess(res);
    } catch { showError("تعذّر الاستيراد"); }
    finally { setBusy(false); }
  };

  const onApprove = async (draftId: string) => {
    setBusy(true);
    try {
      const data = previewEditing
        ? (() => { try { return JSON.parse(previewJson); } catch { return preview; } })()
        : preview;
      const res = await approveContentDraft(draftId, data || undefined);
      if (!res.ok) { showError(res.validation?.errors?.map((e: { message: string }) => e.message).join(" — ") || translateError(res.error) || "تعذّر الاعتماد"); return; }
      invalidateLessonsCache();
      setPreview(null); setPreviewDraftId(null); setPreviewEditing(false);
      showSuccess("تم اعتماد المحتوى ونشره");
      load();
    } catch { showError("تعذّر الاعتماد"); }
    finally { setBusy(false); }
  };

  const onReject = async (draftId: string) => {
    setBusy(true);
    try {
      await rejectContentDraft(draftId);
      showSuccess("تم رفض المسودة");
      setPreview(null); setPreviewDraftId(null);
      load();
    } catch { showError("تعذّر رفض المسودة"); }
    finally { setBusy(false); }
  };

  return (
    <div dir="rtl" className="scm-wrapper">
      <div className="scm-header">
        <h2 className="scm-title">المساعد الذكي لإدارة المحتوى</h2>
        <p className="scm-subtitle">
          الصق أي نص أو أدخل رابطاً أو ارفع صورة — يحلّل المحتوى تلقائياً ويعبّئ جميع الحقول، ثم أكمل المراجعة واعتمده.
        </p>
      </div>

      <div className="scm-tabs">
        {(["text", "url", "image"] as InputMode[]).map((m) => (
          <button
            key={m}
            className="scm-tab"
            style={{ "--scm-tab-bg": mode === m ? "var(--majalis-emerald)" : "rgba(255,255,255,0.06)", "--scm-tab-color": mode === m ? "#fff" : "var(--majalis-ink-soft)" } as React.CSSProperties}
            onClick={() => setMode(m)}
          >
            {TAB_LABELS[m]}
          </button>
        ))}
      </div>

      <section className="scm-input-panel">
        {mode === "text" && (
          <div className="scm-input-group">
            <div>
              <label className="scm-hint-label">
                نوع المحتوى (اختياري — يُساعد الذكاء الاصطناعي على التحليل)
              </label>
              <div className="scm-hints-row">
                {CONTENT_HINTS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHint(hint === h ? "" : h)}
                    className="scm-hint-btn"
                    style={{
                      "--scm-hb-border": hint === h ? "var(--majalis-emerald)" : "rgba(255,255,255,0.12)",
                      "--scm-hb-bg": hint === h ? "rgba(46,139,103,0.15)" : "transparent",
                      "--scm-hb-color": hint === h ? "var(--majalis-emerald)" : "var(--majalis-ink-muted)",
                      "--scm-hb-fw": hint === h ? "700" : "400",
                    } as React.CSSProperties}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="ai-raw-text" className="scm-hint-label">
                المحتوى الخام (درس، قصة، حديث، فتوى، مقال، خبر…)
              </label>
              <textarea
                id="ai-raw-text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="الصق هنا أي نص: درس كامل، قصة، حديث، فتوى، مقال، إعلان، مناسبة، سيرة، ترجمة، أو أي محتوى آخر…"
                rows={9}
                className="scm-textarea"
              />
              <div className="scm-textarea-footer">
                <span className="scm-char-count">{rawText.length} حرف</span>
                <div className="scm-textarea-actions">
                  {rawText && (
                    <button type="button" onClick={() => setRawText("")} className="scm-clear-btn">
                      مسح
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onTextAnalyze}
                    disabled={busy || !rawText.trim()}
                    className="scm-analyze-btn"
                    style={(!busy && rawText.trim()) ? { "--scm-ab-bg": "var(--majalis-emerald)" } as React.CSSProperties : undefined}
                  >
                    {busy ? "جارٍ التحليل…" : "تحليل بالذكاء الاصطناعي"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === "url" && (
          <div className="scm-input-group">
            <label className="scm-hint-label">
              رابط المحتوى (Instagram / YouTube / X / Telegram / موقع)
            </label>
            <div className="scm-url-row">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                dir="ltr"
                className="scm-url-input"
              />
              <button
                type="button"
                onClick={onUrlImport}
                disabled={busy || !url.trim()}
                className="scm-url-btn"
              >
                {busy ? "جارٍ الاستيراد…" : "استيراد"}
              </button>
            </div>
            <div className="scm-url-links">
              <a
                href="/admin/automation/sources"
                className="scm-url-link"
                style={{ "--scm-ul-bg": "rgba(14,110,82,0.10)", "--scm-ul-color": "var(--majalis-emerald)" } as React.CSSProperties}
              >
                مصادر المراقبة التلقائية
              </a>
              <a
                href="/admin/content-import/url"
                className="scm-url-link"
                style={{ "--scm-ul-bg": "rgba(91,33,182,0.10)", "--scm-ul-color": "#8B5CF6" } as React.CSSProperties}
              >
                واجهة الاستيراد المتقدمة
              </a>
            </div>
          </div>
        )}

        {mode === "image" && (
          <div className="scm-input-group">
            <label className="scm-hint-label">
              ارفع صورة تحتوي محتوى (إعلان، جدول، نص مصوّر…)
            </label>
            <div className="scm-image-drop">
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={(e) => onImage(e.target.files?.[0] || null)}
                className="scm-image-input"
              />
              <p className="scm-image-hint">
                Vision + OCR — يستخرج الذكاء الاصطناعي النص والبيانات تلقائياً
              </p>
            </div>
            <a href="/admin/content-import/image" className="scm-image-link">
              واجهة الاستيراد من الصورة المتقدمة ←
            </a>
          </div>
        )}
      </section>

      {preview && (
        <section className="scm-preview">
          <div className="scm-preview-header">
            <h3 className="scm-preview-h3">معاينة المسودة</h3>
            <button
              type="button"
              onClick={() => { setPreviewEditing(!previewEditing); if (!previewEditing) setPreviewJson(JSON.stringify(preview, null, 2)); }}
              className="scm-preview-toggle"
            >
              {previewEditing ? "إلغاء التعديل" : "تعديل"}
            </button>
          </div>

          {previewEditing ? (
            <textarea
              value={previewJson}
              onChange={(e) => setPreviewJson(e.target.value)}
              rows={14}
              dir="ltr"
              className="scm-preview-editor"
            />
          ) : (
            <div className="scm-preview-grid">
              {Object.entries(preview).filter(([, v]) => v !== null && v !== "").map(([k, v]) => (
                <div key={k} className="scm-preview-row">
                  <span className="scm-preview-key">{k}</span>
                  <span className="scm-preview-val">
                    {Array.isArray(v) ? v.join("، ") : String(v).slice(0, 200)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {previewDraftId && (
            <div className="scm-preview-actions">
              <button
                type="button"
                disabled={busy}
                onClick={() => onApprove(previewDraftId)}
                className="scm-preview-approve"
              >
                {busy ? "جارٍ النشر…" : "اعتماد ونشر"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onReject(previewDraftId)}
                className="scm-preview-reject"
              >
                رفض
              </button>
              <button
                type="button"
                onClick={() => { setPreview(null); setPreviewDraftId(null); }}
                className="scm-preview-close"
              >
                إغلاق
              </button>
            </div>
          )}
        </section>
      )}

      <div className="scm-drafts-header">
        <h3 className="scm-drafts-h3">
          مسودات بانتظار المراجعة ({drafts.length})
        </h3>
        <button type="button" onClick={load} className="scm-refresh-btn">
          تحديث
        </button>
      </div>

      {loading ? (
        <SkeletonCardGrid count={6} />
      ) : drafts.length === 0 ? (
        <p className="scm-empty">لا توجد مسودات معلّقة.</p>
      ) : (
        <div className="scm-drafts-list">
          {drafts.map((d) => (
            <article key={d.id} className="scm-draft-card">
              <strong className="scm-draft-title">{String(d.extracted_data?.title || "بدون عنوان")}</strong>
              <p className="scm-draft-meta">
                {d.source_type} · {String(d.extracted_data?.speaker_name || "")} · {new Date(d.created_at).toLocaleString("ar")}
              </p>
              {(d.validation_errors || []).length > 0 && (
                <ul className="scm-draft-errors">
                  {d.validation_errors!.map((e, i) => <li key={i}>{e.message}</li>)}
                </ul>
              )}
              <div className="scm-draft-actions">
                <button
                  type="button"
                  onClick={() => { setPreview(d.extracted_data); setPreviewJson(JSON.stringify(d.extracted_data, null, 2)); setPreviewDraftId(d.id); }}
                  className="scm-draft-preview-btn"
                >
                  معاينة وتعديل
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onApprove(d.id)}
                  className="scm-draft-approve-btn"
                >
                  اعتماد
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onReject(d.id)}
                  className="scm-draft-reject-btn"
                >
                  رفض
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default SmartCmsSection;
