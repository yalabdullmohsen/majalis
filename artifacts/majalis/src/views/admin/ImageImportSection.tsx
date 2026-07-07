import { useCallback, useEffect, useRef, useState } from "react";
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
import { useAdminShell } from "@/views/admin/AdminShell";

// ── ثوابت ─────────────────────────────────────────────────────────────────
const MAX_CONCURRENT = 3;
const MAX_BYTES      = 8 * 1024 * 1024;
const ACCEPTED_MIME  = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
const CATEGORIES     = ["تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "تأصيل", "أخرى"];
const ACTIVITY_TYPES = ["درس", "دورة", "محاضرة", "ختمة", "حلقة"];

const DAYS_AR = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

// ── أنواع ──────────────────────────────────────────────────────────────────
type JobStatus =
  | "waiting"
  | "analyzing"
  | "completed"
  | "needs-review"
  | "failed"
  | "approved"
  | "rejected";

type ImgJob = {
  id:            string;
  file:          File;
  preview:       string;
  status:        JobStatus;
  error?:        string;
  draftId?:      string;
  imageUrl?:     string;
  extractedText?:string;
  parsed?:       ParsedLessonFields;
  confidence?:   number;
  missingFields?:string[];
  warnings?:     Array<{ field: string; message: string }>;
  sheikhHint?:   string;
  isDuplicate?:  boolean;
  duplicateTitle?:string;
  addedAt:       number;
};

// ── مساعدون ───────────────────────────────────────────────────────────────
function makeId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const STATUS_META: Record<JobStatus, { label: string; css: string; dot: string }> = {
  waiting:      { label: "بانتظار المعالجة", css: "ii-chip--wait",    dot: "#94a3b8" },
  analyzing:    { label: "جارٍ التحليل",    css: "ii-chip--analyze", dot: "#3b82f6" },
  completed:    { label: "اكتمل",           css: "ii-chip--done",    dot: "#22c55e" },
  "needs-review":{ label:"يحتاج مراجعة",   css: "ii-chip--review",  dot: "#f59e0b" },
  failed:       { label: "فشل",            css: "ii-chip--fail",    dot: "#ef4444" },
  approved:     { label: "تمّ النشر",      css: "ii-chip--approved",dot: "#10b981" },
  rejected:     { label: "مرفوض",          css: "ii-chip--rejected",dot: "#dc2626" },
};

// ── مؤشر الثقة ─────────────────────────────────────────────────────────
function ConfidenceBar({ score }: { score: number }) {
  const pct  = Math.round(score * 100);
  const color = pct >= 75 ? "#22c55e" : pct >= 45 ? "#f59e0b" : "#ef4444";
  const label = pct >= 75 ? "ثقة عالية" : pct >= 45 ? "تحقق مطلوب" : "غير موثوق";
  return (
    <div className="ii-conf" style={{ "--iis-pct": `${pct}%`, "--iis-color": color } as React.CSSProperties}>
      <div className="ii-conf__bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="ii-conf__fill" />
      </div>
      <span className="ii-conf__label">{pct}% · {label}</span>
    </div>
  );
}

// ── شريحة الحالة ───────────────────────────────────────────────────────
function StatusChip({ status }: { status: JobStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`ii-chip ${m.css}`}>
      <span className="ii-chip__dot" style={{ "--iis-dot": m.dot } as React.CSSProperties} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── منطقة الإفلات ─────────────────────────────────────────────────────
function DropZone({ onFiles, busy }: { onFiles: (f: File[]) => void; busy: boolean }) {
  const [drag, setDrag] = useState(false);
  const inputRef        = useRef<HTMLInputElement>(null);

  const accept  = (files: FileList | File[]) => {
    const arr = Array.from(files).filter(
      (f) => ACCEPTED_MIME.includes(f.type) && f.size <= MAX_BYTES,
    );
    if (arr.length) onFiles(arr);
  };

  return (
    <div
      className={`ii-drop${drag ? " ii-drop--active" : ""}${busy ? " ii-drop--busy" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files); }}
      onClick={() => !busy && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      aria-label="منطقة رفع الصور — اسحب وأفلت أو انقر للاختيار"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_MIME.join(",")}
        className="hidden"
        onChange={(e) => { if (e.target.files) accept(e.target.files); e.target.value = ""; }}
        disabled={busy}
      />
      <div className="ii-drop__body">
        <span className="ii-drop__icon" aria-hidden="true">🖼</span>
        <p className="ii-drop__title">
          {drag ? "أفلت الصور هنا" : "اسحب وأفلت صور الإعلانات هنا"}
        </p>
        <p className="ii-drop__sub">أو <strong>انقر للاختيار</strong> · دعم متعدد الملفات</p>
        <p className="ii-drop__hint">
          JPEG · PNG · WebP · HEIC — حتى {fmt(MAX_BYTES)} لكل صورة
        </p>
      </div>
    </div>
  );
}

// ── بطاقة وظيفة في القائمة ────────────────────────────────────────────
function JobCard({
  job,
  selected,
  onClick,
}: {
  job: ImgJob;
  selected: boolean;
  onClick: () => void;
}) {
  const isSpinning = job.status === "analyzing";
  return (
    <button
      type="button"
      className={`ii-jcard${selected ? " ii-jcard--selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div className="ii-jcard__thumb-wrap">
        <img
          src={job.preview}
          alt=""
          className="ii-jcard__thumb"
          loading="lazy"
          decoding="async"
        />
        {isSpinning && <div className="ii-jcard__spinner" aria-hidden="true" />}
      </div>
      <div className="ii-jcard__info">
        <p className="ii-jcard__name">
          {job.parsed?.title || job.file.name}
        </p>
        <p className="ii-jcard__meta">{fmt(job.file.size)}</p>
        <StatusChip status={job.status} />
        {job.confidence != null && job.status !== "waiting" && job.status !== "analyzing" && (
          <ConfidenceBar score={job.confidence} />
        )}
        {job.isDuplicate && (
          <span className="ii-chip ii-chip--dup">⚠ مكرر محتمل</span>
        )}
      </div>
    </button>
  );
}

// ── نموذج المراجعة ─────────────────────────────────────────────────────
function ReviewForm({
  parsed,
  onChange,
  disabled,
}: {
  parsed: ParsedLessonFields;
  onChange: (p: ParsedLessonFields) => void;
  disabled: boolean;
}) {
  const set = (key: keyof ParsedLessonFields, v: unknown) =>
    onChange({ ...parsed, [key]: v });

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.45rem 0.6rem",
    border: `1px solid ${C.line}`, borderRadius: "0.375rem",
    fontFamily: "inherit", fontSize: "0.8125rem", background: "#fff",
    transition: "border-color .15s",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: "0.68rem", fontWeight: 700,
    color: C.emeraldDeep, marginBottom: "0.2rem",
    letterSpacing: "0.02em",
  };

  return (
    <div className="ii-form-grid">
      {/* عنوان الدرس */}
      <div className="ii-form-grid__full">
        <label className="iis-label">{FIELD_LABELS.title} *</label>
        <input className="iis-input" value={parsed.title || ""} disabled={disabled}
          onChange={(e) => set("title", e.target.value)} />
      </div>

      {/* اسم الشيخ */}
      <div>
        <label className="iis-label">{FIELD_LABELS.speaker_name}</label>
        <input className="iis-input" value={parsed.speaker_name || ""} disabled={disabled}
          onChange={(e) => set("speaker_name", e.target.value)} />
      </div>

      {/* التصنيف */}
      <div>
        <label className="iis-label">{FIELD_LABELS.category}</label>
        <select className="iis-input" value={parsed.category || ""} disabled={disabled}
          onChange={(e) => set("category", e.target.value)}>
          <option value="">— اختر —</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* نوع النشاط */}
      <div>
        <label className="iis-label">نوع النشاط</label>
        <select className="iis-input" value={parsed.activity_type || "درس"} disabled={disabled}
          onChange={(e) => set("activity_type", e.target.value)}>
          {ACTIVITY_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* اليوم */}
      <div>
        <label className="iis-label">{FIELD_LABELS.day_of_week}</label>
        <select className="iis-input" value={parsed.day_of_week || ""} disabled={disabled}
          onChange={(e) => set("day_of_week", e.target.value)}>
          <option value="">— اليوم —</option>
          {DAYS_AR.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* الوقت */}
      <div>
        <label className="iis-label">{FIELD_LABELS.lesson_time}</label>
        <input className="iis-input" value={parsed.lesson_time || ""} disabled={disabled}
          placeholder="مثال: بعد المغرب أو 20:00"
          onChange={(e) => set("lesson_time", e.target.value)} />
      </div>

      {/* التاريخ الميلادي */}
      <div>
        <label className="iis-label">{FIELD_LABELS.gregorian_date}</label>
        <input type="date" className="iis-input" value={parsed.gregorian_date || ""} disabled={disabled}
          onChange={(e) => { set("gregorian_date", e.target.value); set("start_date", e.target.value); }} />
      </div>

      {/* تاريخ الانتهاء */}
      <div>
        <label className="iis-label">{FIELD_LABELS.end_date}</label>
        <input type="date" className="iis-input" value={parsed.end_date || ""} disabled={disabled}
          onChange={(e) => set("end_date", e.target.value)} />
      </div>

      {/* المسجد */}
      <div>
        <label className="iis-label">{FIELD_LABELS.mosque}</label>
        <input className="iis-input" value={parsed.mosque || ""} disabled={disabled}
          onChange={(e) => set("mosque", e.target.value)} />
      </div>

      {/* المنطقة */}
      <div>
        <label className="iis-label">{FIELD_LABELS.region}</label>
        <input className="iis-input" value={parsed.region || ""} disabled={disabled}
          onChange={(e) => set("region", e.target.value)} />
      </div>

      {/* المحافظة */}
      <div>
        <label className="iis-label">{FIELD_LABELS.city}</label>
        <select className="iis-input" value={parsed.city || "العاصمة"} disabled={disabled}
          onChange={(e) => set("city", e.target.value)}>
          {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* الدولة */}
      <div>
        <label className="iis-label">{FIELD_LABELS.country}</label>
        <input className="iis-input" value={parsed.country || "الكويت"} disabled={disabled}
          onChange={(e) => set("country", e.target.value)} />
      </div>

      {/* الجهة المنظمة */}
      <div>
        <label className="iis-label">{FIELD_LABELS.organizer}</label>
        <input className="iis-input" value={parsed.organizer || ""} disabled={disabled}
          onChange={(e) => set("organizer", e.target.value)} />
      </div>

      {/* الجهة المتعاونة */}
      <div>
        <label className="iis-label">{FIELD_LABELS.cooperative_org}</label>
        <input className="iis-input" value={parsed.cooperative_org || ""} disabled={disabled}
          onChange={(e) => set("cooperative_org", e.target.value)} />
      </div>

      {/* رقم التواصل */}
      <div>
        <label className="iis-label">{FIELD_LABELS.phone}</label>
        <input className="iis-input" value={parsed.phone || ""} disabled={disabled} dir="ltr"
          onChange={(e) => set("phone", e.target.value)} />
      </div>

      {/* رابط البث */}
      <div>
        <label className="iis-label">{FIELD_LABELS.live_url}</label>
        <input className="iis-input" value={parsed.live_url || ""} disabled={disabled} dir="ltr"
          placeholder="https://..." onChange={(e) => set("live_url", e.target.value)} />
      </div>

      {/* رابط التسجيل */}
      <div>
        <label className="iis-label">{FIELD_LABELS.registration_url}</label>
        <input className="iis-input" value={parsed.registration_url || ""} disabled={disabled} dir="ltr"
          placeholder="https://..." onChange={(e) => set("registration_url", e.target.value)} />
      </div>

      {/* رابط الخريطة */}
      <div>
        <label className="iis-label">{FIELD_LABELS.maps_url}</label>
        <input className="iis-input" value={parsed.maps_url || ""} disabled={disabled} dir="ltr"
          placeholder="https://maps.google.com/..." onChange={(e) => set("maps_url", e.target.value)} />
      </div>

      {/* مربعات الاختيار */}
      <div className="ii-form-grid__checkrow">
        <label className="ii-check">
          <input type="checkbox" checked={Boolean(parsed.has_live_stream)} disabled={disabled}
            onChange={(e) => set("has_live_stream", e.target.checked)} />
          {FIELD_LABELS.has_live_stream}
        </label>
        <label className="ii-check">
          <input type="checkbox" checked={Boolean(parsed.has_women_section)} disabled={disabled}
            onChange={(e) => set("has_women_section", e.target.checked)} />
          {FIELD_LABELS.has_women_section}
        </label>
        <label className="ii-check">
          <input type="checkbox" checked={Boolean(parsed.is_course)} disabled={disabled}
            onChange={(e) => set("is_course", e.target.checked)} />
          دورة علمية
        </label>
      </div>

      {/* الكلمات المفتاحية */}
      <div className="ii-form-grid__full">
        <label className="iis-label">{FIELD_LABELS.keywords}</label>
        <input
          className="iis-input"
          value={(parsed.keywords || []).join("، ")}
          disabled={disabled}
          placeholder="كلمات مفتاحية مفصولة بفاصلة"
          onChange={(e) =>
            set("keywords", e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean))
          }
        />
      </div>

      {/* الوصف */}
      <div className="ii-form-grid__full">
        <label className="iis-label">{FIELD_LABELS.description}</label>
        <textarea
          className="iis-input iis-textarea"
          value={parsed.description || ""}
          disabled={disabled}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
    </div>
  );
}

// ── لوحة التفاصيل ─────────────────────────────────────────────────────
function JobDetail({
  job,
  onApprove,
  onSaveDraft,
  onReExtract,
  onReject,
  onRetry,
  onRemove,
  busy,
}: {
  job: ImgJob;
  onApprove:   (jobId: string, parsed: ParsedLessonFields) => Promise<void>;
  onSaveDraft: (jobId: string, parsed: ParsedLessonFields) => Promise<void>;
  onReExtract: (jobId: string) => Promise<void>;
  onReject:    (jobId: string) => Promise<void>;
  onRetry:     (jobId: string) => void;
  onRemove:    (jobId: string) => void;
  busy: boolean;
}) {
  const [parsed, setParsed] = useState<ParsedLessonFields>(() => ({
    ...EMPTY_PARSED,
    ...(job.parsed || {}),
  }));

  // مزامنة عند تغير الوظيفة
  useEffect(() => {
    setParsed({ ...EMPTY_PARSED, ...(job.parsed || {}) });
  }, [job.id, job.parsed]);

  const isEditable = ["completed", "needs-review", "failed"].includes(job.status);
  const isDone     = ["approved", "rejected"].includes(job.status);

  return (
    <div className="ii-detail">
      {/* رأس اللوحة */}
      <div className="ii-detail__head">
        <StatusChip status={job.status} />
        {job.confidence != null && <ConfidenceBar score={job.confidence} />}
        {job.isDuplicate && (
          <div className="ii-dup-warn">
            <span>⚠</span>
            <span>
              درس مكرر محتمل
              {job.duplicateTitle && `: «${job.duplicateTitle}»`}
              — راجع قبل الاعتماد
            </span>
          </div>
        )}
        {job.missingFields && job.missingFields.length > 0 && (
          <div className="ii-missing">
            <span className="ii-missing__label">حقول ناقصة:</span>
            {job.missingFields.map((f) => (
              <span key={f} className="ii-missing__field">{FIELD_LABELS[f] || f}</span>
            ))}
          </div>
        )}
      </div>

      {/* تخطيط اثنين عمودين */}
      <div className="ii-detail__cols">
        {/* العمود الأيسر: الصورة + النص */}
        <div className="ii-detail__left">
          <p className="ii-detail__section-title">الصورة الأصلية</p>
          <img
            src={job.imageUrl || job.preview}
            alt="إعلان الدرس"
            className="ii-detail__img"
          />

          {job.sheikhHint && (
            <div className="ii-sheikh-hint">
              <span>👤</span> {job.sheikhHint}
            </div>
          )}

          {job.extractedText && (
            <>
              <p className="ii-detail__section-title iis-section-mt">النص المستخرج</p>
              <pre className="ii-ocr">{job.extractedText}</pre>
            </>
          )}

          {job.warnings && job.warnings.length > 0 && (
            <ul className="ii-warnings">
              {job.warnings.map((w, i) => (
                <li key={i}>⚠ {w.message}</li>
              ))}
            </ul>
          )}

          {job.error && (
            <div className="ii-error-box">
              <span>✕</span> {job.error}
            </div>
          )}
        </div>

        {/* العمود الأيمن: نموذج المراجعة */}
        <div className="ii-detail__right">
          <p className="ii-detail__section-title">مراجعة وتعديل البيانات</p>
          {isDone ? (
            <div className="iis-done-wrap">
              <p className="iis-done-icon">
                {job.status === "approved" ? "✅" : "🗑"}
              </p>
              <p className="iis-done-msg">
                {job.status === "approved"
                  ? "تم اعتماد الدرس ونشره في المنصة بنجاح."
                  : "تم رفض هذه المسودة وحذفها."}
              </p>
            </div>
          ) : (
            <ReviewForm
              parsed={parsed}
              onChange={setParsed}
              disabled={busy || job.status === "analyzing" || job.status === "waiting"}
            />
          )}
        </div>
      </div>

      {/* أزرار الإجراءات */}
      {!isDone && (
        <div className="ii-actions">
          {isEditable && (
            <>
              <button
                type="button"
                className="ii-btn ii-btn--primary"
                disabled={busy || !parsed.title?.trim()}
                onClick={() => onApprove(job.id, parsed)}
              >
                ✓ اعتماد ونشر
              </button>
              <button
                type="button"
                className="ii-btn ii-btn--secondary"
                disabled={busy}
                onClick={() => onSaveDraft(job.id, parsed)}
              >
                حفظ كمسودة
              </button>
            </>
          )}
          {job.status === "failed" && (
            <button
              type="button"
              className="ii-btn ii-btn--secondary"
              onClick={() => onRetry(job.id)}
            >
              ↻ إعادة المحاولة
            </button>
          )}
          {["completed", "needs-review", "failed"].includes(job.status) && (
            <button
              type="button"
              className="ii-btn ii-btn--ghost"
              disabled={busy}
              onClick={() => onReExtract(job.id)}
            >
              ⟳ إعادة تحليل
            </button>
          )}
          {job.draftId && ["completed", "needs-review"].includes(job.status) && (
            <button
              type="button"
              className="ii-btn ii-btn--danger"
              disabled={busy}
              onClick={() => onReject(job.id)}
            >
              ✕ رفض
            </button>
          )}
          <button
            type="button"
            className="ii-btn ii-btn--ghost"
            onClick={() => onRemove(job.id)}
          >
            حذف من القائمة
          </button>
        </div>
      )}
    </div>
  );
}

// ── Hook إدارة طابور المعالجة ──────────────────────────────────────────
function useImportQueue() {
  const [jobs, setJobs]           = useState<ImgJob[]>([]);
  const processingRef             = useRef(new Set<string>());

  const updateJob = useCallback((id: string, patch: Partial<ImgJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const processJob = useCallback(
    async (job: ImgJob) => {
      if (processingRef.current.has(job.id)) return;
      processingRef.current.add(job.id);
      updateJob(job.id, { status: "analyzing" });

      try {
        const res = await extractLessonFromImageUpload(job.file);

        if (!res.ok) {
          updateJob(job.id, {
            status: "failed",
            error: res.error || res.message || "فشل التحليل",
          });
          return;
        }

        const conf        = res.confidence_score ?? 0;
        const isDuplicate = Boolean(res.duplicate?.isDuplicate);
        const newStatus: JobStatus =
          isDuplicate || conf < 0.45 ? "needs-review" : "completed";

        const sheikhHint = res.suggested_sheikh_match?.matched?.name
          ? `مطابقة موجودة: ${res.suggested_sheikh_match.matched.name}`
          : res.suggested_sheikh_match?.proposed?.name
            ? `سيُنشأ شيخ مسودة: ${res.suggested_sheikh_match.proposed.name}`
            : undefined;

        updateJob(job.id, {
          status:        newStatus,
          draftId:       res.draft_id,
          imageUrl:      res.image_url,
          extractedText: res.extracted_text || "",
          parsed:        { ...EMPTY_PARSED, ...(res.parsed_fields || {}) },
          confidence:    conf,
          missingFields: res.missing_fields || [],
          warnings:      (res.warnings || []) as Array<{ field: string; message: string }>,
          sheikhHint,
          isDuplicate,
          duplicateTitle: res.duplicate?.lesson?.title,
        });
      } catch {
        updateJob(job.id, { status: "failed", error: "خطأ غير متوقع أثناء الاتصال بالخادم" });
      } finally {
        processingRef.current.delete(job.id);
      }
    },
    [updateJob],
  );

  // تشغيل تلقائي لوظائف الانتظار
  useEffect(() => {
    const waiting   = jobs.filter((j) => j.status === "waiting");
    const freeSlots = MAX_CONCURRENT - processingRef.current.size;
    if (freeSlots <= 0 || !waiting.length) return;
    waiting.slice(0, freeSlots).forEach((j) => { void processJob(j); });
  });

  const addFiles = useCallback((files: File[]) => {
    const rejected: string[] = [];
    const valid: ImgJob[] = files
      .filter((f) => {
        if (!ACCEPTED_MIME.includes(f.type)) { rejected.push(`${f.name}: نوع غير مدعوم`); return false; }
        if (f.size > MAX_BYTES) { rejected.push(`${f.name}: أكبر من ${fmt(MAX_BYTES)}`); return false; }
        return true;
      })
      .map((file) => ({
        id:      makeId(),
        file,
        preview: URL.createObjectURL(file),
        status:  "waiting" as JobStatus,
        addedAt: Date.now(),
      }));

    setJobs((prev) => [...prev, ...valid]);
    return { added: valid.length, rejected };
  }, []);

  const removeJob = useCallback((id: string) => {
    setJobs((prev) => {
      const j = prev.find((x) => x.id === id);
      if (j) URL.revokeObjectURL(j.preview);
      return prev.filter((x) => x.id !== id);
    });
    processingRef.current.delete(id);
  }, []);

  const retryJob = useCallback((id: string) => {
    updateJob(id, { status: "waiting", error: undefined });
  }, [updateJob]);

  return { jobs, addFiles, removeJob, retryJob, updateJob };
}

// ── المكوّن الرئيسي ─────────────────────────────────────────────────────
export function ImageImportSection() {
  const { showSuccess, showError }            = useAdminShell();
  const { jobs, addFiles, removeJob, retryJob, updateJob } = useImportQueue();
  const [selectedId, setSelectedId]           = useState<string | null>(null);
  const [actionBusy, setActionBusy]           = useState(false);

  const selectedJob = jobs.find((j) => j.id === selectedId) ?? null;

  // اختيار أول وظيفة جاهزة تلقائياً
  useEffect(() => {
    if (selectedId && jobs.some((j) => j.id === selectedId)) return;
    const first = jobs.find((j) => j.status !== "approved" && j.status !== "rejected");
    setSelectedId(first?.id ?? null);
  }, [jobs, selectedId]);

  // إحصائيات سريعة
  const stats = {
    total:    jobs.length,
    waiting:  jobs.filter((j) => j.status === "waiting").length,
    analyzing:jobs.filter((j) => j.status === "analyzing").length,
    review:   jobs.filter((j) => j.status === "needs-review").length,
    done:     jobs.filter((j) => j.status === "completed").length,
    approved: jobs.filter((j) => j.status === "approved").length,
    failed:   jobs.filter((j) => j.status === "failed").length,
  };

  const onFiles = useCallback(
    (files: File[]) => {
      const r = addFiles(files);
      if (!r) return;
      if (r.added)    showSuccess(`تم إضافة ${r.added} صورة للطابور — بدأت المعالجة تلقائياً`);
      if (r.rejected.length) showError(`تجاهل ${r.rejected.length} ملف — ${r.rejected[0]}`);
    },
    [addFiles, showSuccess, showError],
  );

  const onApprove = useCallback(
    async (jobId: string, parsed: ParsedLessonFields) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      setActionBusy(true);
      try {
        let draftId = job.draftId;
        if (!draftId) {
          const save = await saveLessonImportDraft(parsed, {
            imageUrl:      job.imageUrl,
            extractedText: job.extractedText,
          });
          if (!save.ok) { showError(save.error || "تعذر حفظ المسودة"); return; }
          draftId = save.draft_id;
          if (draftId) updateJob(jobId, { draftId });
        }
        if (!draftId) { showError("لا توجد مسودة — حاول مجدداً"); return; }

        const res = await approveLessonImportDraft(draftId, parsed);
        if (!res.ok) {
          const msgs = res.validation?.errors?.map((e) => e.message).join(" — ");
          showError(msgs || res.error || "تعذر الاعتماد");
          return;
        }
        updateJob(jobId, { status: "approved", parsed });
        invalidateLessonsCache();
        showSuccess("✓ تم اعتماد الدرس ونشره في المنصة");
      } catch {
        showError("خطأ غير متوقع أثناء الاعتماد");
      } finally {
        setActionBusy(false);
      }
    },
    [jobs, updateJob, showSuccess, showError],
  );

  const onSaveDraft = useCallback(
    async (jobId: string, parsed: ParsedLessonFields) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      setActionBusy(true);
      try {
        const res = await saveLessonImportDraft(parsed, {
          draftId:       job.draftId,
          imageUrl:      job.imageUrl,
          extractedText: job.extractedText,
        });
        if (!res.ok) { showError(res.error || "تعذر الحفظ"); return; }
        if (res.draft_id) updateJob(jobId, { draftId: res.draft_id, parsed });
        showSuccess("تم حفظ المسودة");
      } catch {
        showError("خطأ غير متوقع");
      } finally {
        setActionBusy(false);
      }
    },
    [jobs, updateJob, showSuccess, showError],
  );

  const onReExtract = useCallback(
    async (jobId: string) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      setActionBusy(true);
      updateJob(jobId, { status: "analyzing", error: undefined });
      try {
        let res;
        if (job.draftId) {
          res = await reExtractLessonImportDraft(job.draftId, job.file);
        } else {
          res = await extractLessonFromImageUpload(job.file);
        }
        if (!res.ok) { showError(res.error || "تعذرت إعادة التحليل"); updateJob(jobId, { status: "failed", error: res.error }); return; }
        const conf        = res.confidence_score ?? 0;
        const isDuplicate = Boolean(res.duplicate?.isDuplicate);
        updateJob(jobId, {
          status:        isDuplicate || conf < 0.45 ? "needs-review" : "completed",
          draftId:       res.draft_id || job.draftId,
          imageUrl:      res.image_url || job.imageUrl,
          extractedText: res.extracted_text || job.extractedText,
          parsed:        { ...EMPTY_PARSED, ...(res.parsed_fields || {}) },
          confidence:    conf,
          missingFields: res.missing_fields || [],
          warnings:      (res.warnings || []) as Array<{ field: string; message: string }>,
          isDuplicate,
          duplicateTitle: res.duplicate?.lesson?.title,
          error:         undefined,
        });
        showSuccess("تم إعادة التحليل");
      } catch {
        showError("خطأ أثناء إعادة التحليل");
        updateJob(jobId, { status: "failed" });
      } finally {
        setActionBusy(false);
      }
    },
    [jobs, updateJob, showSuccess, showError],
  );

  const onReject = useCallback(
    async (jobId: string) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job?.draftId) return;
      setActionBusy(true);
      try {
        await rejectLessonImportDraft(job.draftId);
        updateJob(jobId, { status: "rejected" });
        showSuccess("تم رفض المسودة");
      } catch {
        showError("تعذر الرفض");
      } finally {
        setActionBusy(false);
      }
    },
    [jobs, updateJob, showSuccess, showError],
  );

  return (
    <div className="ii-section">
      {/* ── رأس الصفحة ── */}
      <div className="ii-header">
        <div>
          <p className="ii-header__eyebrow">استخلاص ذكي · AI Vision</p>
          <h2 className="ii-header__title">استخلاص الدروس من الصور</h2>
          <p className="ii-header__sub">
            ارفع إعلانات الدروس (ستوري، منشور، ملصق…) — يحللها الذكاء الاصطناعي ويستخرج جميع البيانات تلقائياً.
          </p>
        </div>
        {stats.total > 0 && (
          <div className="ii-stats">
            {stats.waiting   > 0 && <StatPill n={stats.waiting}   label="انتظار"  color="#64748b" />}
            {stats.analyzing > 0 && <StatPill n={stats.analyzing} label="يُحلَّل"  color="#3b82f6" />}
            {stats.review    > 0 && <StatPill n={stats.review}    label="مراجعة"  color="#f59e0b" />}
            {stats.done      > 0 && <StatPill n={stats.done}      label="جاهز"    color="#22c55e" />}
            {stats.approved  > 0 && <StatPill n={stats.approved}  label="منشور"   color="#10b981" />}
            {stats.failed    > 0 && <StatPill n={stats.failed}    label="فشل"     color="#ef4444" />}
          </div>
        )}
      </div>

      {/* ── منطقة الإفلات ── */}
      <DropZone onFiles={onFiles} busy={false} />

      {/* ── طابور المعالجة ── */}
      {jobs.length > 0 && (
        <div className="ii-queue">
          {/* قائمة الوظائف */}
          <aside className="ii-queue__list" aria-label="قائمة الصور">
            <div className="ii-queue__list-head">
              <span>{jobs.length} صورة</span>
              {stats.analyzing > 0 && (
                <span className="ii-pulse">⬤ يُعالج</span>
              )}
            </div>
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                selected={selectedId === job.id}
                onClick={() => setSelectedId(job.id)}
              />
            ))}
          </aside>

          {/* تفاصيل الوظيفة المحددة */}
          <main className="ii-queue__detail">
            {selectedJob ? (
              <JobDetail
                key={selectedJob.id}
                job={selectedJob}
                onApprove={onApprove}
                onSaveDraft={onSaveDraft}
                onReExtract={onReExtract}
                onReject={onReject}
                onRetry={retryJob}
                onRemove={removeJob}
                busy={actionBusy}
              />
            ) : (
              <div className="ii-queue__empty">
                <span aria-hidden="true" className="iis-drop-icon">👆</span>
                <p>اختر صورة من القائمة لمراجعة بياناتها</p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* دليل استخدام */}
      {jobs.length === 0 && (
        <div className="ii-guide">
          <div className="ii-guide__step"><span className="ii-guide__num">١</span><div><strong>ارفع الإعلانات</strong><p>اسحب أي عدد من صور الإعلانات أو انقر لاختيارها</p></div></div>
          <div className="ii-guide__step"><span className="ii-guide__num">٢</span><div><strong>التحليل التلقائي</strong><p>يستخرج الذكاء الاصطناعي كافة البيانات بشكل فوري (معالجة متوازية حتى {MAX_CONCURRENT})</p></div></div>
          <div className="ii-guide__step"><span className="ii-guide__num">٣</span><div><strong>مراجعة البيانات</strong><p>تحقق من الحقول المُستخرجة وعدّل أي معلومة حسب الحاجة</p></div></div>
          <div className="ii-guide__step"><span className="ii-guide__num">٤</span><div><strong>اعتماد ونشر</strong><p>انقر "اعتماد ونشر" فيُنشر الدرس فوراً في المنصة</p></div></div>
        </div>
      )}
    </div>
  );
}

// ── مساعد صغير ─────────────────────────────────────────────────────────
function StatPill({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <span className="ii-stat-pill" style={{ "--pill-color": color } as React.CSSProperties}>
      <span className="ii-stat-pill__dot" aria-hidden="true" />
      {n} {label}
    </span>
  );
}

export default ImageImportSection;
