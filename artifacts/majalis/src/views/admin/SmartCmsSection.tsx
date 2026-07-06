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

type InputMode = "text" | "url" | "image";

const CONTENT_HINTS = [
  "درس أسبوعي", "قصة إسلامية", "حديث شريف", "فتوى", "مقال", "خبر",
  "إعلان", "مناسبة", "سيرة", "ترجمة عالم", "كتاب",
];

export function SmartCmsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<InputMode>("text");

  // Text mode
  const [rawText, setRawText] = useState("");
  const [hint, setHint] = useState("");

  // URL mode
  const [url, setUrl] = useState("");

  // Preview
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

  const handleSuccess = (res: { ok: boolean; error?: string; extracted?: Record<string, unknown>; draft?: Record<string, unknown> }) => {
    if (!res.ok) { showError(res.error || "تعذّر تحليل المحتوى"); return false; }
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
      if (!res.ok) { showError(res.validation?.errors?.map(e => e.message).join(" — ") || res.error || "تعذّر الاعتماد"); return; }
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

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.45rem 1.1rem",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: "0.85rem",
    background: active ? C.emerald : "rgba(255,255,255,0.06)",
    color: active ? "#fff" : C.inkSoft,
    transition: "background 0.15s, color 0.15s",
  });

  return (
    <div dir="rtl" style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* ── العنوان ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep, fontSize: "1.2rem" }}>
          المساعد الذكي لإدارة المحتوى
        </h2>
        <p style={{ color: C.inkSoft, margin: 0, fontSize: "0.875rem" }}>
          الصق أي نص أو أدخل رابطاً أو ارفع صورة — يحلّل المحتوى تلقائياً ويعبّئ جميع الحقول، ثم أكمل المراجعة واعتمده.
        </p>
      </div>

      {/* ── تبديل وضع الإدخال ── */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <button style={tabStyle(mode === "text")} onClick={() => setMode("text")}>لصق نص</button>
        <button style={tabStyle(mode === "url")}  onClick={() => setMode("url")}>رابط</button>
        <button style={tabStyle(mode === "image")} onClick={() => setMode("image")}>صورة</button>
      </div>

      {/* ── لوح الإدخال ── */}
      <section style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.10)`, borderRadius: "0.875rem", padding: "1.25rem", marginBottom: "1.25rem" }}>

        {/* وضع النص */}
        {mode === "text" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: C.brass, fontWeight: 700, marginBottom: "0.35rem" }}>
                نوع المحتوى (اختياري — يُساعد الذكاء الاصطناعي على التحليل)
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {CONTENT_HINTS.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHint(hint === h ? "" : h)}
                    style={{
                      padding: "0.25rem 0.65rem",
                      borderRadius: "999px",
                      border: `1px solid ${hint === h ? C.emerald : "rgba(255,255,255,0.12)"}`,
                      background: hint === h ? "rgba(46,139,103,0.15)" : "transparent",
                      color: hint === h ? C.emerald : C.inkMuted,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontWeight: hint === h ? 700 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="ai-raw-text" style={{ display: "block", fontSize: "0.8rem", color: C.brass, fontWeight: 700, marginBottom: "0.35rem" }}>
                المحتوى الخام (درس، قصة، حديث، فتوى، مقال، خبر…)
              </label>
              <textarea
                id="ai-raw-text"
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="الصق هنا أي نص: درس كامل، قصة، حديث، فتوى، مقال، إعلان، مناسبة، سيرة، ترجمة، أو أي محتوى آخر…"
                rows={9}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "0.5rem",
                  color: C.ink,
                  resize: "vertical",
                  direction: "rtl",
                  lineHeight: 1.7,
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.72rem", color: C.inkMuted }}>{rawText.length} حرف</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {rawText && (
                    <button type="button" onClick={() => setRawText("")} style={{ fontSize: "0.75rem", color: C.inkMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      مسح
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onTextAnalyze}
                    disabled={busy || !rawText.trim()}
                    style={{
                      padding: "0.5rem 1.25rem",
                      background: busy || !rawText.trim() ? "rgba(46,139,103,0.30)" : C.emerald,
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      cursor: busy || !rawText.trim() ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      transition: "background 0.15s",
                    }}
                  >
                    {busy ? "جارٍ التحليل…" : "تحليل بالذكاء الاصطناعي"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* وضع الرابط */}
        {mode === "url" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{ fontSize: "0.8rem", color: C.brass, fontWeight: 700 }}>
              رابط المحتوى (Instagram / YouTube / X / Telegram / موقع)
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
                dir="ltr"
                style={{
                  flex: 1, minWidth: 220,
                  padding: "0.55rem 0.75rem",
                  fontFamily: "inherit",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "0.5rem",
                  color: C.ink,
                }}
              />
              <button
                type="button"
                onClick={onUrlImport}
                disabled={busy || !url.trim()}
                style={{ padding: "0.55rem 1.25rem", background: C.emerald, color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {busy ? "جارٍ الاستيراد…" : "استيراد"}
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["/admin/automation/sources", "/admin/content-import/url"].map((href, i) => (
                <a key={href} href={href} style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem", background: i === 0 ? "rgba(14,110,82,0.10)" : "rgba(91,33,182,0.10)", color: i === 0 ? C.emerald : "#8B5CF6", borderRadius: "0.375rem", textDecoration: "none", fontWeight: 600 }}>
                  {i === 0 ? "مصادر المراقبة التلقائية" : "واجهة الاستيراد المتقدمة"}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* وضع الصورة */}
        {mode === "image" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{ fontSize: "0.8rem", color: C.brass, fontWeight: 700 }}>
              ارفع صورة تحتوي محتوى (إعلان، جدول، نص مصوّر…)
            </label>
            <div style={{
              border: "2px dashed rgba(255,255,255,0.15)",
              borderRadius: "0.75rem",
              padding: "2rem",
              textAlign: "center",
              color: C.inkMuted,
              fontSize: "0.875rem",
            }}>
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={e => onImage(e.target.files?.[0] || null)}
                style={{ display: "block", margin: "0 auto", cursor: "pointer" }}
              />
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem" }}>
                Vision + OCR — يستخرج الذكاء الاصطناعي النص والبيانات تلقائياً
              </p>
            </div>
            <a href="/admin/content-import/image" style={{ fontSize: "0.78rem", color: "#60A5FA", textDecoration: "none" }}>
              واجهة الاستيراد من الصورة المتقدمة ←
            </a>
          </div>
        )}
      </section>

      {/* ── معاينة المسودة ── */}
      {preview && (
        <section style={{
          background: "rgba(46,139,103,0.06)",
          border: `1.5px solid rgba(46,139,103,0.30)`,
          borderRadius: "0.875rem",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ margin: 0, color: C.emeraldDeep, fontSize: "1rem" }}>معاينة المسودة</h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => { setPreviewEditing(!previewEditing); if (!previewEditing) setPreviewJson(JSON.stringify(preview, null, 2)); }}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", borderRadius: "0.375rem", border: `1px solid rgba(255,255,255,0.15)`, background: "transparent", color: C.inkSoft, cursor: "pointer", fontFamily: "inherit" }}
              >
                {previewEditing ? "إلغاء التعديل" : "تعديل"}
              </button>
            </div>
          </div>

          {previewEditing ? (
            <textarea
              value={previewJson}
              onChange={e => setPreviewJson(e.target.value)}
              rows={14}
              dir="ltr"
              style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8rem", padding: "0.75rem", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "0.5rem", color: C.ink, resize: "vertical", boxSizing: "border-box" }}
            />
          ) : (
            <div style={{ display: "grid", gap: "0.4rem" }}>
              {Object.entries(preview).filter(([, v]) => v !== null && v !== "").map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: "0.75rem", fontSize: "0.82rem", flexWrap: "wrap" }}>
                  <span style={{ color: C.brass, fontWeight: 700, flexShrink: 0, minWidth: "8rem" }}>{k}</span>
                  <span style={{ color: C.inkSoft, wordBreak: "break-all" }}>
                    {Array.isArray(v) ? v.join("، ") : String(v).slice(0, 200)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {previewDraftId && (
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => onApprove(previewDraftId)}
                style={{ padding: "0.55rem 1.5rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "0.9rem" }}
              >
                {busy ? "جارٍ النشر…" : "اعتماد ونشر"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onReject(previewDraftId)}
                style={{ padding: "0.55rem 1rem", background: "rgba(193,89,90,0.12)", color: "var(--msk-red, #C1595A)", border: "1px solid rgba(193,89,90,0.30)", borderRadius: "0.5rem", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                رفض
              </button>
              <button
                type="button"
                onClick={() => { setPreview(null); setPreviewDraftId(null); }}
                style={{ padding: "0.55rem 1rem", background: "transparent", color: C.inkMuted, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem" }}
              >
                إغلاق
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── المسودات المعلّقة ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h3 style={{ margin: 0, color: C.emeraldDeep, fontSize: "1rem" }}>
          مسودات بانتظار المراجعة ({drafts.length})
        </h3>
        <button type="button" onClick={load} style={{ fontSize: "0.75rem", color: C.inkSoft, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          تحديث
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : drafts.length === 0 ? (
        <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>لا توجد مسودات معلّقة.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {drafts.map((d) => (
            <article key={d.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "0.625rem", padding: "0.875rem" }}>
              <strong style={{ color: C.ink }}>{String(d.extracted_data?.title || "بدون عنوان")}</strong>
              <p style={{ margin: "0.25rem 0", fontSize: "0.8rem", color: C.inkSoft }}>
                {d.source_type} · {String(d.extracted_data?.speaker_name || "")} · {new Date(d.created_at).toLocaleString("ar")}
              </p>
              {(d.validation_errors || []).length > 0 && (
                <ul style={{ margin: "0.35rem 0", paddingInlineStart: "1.1rem", color: "var(--msk-red, #C1595A)", fontSize: "0.75rem" }}>
                  {d.validation_errors!.map((e, i) => <li key={i}>{e.message}</li>)}
                </ul>
              )}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                <button type="button" onClick={() => { setPreview(d.extracted_data); setPreviewJson(JSON.stringify(d.extracted_data, null, 2)); setPreviewDraftId(d.id); }} style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", cursor: "pointer", fontFamily: "inherit", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: C.inkSoft }}>
                  معاينة وتعديل
                </button>
                <button type="button" disabled={busy} onClick={() => onApprove(d.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", background: C.emerald, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  اعتماد
                </button>
                <button type="button" disabled={busy} onClick={() => onReject(d.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", background: "rgba(193,89,90,0.12)", color: "var(--msk-red, #C1595A)", border: "none", borderRadius: "0.375rem", cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
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
