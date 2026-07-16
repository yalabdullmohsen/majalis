import { useEffect, useState } from "react";
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminModal, Field } from "./AdminModal";
import { sanitizeText } from "@/lib/sanitize";
import {
  adminFetchAllWeekDayFacts, adminCreateWeekDayFact, adminUpdateWeekDayFact,
  adminSetWeekDayReviewStatus, adminDeleteWeekDayFact,
  WEEK_DAY_LABELS, WEEK_DAY_REVIEW_STATUS_LABELS, weekDayInfoTypeLabel,
  type WeekDayFact, type WeekDayCode, type WeekDayInfoType, type WeekDayReviewStatus,
} from "@/lib/week-day-facts-service";

const DAY_ORDER: WeekDayCode[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];
const INFO_TYPES: WeekDayInfoType[] = ["recurring_virtue", "historical_event", "organizational_suggestion"];
const STATUS_FLOW: WeekDayReviewStatus[] = [
  "draft", "needs_source", "in_review", "verified", "needs_completion", "published", "rejected", "archived",
];

const EMPTY: Omit<WeekDayFact, "id"> = {
  day_of_week: "sat", info_type: "recurring_virtue", title: "", body: "",
  source_text: "", reference: "", grade: null, verified_by: "",
  review_status: "draft", editor_notes: "", sort_order: 0,
};

export function WeekDayFactsSection() {
  const [items, setItems] = useState<WeekDayFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState<WeekDayCode | "all">("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<WeekDayFact, "id"> & { id?: string }>(EMPTY);

  const load = () => {
    setLoading(true);
    adminFetchAllWeekDayFacts().then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = dayFilter === "all" ? items : items.filter((i) => i.day_of_week === dayFilter);

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) return alert("العنوان والنص مطلوبان.");
    setSaving(true);
    try {
      const payload = {
        ...form,
        title: sanitizeText(form.title, 200),
        body: sanitizeText(form.body, 4000),
        source_text: form.source_text ? sanitizeText(form.source_text, 2000) : null,
        reference: form.reference ? sanitizeText(form.reference, 300) : null,
        verified_by: form.verified_by ? sanitizeText(form.verified_by, 200) : null,
        editor_notes: form.editor_notes ? sanitizeText(form.editor_notes, 2000) : null,
      };
      if (form.id) {
        const { id: _id, ...patch } = payload;
        const { error } = await adminUpdateWeekDayFact(form.id, patch);
        if (error) throw error;
      } else {
        const { error } = await adminCreateWeekDayFact(payload);
        if (error) throw error;
      }
      setOpen(false);
      load();
    } catch (e) {
      alert(String((e as { message?: string })?.message || "تعذّر الحفظ."));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (item: WeekDayFact, next: WeekDayReviewStatus) => {
    try {
      const { error } = await adminSetWeekDayReviewStatus(item, next);
      if (error) throw error;
      load();
    } catch (e) {
      alert(String((e as { message?: string })?.message || "تعذّر تغيير الحالة."));
    }
  };

  if (loading) return <SkeletonCardGrid count={6} />;

  return (
    <div>
      <div className="mir-header">
        <h2 className="mir-title">أيام الأسبوع ({items.length})</h2>
        <button
          type="button"
          className="mir-add-btn"
          onClick={() => { setForm({ ...EMPTY }); setOpen(true); }}
        >+ إضافة مادة</button>
      </div>

      <p className="adm-empty-msg" style={{ marginBottom: "0.75rem" }}>
        لا يظهر أي محتوى للعامة إلا بحالة "منشور للعامة"، ولا يمكن الانتقال إليها إلا من حالة "موثّق".
        إن لم يكن ليوم أي مادة منشورة تعرض الواجهة العامة رسالة عدم وجود مادة موثقة بدل اختلاق نص.
      </p>

      <div className="fiqh-review-filters">
        <button type="button" className={dayFilter === "all" ? "fiqh-review-filter--active" : ""} onClick={() => setDayFilter("all")}>الكل</button>
        {DAY_ORDER.map((d) => (
          <button key={d} type="button" className={dayFilter === d ? "fiqh-review-filter--active" : ""} onClick={() => setDayFilter(d)}>
            {WEEK_DAY_LABELS[d]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="adm-empty-msg">لا توجد مواد في هذا التصنيف.</p>
      ) : (
        <div className="fiqh-review-list">
          {filtered.map((item) => (
            <article key={item.id} className="fiqh-review-card ui-card">
              <div className="fiqh-review-card-head">
                <div>
                  <h2>{item.title}</h2>
                  <p className="fiqh-review-meta">
                    {WEEK_DAY_LABELS[item.day_of_week]} · {weekDayInfoTypeLabel(item.info_type)} · {WEEK_DAY_REVIEW_STATUS_LABELS[item.review_status]}
                    {item.grade ? ` · درجة: ${item.grade}` : ""}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: ".85rem", margin: "0.35rem 0" }}>{item.body}</p>
              {item.reference && <p className="fiqh-review-meta">المرجع: {item.reference}</p>}
              {item.editor_notes && <p className="fiqh-review-meta">ملاحظات: {item.editor_notes}</p>}

              <div className="fiqh-review-actions">
                <select
                  value={item.review_status}
                  onChange={(e) => changeStatus(item, e.target.value as WeekDayReviewStatus)}
                  className="adm-input"
                  style={{ width: "auto" }}
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>{WEEK_DAY_REVIEW_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <button type="button" onClick={() => { setForm({ ...item }); setOpen(true); }}>تعديل</button>
                <button
                  type="button"
                  onClick={() => { if (confirm("حذف نهائي لهذه المادة؟")) adminDeleteWeekDayFact(item.id).then(load); }}
                >حذف</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminModal open={open} title={form.id ? "تعديل مادة" : "إضافة مادة"} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="اليوم">
          <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value as WeekDayCode })} className="adm-input">
            {DAY_ORDER.map((d) => <option key={d} value={d}>{WEEK_DAY_LABELS[d]}</option>)}
          </select>
        </Field>
        <Field label="نوع المعلومة">
          <select value={form.info_type} onChange={(e) => setForm({ ...form, info_type: e.target.value as WeekDayInfoType })} className="adm-input">
            {INFO_TYPES.map((t) => <option key={t} value={t}>{weekDayInfoTypeLabel(t)}</option>)}
          </select>
        </Field>
        <Field label="العنوان"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="adm-input" /></Field>
        <Field label="النص المعروض"><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="adm-textarea" rows={4} /></Field>
        <Field label="نص المصدر الأصلي (اختياري)"><textarea value={form.source_text || ""} onChange={(e) => setForm({ ...form, source_text: e.target.value })} className="adm-textarea" rows={3} /></Field>
        <Field label="المرجع (الكتاب ورقم الحديث)"><input value={form.reference || ""} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="adm-input" /></Field>
        <Field label="درجة الحديث">
          <select value={form.grade || ""} onChange={(e) => setForm({ ...form, grade: e.target.value || null })} className="adm-input">
            <option value="">— بلا —</option>
            <option value="صحيح">صحيح</option>
            <option value="حسن">حسن</option>
            <option value="ضعيف">ضعيف</option>
            <option value="لا ينطبق">لا ينطبق</option>
          </select>
        </Field>
        <Field label="المراجع الشرعي / الجهة"><input value={form.verified_by || ""} onChange={(e) => setForm({ ...form, verified_by: e.target.value })} className="adm-input" /></Field>
        <Field label="ملاحظات المحرر"><textarea value={form.editor_notes || ""} onChange={(e) => setForm({ ...form, editor_notes: e.target.value })} className="adm-textarea" rows={2} /></Field>
        <Field label="ترتيب العرض"><input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} className="adm-input" /></Field>
      </AdminModal>
    </div>
  );
}
