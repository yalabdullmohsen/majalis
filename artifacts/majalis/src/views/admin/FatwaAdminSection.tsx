import { useEffect, useState } from "react";
import { adminGetAllFatwas, adminUpsertFatwa, adminDeleteFatwa, adminSetPlatformContentStatus } from "@/lib/platform-supabase";
import { FATWA_SEED } from "@/lib/fatwa-seed";
import { FATWA_CATEGORIES } from "@/lib/platform-types";
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminModal, Field } from "./AdminModal";
import { useAdminShell } from "./AdminShell";

const EMPTY = { question: "", answer: "", summary: "", category: "فقه عام", format: "written", mufti_name: "", status: "approved" };

export function FatwaAdminSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetAllFatwas().then(({ data }) => {  setItems(data.length > 0 ? data : FATWA_SEED); setLoading(false);  }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="adm-section-hdr">
        <h2 className="adm-section-h2">الفتاوى ({items.length})</h2>
        <button onClick={() => { setForm({ ...EMPTY }); setOpen(true); }} className="adm-btn-add">+ إضافة</button>
      </div>
      {loading ? <SkeletonCardGrid count={6} /> : items.map((item) => (
        <div key={item.id} className="adm-item-card">
          <strong>{item.question}</strong>
          <div className="adm-item-actions">
            <button onClick={() => { setForm({ ...item }); setOpen(true); }} className="adm-btn-sm">تعديل</button>
            {item.status !== "approved" && <button onClick={() => adminSetPlatformContentStatus("fatwas", item.id, "approved").then(load)} className="adm-btn-sm">نشر</button>}
            <button onClick={() => { if (confirm("حذف؟")) adminDeleteFatwa(item.id).then(load); }} className="adm-btn-del">حذف</button>
          </div>
        </div>
      ))}
      <AdminModal open={open} onClose={() => setOpen(false)} title="فتوى" onSave={async () => {
        if (!form.question?.trim() || !form.answer?.trim()) return showError("السؤال والجواب مطلوبان");
        setSaving(true);
        const { error } = await adminUpsertFatwa(form);
        setSaving(false);
        if (error) return showError(error.message);
        showSuccess("تم الحفظ"); setOpen(false); load();
      }} saving={saving}>
        <Field label="السؤال"><textarea className="adm-textarea" value={form.question || ""} onChange={(e) => set("question", e.target.value)} rows={2} /></Field>
        <Field label="الجواب"><textarea className="adm-textarea" value={form.answer || ""} onChange={(e) => set("answer", e.target.value)} rows={6} /></Field>
        <Field label="التصنيف"><select className="adm-select" value={form.category} onChange={(e) => set("category", e.target.value)}>{FATWA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
        <Field label="الصيغة"><select className="adm-select" value={form.format} onChange={(e) => set("format", e.target.value)}><option value="written">مكتوبة</option><option value="audio">صوتية</option><option value="both">كلاهما</option></select></Field>
        <Field label="المفتي"><input className="adm-input" value={form.mufti_name || ""} onChange={(e) => set("mufti_name", e.target.value)} /></Field>
        <Field label="رابط صوتي"><input className="adm-input" value={form.audio_url || ""} onChange={(e) => set("audio_url", e.target.value)} /></Field>
        <Field label="الحالة"><select className="adm-select" value={form.status || "approved"} onChange={(e) => set("status", e.target.value)}><option value="approved">منشور</option><option value="pending">معلّق</option></select></Field>
      </AdminModal>
    </div>
  );
}
