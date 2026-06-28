import { useCallback, useRef, useState } from "react";
import { Link } from "wouter";
import { invalidateLessonsCache } from "@/lib/lessons-service";
import {
  EMPTY_PARSED,
  FIELD_LABELS,
  approveLessonImportDraft,
  extractLessonFromImageUpload,
  reExtractLessonImportDraft,
  rejectLessonImportDraft,
  saveLessonImportDraft,
  type ParsedLessonFields,
} from "@/lib/lesson-import-api";
import { C, GOVERNORATES } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";

const CATEGORIES = ["تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "أخرى"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "0.375rem",
  border: `1px solid ${C.line}`,
  fontFamily: "inherit",
  fontSize: "0.875rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: C.emeraldDeep,
  marginBottom: "0.25rem",
};

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? C.emeraldDeep : pct >= 45 ? "#92400E" : "#991B1B";
  const bg = pct >= 75 ? "#D1FAE5" : pct >= 45 ? "#FEF3C7" : "#FEE2E2";
  return (
    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", background: bg, color, fontSize: "0.75rem", fontWeight: 600 }}>
      ثقة الاستخراج: {pct}%
    </span>
  );
}

function MissingBadge({ fields }: { fields: string[] }) {
  if (!fields.length) {
    return (
      <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", background: "#D1FAE5", color: C.emeraldDeep, fontSize: "0.75rem" }}>
        البيانات الأساسية مكتملة
      </span>
    );
  }
  return (
    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", background: "#FEE2E2", color: "#991B1B", fontSize: "0.75rem" }}>
      حقول ناقصة: {fields.map((f) => FIELD_LABELS[f] || f).join("، ")}
    </span>
  );
}

function LessonImportForm({
  parsed,
  onChange,
  disabled,
}: {
  parsed: ParsedLessonFields;
  onChange: (next: ParsedLessonFields) => void;
  disabled?: boolean;
}) {
  const set = (key: keyof ParsedLessonFields, value: unknown) => {
    onChange({ ...parsed, [key]: value });
  };

  return (
    <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{FIELD_LABELS.title}</label>
        <input style={inputStyle} value={parsed.title || ""} disabled={disabled} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.speaker_name}</label>
        <input style={inputStyle} value={parsed.speaker_name || ""} disabled={disabled} onChange={(e) => set("speaker_name", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.gregorian_date}</label>
        <input type="date" style={inputStyle} value={parsed.gregorian_date || parsed.start_date || ""} disabled={disabled} onChange={(e) => { set("gregorian_date", e.target.value); set("start_date", e.target.value); }} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.day_of_week}</label>
        <input style={inputStyle} value={parsed.day_of_week || ""} disabled={disabled} onChange={(e) => set("day_of_week", e.target.value)} placeholder="مثل: الجمعة" />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.lesson_time}</label>
        <input style={inputStyle} value={parsed.lesson_time || ""} disabled={disabled} onChange={(e) => set("lesson_time", e.target.value)} placeholder="مثل: بعد العشاء" />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.mosque}</label>
        <input style={inputStyle} value={parsed.mosque || ""} disabled={disabled} onChange={(e) => set("mosque", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.region}</label>
        <input style={inputStyle} value={parsed.region || ""} disabled={disabled} onChange={(e) => set("region", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.city}</label>
        <select style={inputStyle} value={parsed.city || "العاصمة"} disabled={disabled} onChange={(e) => set("city", e.target.value)}>
          {GOVERNORATES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.country}</label>
        <input style={inputStyle} value={parsed.country || "الكويت"} disabled={disabled} onChange={(e) => set("country", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.category}</label>
        <select style={inputStyle} value={parsed.category || ""} disabled={disabled} onChange={(e) => set("category", e.target.value)}>
          <option value="">—</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.organizer}</label>
        <input style={inputStyle} value={parsed.organizer || ""} disabled={disabled} onChange={(e) => set("organizer", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.cooperative_org}</label>
        <input style={inputStyle} value={parsed.cooperative_org || ""} disabled={disabled} onChange={(e) => set("cooperative_org", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.phone}</label>
        <input style={inputStyle} value={parsed.phone || ""} disabled={disabled} onChange={(e) => set("phone", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.live_url}</label>
        <input style={inputStyle} value={parsed.live_url || ""} disabled={disabled} onChange={(e) => set("live_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.registration_url}</label>
        <input style={inputStyle} value={parsed.registration_url || ""} disabled={disabled} onChange={(e) => set("registration_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.maps_url}</label>
        <input style={inputStyle} value={parsed.maps_url || ""} disabled={disabled} onChange={(e) => set("maps_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.slug}</label>
        <input style={inputStyle} value={parsed.slug || ""} disabled={disabled} onChange={(e) => set("slug", e.target.value)} dir="ltr" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={Boolean(parsed.has_live_stream)} disabled={disabled} onChange={(e) => set("has_live_stream", e.target.checked)} id="has-live" />
        <label htmlFor="has-live" style={{ ...labelStyle, margin: 0 }}>{FIELD_LABELS.has_live_stream}</label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={Boolean(parsed.has_women_section)} disabled={disabled} onChange={(e) => set("has_women_section", e.target.checked)} id="has-women" />
        <label htmlFor="has-women" style={{ ...labelStyle, margin: 0 }}>{FIELD_LABELS.has_women_section}</label>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{FIELD_LABELS.keywords}</label>
        <input
          style={inputStyle}
          value={(parsed.keywords || []).join("، ")}
          disabled={disabled}
          onChange={(e) => set("keywords", e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean))}
          placeholder="كلمات مفتاحية مفصولة بفاصلة"
        />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{FIELD_LABELS.description}</label>
        <textarea
          style={{ ...inputStyle, minHeight: "5rem", resize: "vertical" }}
          value={parsed.description || ""}
          disabled={disabled}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
    </div>
  );
}

function LessonImportImageContent() {
  const { showSuccess, showError } = useAdminShell();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [visionEnabled, setVisionEnabled] = useState<boolean | null>(null);
  const [visionMessage, setVisionMessage] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [parsed, setParsed] = useState<ParsedLessonFields>({ ...EMPTY_PARSED });
  const [confidence, setConfidence] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<{ field: string; message: string }[]>([]);
  const [sheikhHint, setSheikhHint] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [lastFile, setLastFile] = useState<File | null>(null);

  const applyResponse = useCallback((res: Awaited<ReturnType<typeof extractLessonFromImageUpload>>) => {
    if (res.vision_enabled != null) setVisionEnabled(res.vision_enabled);
    if (res.message) setVisionMessage(res.message);
    if (res.draft_id) setDraftId(res.draft_id);
    if (res.image_url) setImageUrl(res.image_url);
    if (res.extracted_text != null) setExtractedText(res.extracted_text);
    if (res.parsed_fields) setParsed({ ...EMPTY_PARSED, ...res.parsed_fields });
    if (res.confidence_score != null) setConfidence(res.confidence_score);
    if (res.missing_fields) setMissingFields(res.missing_fields);
    if (res.warnings) setWarnings(res.warnings as { field: string; message: string }[]);
    const match = res.suggested_sheikh_match;
    if (match?.matched?.name) {
      setSheikhHint(`مطابقة: ${match.matched.name}`);
    } else if (match?.proposed?.name) {
      setSheikhHint(`سيُنشأ شيخ مسودة: ${match.proposed.name}`);
    } else {
      setSheikhHint("");
    }
  }, []);

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setLastFile(file);
    setBusy(true);
    try {
      const res = await extractLessonFromImageUpload(file, { sourceUrl: sourceUrl.trim() || undefined, notes: notes.trim() || undefined });
      if (!res.ok) {
        showError(res.error || res.message || "تعذر معالجة الصورة");
        return;
      }
      applyResponse(res);
      if (res.storage_error) {
        showError(`تعذر رفع الصورة للتخزين: ${res.storage_error}`);
      } else if (res.vision_enabled === false) {
        showSuccess("تم رفع الصورة — أدخل البيانات يدويًا");
      } else {
        showSuccess("تم استخراج البيانات — راجعها ثم اعتمد");
      }
    } catch {
      showError("تعذر رفع الصورة");
    } finally {
      setBusy(false);
    }
  };

  const onSaveDraft = async () => {
    setBusy(true);
    try {
      const res = await saveLessonImportDraft(parsed, {
        draftId: draftId || undefined,
        imageUrl: imageUrl || undefined,
        extractedText,
        notes: notes.trim() || undefined,
      });
      if (!res.ok) {
        showError(res.error || "تعذر حفظ المسودة");
        return;
      }
      if (res.draft_id) setDraftId(res.draft_id);
      showSuccess("تم حفظ المسودة");
    } catch {
      showError("تعذر حفظ المسودة");
    } finally {
      setBusy(false);
    }
  };

  const onApprove = async () => {
    if (!draftId) {
      showError("لا توجد مسودة — ارفع صورة أولًا");
      return;
    }
    setBusy(true);
    try {
      const res = await approveLessonImportDraft(draftId, parsed);
      if (!res.ok) {
        const msgs = res.validation?.errors?.map((e) => e.message).join(" — ");
        showError(msgs || res.error || "تعذر الاعتماد");
        return;
      }
      invalidateLessonsCache();
      showSuccess("تم اعتماد الدرس — يظهر الآن في المنصة");
      setDraftId(null);
      setImageUrl(null);
      setExtractedText("");
      setParsed({ ...EMPTY_PARSED });
      setLastFile(null);
    } catch {
      showError("تعذر الاعتماد");
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    if (!draftId) return;
    setBusy(true);
    try {
      await rejectLessonImportDraft(draftId);
      showSuccess("تم رفض المسودة");
      setDraftId(null);
      setImageUrl(null);
      setParsed({ ...EMPTY_PARSED });
    } catch {
      showError("تعذر الرفض");
    } finally {
      setBusy(false);
    }
  };

  const onReExtract = async () => {
    if (!draftId || !lastFile) {
      showError("أعد اختيار الصورة لإعادة الاستخراج");
      fileRef.current?.click();
      return;
    }
    setBusy(true);
    try {
      const res = await reExtractLessonImportDraft(draftId, lastFile);
      if (!res.ok) {
        showError(res.error || res.message || "تعذر إعادة الاستخراج");
        return;
      }
      applyResponse(res);
      showSuccess("تم إعادة الاستخراج");
    } catch {
      showError("تعذر إعادة الاستخراج");
    } finally {
      setBusy(false);
    }
  };

  const hasDraft = Boolean(draftId || imageUrl || parsed.title);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>إضافة درس من صورة</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            ارفع إعلان الدرس → استخراج تلقائي → مراجعة → اعتماد → نشر في المنصة دون تعديل الكود.
          </p>
        </div>
        <Link href="/admin" style={{ fontSize: "0.8125rem", color: C.emeraldDeep }}>← العودة للوحة الإدارة</Link>
      </div>

      {visionEnabled === false && (
        <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#92400E" }}>
          {visionMessage || "الاستخراج التلقائي غير مفعّل. يمكنك إدخال البيانات يدويًا."}
        </div>
      )}

      <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>1. رفع الإعلان</h3>
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "0.75rem" }}>
          <div>
            <label style={labelStyle}>رابط المصدر (اختياري)</label>
            <input style={inputStyle} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." dir="ltr" disabled={busy} />
          </div>
          <div>
            <label style={labelStyle}>ملاحظات (اختياري)</label>
            <input style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} />
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={busy}
          style={{ display: "none" }}
          onChange={(e) => onUpload(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          style={{ padding: "0.625rem 1.25rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
        >
          {busy ? "جاري المعالجة…" : "اختر صورة إعلان الدرس"}
        </button>
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.5rem" }}>JPEG / PNG / WebP — حتى 5 ميغابايت</p>
      </section>

      {hasDraft && (
        <>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <ConfidenceBadge score={confidence} />
            <MissingBadge fields={missingFields} />
            {sheikhHint && (
              <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", background: "#DBEAFE", color: "#1D4ED8", fontSize: "0.75rem" }}>
                {sheikhHint}
              </span>
            )}
          </div>

          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(240px, 1fr) minmax(280px, 2fr)", marginBottom: "1rem" }}>
            <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>الصورة الأصلية</h3>
              {imageUrl ? (
                <img src={imageUrl} alt="إعلان الدرس" style={{ width: "100%", borderRadius: "0.375rem", border: `1px solid ${C.line}` }} />
              ) : lastFile ? (
                <img src={URL.createObjectURL(lastFile)} alt="معاينة" style={{ width: "100%", borderRadius: "0.375rem", border: `1px solid ${C.line}` }} />
              ) : (
                <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>لا توجد صورة</p>
              )}
              <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "0.875rem", color: C.emeraldDeep }}>النص المستخرج</h3>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.75rem", maxHeight: "12rem", overflow: "auto", background: C.parchmentDeep, padding: "0.5rem", borderRadius: "0.375rem", margin: 0, direction: "rtl" }}>
                {extractedText || "—"}
              </pre>
              {warnings.length > 0 && (
                <ul style={{ margin: "0.75rem 0 0", paddingInlineStart: "1rem", fontSize: "0.75rem", color: "#92400E" }}>
                  {warnings.map((w, i) => (
                    <li key={i}>{w.message}</li>
                  ))}
                </ul>
              )}
            </section>

            <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>2. مراجعة وتعديل الحقول</h3>
              <LessonImportForm parsed={parsed} onChange={setParsed} disabled={busy} />
            </section>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" disabled={busy} onClick={onApprove} style={{ padding: "0.5rem 1rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              اعتماد ونشر
            </button>
            <button type="button" disabled={busy} onClick={onSaveDraft} style={{ padding: "0.5rem 1rem", background: C.panel, color: C.emeraldDeep, border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
              حفظ كمسودة
            </button>
            <button type="button" disabled={busy} onClick={onReExtract} style={{ padding: "0.5rem 1rem", background: C.panel, color: C.ink, border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
              إعادة استخراج
            </button>
            <button type="button" disabled={busy || !draftId} onClick={onReject} style={{ padding: "0.5rem 1rem", background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
              رفض
            </button>
          </div>
        </>
      )}

      {busy && (
        <div style={{ marginTop: "1rem" }}>
          <Loading />
        </div>
      )}
    </div>
  );
}

export default function LessonImportImagePage() {
  return (
    <AdminShell section="lessons">
      <LessonImportImageContent />
    </AdminShell>
  );
}

export { LessonImportImageContent };
