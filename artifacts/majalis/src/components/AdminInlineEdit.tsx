import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

// ── أنواع المحتوى المدعومة ──────────────────────────────────────────────────
export type InlineEditContentType =
  | "lesson"
  | "library"
  | "fatwa"
  | "ruling"
  | "fawaid"
  | "qa"
  | "miracle"
  | "annual-course"
  | "fiqh-council"
  | "adhkar"
  | "story";

type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number";
  rows?: number;
};

// ── حقول كل نوع محتوى ──────────────────────────────────────────────────────
const FIELDS: Record<InlineEditContentType, FieldDef[]> = {
  lesson: [
    { key: "title", label: "العنوان", type: "text" },
    { key: "category", label: "التصنيف", type: "text" },
    { key: "mosque", label: "المسجد / المكان", type: "text" },
    { key: "region", label: "المنطقة", type: "text" },
    { key: "day_of_week", label: "اليوم", type: "text" },
    { key: "lesson_time", label: "الوقت", type: "text" },
    { key: "description", label: "الوصف", type: "textarea", rows: 5 },
  ],
  library: [
    { key: "title", label: "عنوان الكتاب", type: "text" },
    { key: "author", label: "المؤلف", type: "text" },
    { key: "category", label: "التصنيف", type: "text" },
    { key: "description", label: "الوصف", type: "textarea", rows: 5 },
  ],
  fatwa: [
    { key: "title", label: "عنوان الفتوى", type: "text" },
    { key: "category", label: "التصنيف", type: "text" },
    { key: "question", label: "السؤال", type: "textarea", rows: 4 },
    { key: "answer", label: "الجواب", type: "textarea", rows: 6 },
  ],
  ruling: [
    { key: "title", label: "عنوان الحكم", type: "text" },
    { key: "category", label: "التصنيف", type: "text" },
    { key: "subcategory", label: "التصنيف الفرعي", type: "text" },
    { key: "content", label: "المحتوى", type: "textarea", rows: 7 },
    { key: "evidence", label: "الدليل", type: "textarea", rows: 4 },
  ],
  fawaid: [
    { key: "text", label: "نص الفائدة", type: "textarea", rows: 5 },
    { key: "source", label: "المصدر", type: "text" },
    { key: "category", label: "التصنيف", type: "text" },
  ],
  qa: [
    { key: "question", label: "السؤال", type: "textarea", rows: 3 },
    { key: "answer", label: "الجواب", type: "textarea", rows: 6 },
    { key: "category", label: "التصنيف", type: "text" },
  ],
  miracle: [
    { key: "title", label: "العنوان", type: "text" },
    { key: "category", label: "التصنيف", type: "text" },
    { key: "content", label: "المحتوى", type: "textarea", rows: 7 },
  ],
  "annual-course": [
    { key: "title", label: "عنوان الدورة", type: "text" },
    { key: "location", label: "الموقع", type: "text" },
    { key: "start_date", label: "تاريخ البداية", type: "text" },
    { key: "description", label: "الوصف", type: "textarea", rows: 5 },
  ],
  "fiqh-council": [
    { key: "title", label: "العنوان", type: "text" },
    { key: "category", label: "التصنيف", type: "text" },
    { key: "summary", label: "الملخص", type: "textarea", rows: 5 },
  ],
  adhkar: [
    { key: "text", label: "نص الذكر", type: "textarea", rows: 5 },
    { key: "times", label: "عدد المرات", type: "text" },
    { key: "category", label: "التصنيف", type: "text" },
  ],
  story: [
    { key: "title", label: "العنوان", type: "text" },
    { key: "category", label: "التصنيف", type: "text" },
    { key: "summary", label: "الملخص", type: "textarea", rows: 3 },
    { key: "content", label: "المحتوى", type: "textarea", rows: 8 },
  ],
};

const LABELS: Record<InlineEditContentType, string> = {
  lesson: "الدرس",
  library: "الكتاب",
  fatwa: "الفتوى",
  ruling: "الحكم الشرعي",
  fawaid: "الفائدة",
  qa: "السؤال والجواب",
  miracle: "المقالة",
  "annual-course": "الدورة",
  "fiqh-council": "قرار المجلس",
  adhkar: "الذكر",
  story: "القصة",
};

// ── دالة الحفظ الموحدة ──────────────────────────────────────────────────────
async function saveContent(
  contentType: InlineEditContentType,
  contentId: string | number,
  data: Record<string, unknown>
): Promise<{ error?: string }> {
  const payload = { ...data, id: contentId };
  try {
    let result: { error: unknown } | null = null;
    switch (contentType) {
      case "lesson": {
        const m = await import("@/lib/supabase");
        result = await m.adminUpsertLesson(payload);
        break;
      }
      case "library": {
        const m = await import("@/lib/supabase");
        result = await m.adminUpsertLibraryItem(payload);
        break;
      }
      case "fatwa": {
        const m = await import("@/lib/platform-supabase");
        result = await m.adminUpsertFatwa(payload);
        break;
      }
      case "ruling": {
        const m = await import("@/lib/platform-supabase");
        result = await m.adminUpsertRuling(payload);
        break;
      }
      case "fawaid": {
        const m = await import("@/lib/supabase");
        result = await m.adminUpsertFawaid(payload);
        break;
      }
      case "qa": {
        const m = await import("@/lib/supabase");
        result = await m.adminUpsertQuestion(payload);
        break;
      }
      case "miracle": {
        const m = await import("@/lib/supabase");
        result = await m.adminUpsertMiracle(payload);
        break;
      }
      case "annual-course": {
        const m = await import("@/lib/platform-supabase");
        result = await m.adminUpsertAnnualCourse(payload);
        break;
      }
      case "fiqh-council": {
        const m = await import("@/lib/fiqh-council-supabase");
        result = await m.adminUpsertFiqhCouncilItem(payload);
        break;
      }
      case "adhkar": {
        const m = await import("@/lib/adhkar-admin");
        m.upsertAdhkarItem(payload as Parameters<typeof m.upsertAdhkarItem>[0]);
        return {};
      }
      case "story": {
        const { supabase } = await import("@/lib/supabase");
        const { error } = await supabase
          .from("islamic_stories")
          .update({ title: data.title, summary: data.summary, content: data.content, category: data.category })
          .eq("id", contentId);
        if (error) return { error: error.message };
        return {};
      }
    }
    if (result && result.error) {
      const e = result.error as { message?: string };
      return { error: e.message || "حدث خطأ أثناء الحفظ" };
    }
    return {};
  } catch (err) {
    return { error: String(err) };
  }
}

// ── المودال ──────────────────────────────────────────────────────────────────
type ModalProps = {
  contentType: InlineEditContentType;
  contentId: string | number;
  initialData?: Record<string, unknown>;
  onClose: () => void;
  onSaved?: () => void;
};

function AdminEditModal({ contentType, contentId, initialData = {}, onClose, onSaved }: ModalProps) {
  const fields = FIELDS[contentType];
  const [form, setForm] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const f of fields) {
      const val = initialData[f.key];
      out[f.key] = val != null ? String(val) : "";
    }
    return out;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const data: Record<string, unknown> = {};
    for (const f of fields) data[f.key] = form[f.key];
    const result = await saveContent(contentType, contentId, data);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => {
        onClose();
        onSaved?.();
        // إعادة تحميل الصفحة لتطبيق التعديلات
        window.location.reload();
      }, 800);
    }
  };

  // إغلاق بالضغط على Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر
    // داخل النافذة — مساران بديلان كاملان بلوحة المفاتيح.
    <div className="aie-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label={`تعديل ${LABELS[contentType]}`}>
      <div className="aie-modal" dir="rtl">
        {/* رأس المودال */}
        <div className="aie-modal__header">
          <h2 className="aie-modal__title"><Pencil size={15} className="inline ml-1" /> تعديل {LABELS[contentType]}</h2>
          <button type="button" className="aie-modal__close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        {/* الحقول */}
        <div className="aie-modal__body">
          {fields.map((f) => (
            <div key={f.key} className="aie-field">
              <label className="aie-field__label" htmlFor={`aie-${f.key}`}>{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  id={`aie-${f.key}`}
                  className="aie-field__input aie-field__textarea"
                  rows={f.rows || 4}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  dir="rtl"
                />
              ) : (
                <input
                  id={`aie-${f.key}`}
                  type="text"
                  className="aie-field__input"
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  dir="rtl"
                />
              )}
            </div>
          ))}
        </div>

        {/* الإجراءات */}
        <div className="aie-modal__footer">
          {error && <p className="aie-modal__error"><AlertTriangle size={13} className="inline ml-1" />{error}</p>}
          {saved && <p className="aie-modal__success">✓ تم الحفظ بنجاح</p>}
          <div className="aie-modal__actions">
            <button type="button" className="aie-btn aie-btn--ghost" onClick={onClose} disabled={saving}>
              إلغاء
            </button>
            <button type="button" className="aie-btn aie-btn--primary" onClick={handleSave} disabled={saving || saved}>
              {saving ? "جارٍ الحفظ…" : "حفظ التعديلات"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── زر التعديل المباشر ───────────────────────────────────────────────────────
type AdminInlineEditProps = {
  contentType: InlineEditContentType;
  contentId: string | number;
  initialData?: Record<string, unknown>;
  /** className إضافي للزر (اختياري) */
  className?: string;
  onSaved?: () => void;
};

export function AdminInlineEdit({ contentType, contentId, initialData, className, onSaved }: AdminInlineEditProps) {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => setOpen(false), []);

  if (!isAdmin || !contentId) return null;

  return (
    <>
      <button
        type="button"
        className={`aie-trigger ${className || ""}`}
        onClick={() => setOpen(true)}
        title={`تعديل ${LABELS[contentType] || "المحتوى"}`}
        aria-label="تعديل"
      >
        <Pencil size={14} className="inline ml-1" />تعديل
      </button>

      {open && (
        <AdminEditModal
          contentType={contentType}
          contentId={contentId}
          initialData={initialData}
          onClose={handleClose}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
