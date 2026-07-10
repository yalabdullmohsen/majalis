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
  type DebugLog,
  type ParsedLessonFields,
} from "@/lib/lesson-import-api";
import { GOVERNORATES } from "@/lib/theme";
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";

const CATEGORIES = ["تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "أخرى"];
const VENUE_TYPES = ["مسجد", "مجلس", "ديوان", "مزرعة", "استراحة", "مركز", "جامعة", "أخرى"] as const;
const WEEK_DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"] as const;

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? "var(--majalis-emerald-deep)" : pct >= 45 ? "#1F4D3A" : "#991B1B";
  const bg = pct >= 75 ? "#D1FAE5" : pct >= 45 ? "rgba(14,110,82,0.08)" : "#FEE2E2";
  return (
    <span
      className="lis-conf-badge"
      style={{ "--lis-cb-bg": bg, "--lis-cb-color": color } as React.CSSProperties}
    >
      ثقة الاستخراج: {pct}%
    </span>
  );
}

function MissingBadge({ fields }: { fields: string[] }) {
  if (!fields.length) {
    return (
      <span
        className="lis-missing-badge"
        style={{ "--lis-mb-bg": "#D1FAE5", "--lis-mb-color": "var(--majalis-emerald-deep)" } as React.CSSProperties}
      >
        البيانات الأساسية مكتملة
      </span>
    );
  }
  return (
    <span
      className="lis-missing-badge"
      style={{ "--lis-mb-bg": "#FEE2E2", "--lis-mb-color": "#991B1B" } as React.CSSProperties}
    >
      تحتاج مراجعة: {fields.map((f) => FIELD_LABELS[f] || f).join("، ")}
    </span>
  );
}

const KEY_FIELDS: Array<keyof typeof FIELD_LABELS> = ["title", "speaker_name", "day_of_week", "lesson_time", "mosque", "city"];

function FieldStatusGrid({
  parsed,
  fieldConfidence,
  failureReasons,
}: {
  parsed: ParsedLessonFields;
  fieldConfidence: Record<string, number>;
  failureReasons: Record<string, string>;
}) {
  return (
    <div className="lis-field-grid">
      {KEY_FIELDS.map((field) => {
        const val = String((parsed as Record<string, unknown>)[field] || "").trim();
        const conf = fieldConfidence[field] ?? (val ? 1 : 0);
        const reason = failureReasons[field];
        const isOk = val && conf >= 0.5;
        const isWarn = val && conf < 0.5;
        const isMissing = !val;
        const bg = isOk ? "#D1FAE5" : isWarn ? "rgba(14,110,82,0.08)" : "#FEE2E2";
        const color = isOk ? "var(--majalis-emerald-deep)" : isWarn ? "#1F4D3A" : "#991B1B";
        const icon = isOk ? "✓" : isWarn ? "⚠" : "✗";
        return (
          <div
            key={field}
            className="lis-field-cell"
            style={{ "--lis-fc-bg": bg, "--lis-fc-border": `${color}30`, "--lis-fc-color": color } as React.CSSProperties}
            title={reason || val || "غير موجود"}
          >
            <div className="lis-field-cell__label">{icon} {FIELD_LABELS[field] || field}</div>
            <div className="lis-field-cell__value">
              {isMissing ? (reason || "لم يُستخرج") : val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DebugLogPanel({ log }: { log: DebugLog }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lis-debug-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="lis-debug-btn"
      >
        <span>تفاصيل الاستخراج (Debug)، {log.total_ms ?? 0} ms</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="lis-debug-content">
          {log.stages.map((s, i) => (
            <div
              key={i}
              className="lis-debug-stage"
              style={{ "--lis-ds-bg": s.ok === false ? "#FEE2E2" : "#fff" } as React.CSSProperties}
            >
              <strong>{s.stage}</strong>
              {s.ms != null && <span className="lis-debug-ms">({s.ms}ms)</span>}
              {s.error && <span className="lis-debug-err"> ✗ {s.error}</span>}
              {s.fields_found?.length ? <div className="lis-debug-found">✓ {s.fields_found.join(", ")}</div> : null}
              {s.fields_missing?.length ? <div className="lis-debug-missing">✗ missing: {s.fields_missing.join(", ")}</div> : null}
              {s.fields_recovered?.length ? <div className="lis-debug-recovered">↑ recovered: {s.fields_recovered.join(", ")}</div> : null}
              {s.fields_filled?.length ? <div className="lis-debug-filled">DB: {s.fields_filled.join(", ")}</div> : null}
              {s.raw_confidence != null && <div className="lis-debug-conf">confidence: {Math.round(s.raw_confidence * 100)}%</div>}
            </div>
          ))}
          {log.raw_ocr_text && (
            <details className="lis-debug-ocr lis-debug-ocr--mt">
              <summary>raw_ocr_text</summary>
              <pre className="lip-ocr-pre">{log.raw_ocr_text}</pre>
            </details>
          )}
        </div>
      )}
    </div>
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
    <div className="lis-form-grid">
      <div className="lis-full-col">
        <label className="lis-label">{FIELD_LABELS.title}</label>
        <input className="lis-input" value={parsed.title || ""} disabled={disabled} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.speaker_name}</label>
        <input className="lis-input" value={parsed.speaker_name || ""} disabled={disabled} onChange={(e) => set("speaker_name", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.gregorian_date}</label>
        <input type="date" className="lis-input" value={parsed.gregorian_date || parsed.start_date || ""} disabled={disabled} onChange={(e) => { set("gregorian_date", e.target.value); set("start_date", e.target.value); }} />
      </div>
      <div className="lis-full-col">
        <label className="lis-label">{FIELD_LABELS.day_of_week} (اختر يوماً أو أكثر)</label>
        <div className="lis-days-row">
          {WEEK_DAYS.map((d) => {
            const selected = (parsed.day_of_week || "").split("،").map((x) => x.trim()).includes(d);
            return (
              <label
                key={d}
                className={`lip-day-label${disabled ? " is-disabled" : ""}`}
                style={{
                  "--lip-dl-fw": selected ? "700" : "400",
                  "--lip-dl-color": selected ? "var(--majalis-emerald-deep)" : "var(--majalis-ink)",
                } as React.CSSProperties}
              >
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selected}
                  onChange={(e) => {
                    const cur = (parsed.day_of_week || "").split("،").map((x) => x.trim()).filter(Boolean);
                    const next = e.target.checked ? [...cur, d] : cur.filter((x) => x !== d);
                    set("day_of_week", next.join("،"));
                  }}
                />
                {d}
              </label>
            );
          })}
        </div>
        {(parsed.day_of_week || "").includes("،") && (
          <div className="lip-day-repeat">
            يتكرر كل: {(parsed.day_of_week || "").split("،").join(" و")}
          </div>
        )}
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.lesson_time}</label>
        <input className="lis-input" value={parsed.lesson_time || ""} disabled={disabled} onChange={(e) => set("lesson_time", e.target.value)} placeholder="مثل: بعد العشاء" />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.venue_type}</label>
        <select className="lis-select" value={parsed.venue_type || "مسجد"} disabled={disabled} onChange={(e) => set("venue_type", e.target.value)}>
          {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.mosque}</label>
        <input className="lis-input" value={parsed.mosque || ""} disabled={disabled} onChange={(e) => set("mosque", e.target.value)} placeholder={parsed.venue_type === "ديوان" ? "ديوان آل فلان" : parsed.venue_type === "مجلس" ? "مجلس الشيخ فلان" : "اسم المكان"} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.region}</label>
        <input className="lis-input" value={parsed.region || ""} disabled={disabled} onChange={(e) => set("region", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.city}</label>
        <select className="lis-select" value={parsed.city || "العاصمة"} disabled={disabled} onChange={(e) => set("city", e.target.value)}>
          {GOVERNORATES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.country}</label>
        <input className="lis-input" value={parsed.country || "الكويت"} disabled={disabled} onChange={(e) => set("country", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.category}</label>
        <select className="lis-select" value={parsed.category || ""} disabled={disabled} onChange={(e) => set("category", e.target.value)}>
          <option value="">—</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.organizer}</label>
        <input className="lis-input" value={parsed.organizer || ""} disabled={disabled} onChange={(e) => set("organizer", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.cooperative_org}</label>
        <input className="lis-input" value={parsed.cooperative_org || ""} disabled={disabled} onChange={(e) => set("cooperative_org", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.phone}</label>
        <input className="lis-input" value={parsed.phone || ""} disabled={disabled} onChange={(e) => set("phone", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.live_url}</label>
        <input className="lis-input" value={parsed.live_url || ""} disabled={disabled} onChange={(e) => set("live_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.registration_url}</label>
        <input className="lis-input" value={parsed.registration_url || ""} disabled={disabled} onChange={(e) => set("registration_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.maps_url}</label>
        <input className="lis-input" value={parsed.maps_url || ""} disabled={disabled} onChange={(e) => set("maps_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.slug}</label>
        <input className="lis-input" value={parsed.slug || ""} disabled={disabled} onChange={(e) => set("slug", e.target.value)} dir="ltr" />
      </div>
      <div className="lip-checkbox-row">
        <input type="checkbox" checked={Boolean(parsed.has_live_stream)} disabled={disabled} onChange={(e) => set("has_live_stream", e.target.checked)} id="has-live" />
        <label htmlFor="has-live" className="lis-label lis-label--inline">{FIELD_LABELS.has_live_stream}</label>
      </div>
      <div className="lip-checkbox-row">
        <input type="checkbox" checked={Boolean(parsed.has_women_section)} disabled={disabled} onChange={(e) => set("has_women_section", e.target.checked)} id="has-women" />
        <label htmlFor="has-women" className="lis-label lis-label--inline">{FIELD_LABELS.has_women_section}</label>
      </div>
      <div className="lis-full-col">
        <label className="lis-label">{FIELD_LABELS.keywords}</label>
        <input
          className="lis-input"
          value={(parsed.keywords || []).join("، ")}
          disabled={disabled}
          onChange={(e) => set("keywords", e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean))}
          placeholder="كلمات مفتاحية مفصولة بفاصلة"
        />
      </div>
      <div className="lis-full-col">
        <label className="lis-label">{FIELD_LABELS.description}</label>
        <textarea
          className="lis-textarea"
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
  const [fieldConfidence, setFieldConfidence] = useState<Record<string, number>>({});
  const [failureReasons, setFailureReasons] = useState<Record<string, string>>({});
  const [debugLog, setDebugLog] = useState<DebugLog | null>(null);
  const [sheikhHint, setSheikhHint] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

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
    if (res.field_confidence) setFieldConfidence(res.field_confidence);
    if (res.failure_reasons) setFailureReasons(res.failure_reasons);
    if (res.debug_log !== undefined) setDebugLog(res.debug_log ?? null);
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
    setLastError(null);
    setBusy(true);
    try {
      const res = await extractLessonFromImageUpload(file, { sourceUrl: sourceUrl.trim() || undefined, notes: notes.trim() || undefined });
      if (!res.ok) {
        const msg = res.error || "تعذر معالجة الصورة، يُرجى المحاولة مرة أخرى.";
        setLastError(msg);
        showError(msg);
        return;
      }
      setLastError(null);
      applyResponse(res);
      if (res.storage_error) {
        showError("تعذر رفع الصورة للتخزين، البيانات المستخرجة متاحة للمراجعة.");
      } else if (res.vision_enabled === false) {
        showSuccess("تم رفع الصورة، أدخل البيانات يدويًا");
      } else {
        showSuccess("تم استخراج البيانات، راجعها ثم اعتمد");
      }
    } catch {
      const msg = "تعذر رفع الصورة، تحقق من اتصال الإنترنت وحاول مجدداً.";
      setLastError(msg);
      showError(msg);
    } finally {
      setBusy(false);
    }
  };

  const onSaveDraft = async () => {
    if (!draftId && !parsed.title?.trim()) {
      showError("أدخل عنوانًا على الأقل");
      return;
    }
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
      showError("لا توجد مسودة، ارفع صورة أولًا");
      return;
    }
    setBusy(true);
    try {
      const res = await approveLessonImportDraft(draftId, parsed);
      if (!res.ok) {
        const msgs = res.validation?.errors?.map((e) => e.message).join("، ");
        showError(msgs || res.error || "تعذر الاعتماد");
        return;
      }
      invalidateLessonsCache();
      showSuccess("تم اعتماد الدرس، يظهر الآن في المنصة");
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
      <div className="lip-page-header">
        <div>
          <h2 className="lip-page-title">إضافة درس من صورة</h2>
          <p className="lip-page-sub">
            ارفع إعلان الدرس واستخراج تلقائي ثم مراجعة واعتماد ونشر في المنصة دون تعديل الكود.
          </p>
        </div>
        <Link href="/admin" className="lip-back-link">العودة للوحة الإدارة</Link>
      </div>

      {visionEnabled === false && (
        <div className="lip-vision-warn">
          {visionMessage || "الاستخراج التلقائي غير مفعّل. يمكنك إدخال البيانات يدويًا."}
        </div>
      )}

      <section className="lip-upload-sec">
        <h3 className="lip-upload-h3">رفع الإعلان</h3>
        <div className="lip-upload-meta">
          <div>
            <label className="lis-label">رابط المصدر (اختياري)</label>
            <input className="lis-input" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." dir="ltr" disabled={busy} />
          </div>
          <div>
            <label className="lis-label">ملاحظات (اختياري)</label>
            <input className="lis-input" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} />
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={busy}
          className="lip-hidden-input"
          onChange={(e) => onUpload(e.target.files?.[0] || null)}
        />
        <div className="lip-upload-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="lip-upload-btn"
          >
            {busy ? "جاري المعالجة…" : "اختر صورة إعلان الدرس"}
          </button>
          {!busy && lastError && lastFile && (
            <button
              type="button"
              onClick={() => onUpload(lastFile)}
              className="lip-retry-btn"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
        {lastError && (
          <p role="alert" className="lip-error-msg">{lastError}</p>
        )}
        <p className="lip-upload-hint">JPEG / PNG / WebP، حتى 5 ميغابايت</p>
      </section>

      {hasDraft && (
        <>
          <div className="lip-badges-row">
            <ConfidenceBadge score={confidence} />
            <MissingBadge fields={missingFields} />
            {sheikhHint && (
              <span className="lip-sheikh-badge">{sheikhHint}</span>
            )}
          </div>

          <FieldStatusGrid parsed={parsed} fieldConfidence={fieldConfidence} failureReasons={failureReasons} />
          {debugLog && <DebugLogPanel log={debugLog} />}

          <div className="lip-draft-grid">
            <section className="lip-panel">
              <h3 className="lip-panel-h3">الصورة الأصلية</h3>
              {imageUrl ? (
                <img src={imageUrl} alt="إعلان الدرس" className="lip-preview-img" />
              ) : lastFile ? (
                <img src={URL.createObjectURL(lastFile)} alt="معاينة" className="lip-preview-img" />
              ) : (
                <p className="lip-no-image">لا توجد صورة</p>
              )}
              <h3 className="lip-panel-h3--sm">النص المستخرج</h3>
              <pre className="lip-ocr-pre">{extractedText || "—"}</pre>
              {warnings.length > 0 && (
                <ul className="lip-warnings">
                  {warnings.map((w, i) => (
                    <li key={i}>{w.message}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="lip-panel">
              <h3 className="lip-panel-h3">مراجعة وتعديل الحقول</h3>
              <LessonImportForm parsed={parsed} onChange={setParsed} disabled={busy} />
            </section>
          </div>

          <div className="lip-actions">
            <button type="button" disabled={busy} onClick={onApprove} className="lip-approve-btn">
              اعتماد ونشر
            </button>
            <button type="button" disabled={busy} onClick={onSaveDraft} className="lip-draft-btn">
              حفظ كمسودة
            </button>
            <button type="button" disabled={busy} onClick={onReExtract} className="lip-extract-btn">
              إعادة استخراج
            </button>
            <button type="button" disabled={busy || !draftId} onClick={onReject} className="lip-reject-btn">
              رفض
            </button>
          </div>
        </>
      )}

      {busy && (
        <div className="lip-loading-wrap">
          <SkeletonCardGrid count={6} />
        </div>
      )}
    </div>
  );
}

export default function LessonImportImagePage() {
  return (
    <AdminShell section="lessons" onSectionChange={() => {}}>
      <LessonImportImageContent />
    </AdminShell>
  );
}

export { LessonImportImageContent };
