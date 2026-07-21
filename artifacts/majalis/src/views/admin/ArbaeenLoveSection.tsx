import { useEffect, useState } from "react";
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminModal, Field } from "./AdminModal";
import { sanitizeText } from "@/lib/sanitize";
import {
  adminFetchAllArbaeenLove, adminCreateArbaeenLove, adminUpdateArbaeenLove,
  adminSetArbaeenReviewStatus, adminDeleteArbaeenLove,
  ARBAEEN_REVIEW_STATUS_LABELS,
  type ArbaeenHadith, type ArbaeenReviewStatus,
} from "@/lib/arbaeen-love-service";

const STATUS_FLOW: ArbaeenReviewStatus[] = ["draft", "in_review", "verified", "published", "rejected"];

const EMPTY: Omit<ArbaeenHadith, "id"> = {
  order_number: null, title: "", hadith_text: "", source: "", hadith_number: "",
  grade: null, verified_by: "", review_status: "draft", editor_notes: "",
};

export function ArbaeenLoveSection() {
  const [items, setItems] = useState<ArbaeenHadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<ArbaeenHadith, "id"> & { id?: string }>(EMPTY);

  const load = () => {
    setLoading(true);
    adminFetchAllArbaeenLove().then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.hadith_text.trim() || !form.source.trim()) {
      return alert("العنوان ونص الحديث والمصدر حقول مطلوبة.");
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        title: sanitizeText(form.title, 300),
        hadith_text: sanitizeText(form.hadith_text, 4000),
        source: sanitizeText(form.source, 200),
        hadith_number: form.hadith_number ? sanitizeText(form.hadith_number, 50) : null,
        verified_by: form.verified_by ? sanitizeText(form.verified_by, 200) : null,
        editor_notes: form.editor_notes ? sanitizeText(form.editor_notes, 2000) : null,
      };
      if (form.id) {
        const patch = { ...payload };
        delete (patch as { id?: string }).id;
        const { error } = await adminUpdateArbaeenLove(form.id, patch);
        if (error) throw error;
      } else {
        const { error } = await adminCreateArbaeenLove(payload);
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

  const changeStatus = async (item: ArbaeenHadith, next: ArbaeenReviewStatus) => {
    try {
      const { error } = await adminSetArbaeenReviewStatus(item, next);
      if (error) throw error;
      load();
    } catch (e) {
      alert(String((e as { message?: string })?.message || "تعذّر تغيير الحالة."));
    }
  };

  if (loading) return <SkeletonCardGrid count={6} />;

  const publishedCount = items.filter((i) => i.review_status === "published").length;

  return (
    <div>
      <div className="mir-header">
        <h2 className="mir-title">الأربعون في محبة رب العالمين ({items.length} من 40 — {publishedCount} منشور)</h2>
        <button
          type="button"
          className="mir-add-btn"
          onClick={() => { setForm({ ...EMPTY }); setOpen(true); }}
        >+ إضافة حديث</button>
      </div>

      <p className="adm-empty-msg" style={{ marginBottom: "0.75rem" }}>
        كل نص هنا مسحوب حرفيًا من قاعدة fawazahmed0/hadith-api (مرخّصة MIT، نفس
        مصدر "الكتب الحديثية الكاملة") بلا أي توليد بالذكاء الاصطناعي — لا يظهر
        أي حديث للعامة إلا بحالة "منشور للعامة"، ولا يمكن الانتقال إليها إلا من
        حالة "موثّق" بعد مراجعة عالِم شرعي فعلي لدرجته وصحة نسبته.
      </p>

      {items.length === 0 ? (
        <p className="adm-empty-msg">لا توجد أحاديث بعد.</p>
      ) : (
        <div className="fiqh-review-list">
          {items.map((item) => (
            <article key={item.id} className="fiqh-review-card ui-card">
              <div className="fiqh-review-card-head">
                <div>
                  <h2>{item.order_number ? `${item.order_number}. ` : ""}{item.title}</h2>
                  <p className="fiqh-review-meta">
                    {item.source}{item.hadith_number ? ` رقم ${item.hadith_number}` : ""} · {ARBAEEN_REVIEW_STATUS_LABELS[item.review_status]}
                    {item.grade ? ` · درجة: ${item.grade}` : ""}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: ".85rem", margin: "0.35rem 0" }} dir="rtl">{item.hadith_text}</p>
              {item.editor_notes && <p className="fiqh-review-meta">ملاحظات: {item.editor_notes}</p>}

              <div className="fiqh-review-actions">
                <select
                  value={item.review_status}
                  onChange={(e) => changeStatus(item, e.target.value as ArbaeenReviewStatus)}
                  className="adm-input"
                  style={{ width: "auto" }}
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>{ARBAEEN_REVIEW_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <button type="button" onClick={() => { setForm({ ...item }); setOpen(true); }}>تعديل</button>
                <button
                  type="button"
                  onClick={() => { if (confirm("حذف نهائي لهذا الحديث؟")) adminDeleteArbaeenLove(item.id).then(load); }}
                >حذف</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminModal open={open} title={form.id ? "تعديل حديث" : "إضافة حديث"} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="الترتيب (1-40)"><input type="number" value={form.order_number ?? ""} onChange={(e) => setForm({ ...form, order_number: e.target.value ? Number(e.target.value) : null })} className="adm-input" /></Field>
        <Field label="عنوان مختصر"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="adm-input" /></Field>
        <Field label="نص الحديث الكامل (كما ورد حرفيًا في المصدر)"><textarea value={form.hadith_text} onChange={(e) => setForm({ ...form, hadith_text: e.target.value })} className="adm-textarea" rows={6} dir="rtl" /></Field>
        <Field label="المصدر (مثل: صحيح البخاري)"><input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="adm-input" /></Field>
        <Field label="رقم الحديث"><input value={form.hadith_number || ""} onChange={(e) => setForm({ ...form, hadith_number: e.target.value })} className="adm-input" /></Field>
        <Field label="درجة الحديث">
          <select value={form.grade || ""} onChange={(e) => setForm({ ...form, grade: e.target.value || null })} className="adm-input">
            <option value="">— بلا —</option>
            <option value="صحيح">صحيح</option>
            <option value="حسن">حسن</option>
            <option value="ضعيف">ضعيف</option>
          </select>
        </Field>
        <Field label="المراجع الشرعي / الجهة"><input value={form.verified_by || ""} onChange={(e) => setForm({ ...form, verified_by: e.target.value })} className="adm-input" /></Field>
        <Field label="ملاحظات المحرر"><textarea value={form.editor_notes || ""} onChange={(e) => setForm({ ...form, editor_notes: e.target.value })} className="adm-textarea" rows={2} /></Field>
      </AdminModal>
    </div>
  );
}
