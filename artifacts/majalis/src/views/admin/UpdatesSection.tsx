import { useEffect, useState } from "react";
import { adminGetAllUpdates, adminUpsertUpdate, adminDeleteUpdate } from "@/lib/platform-supabase";
import { UPDATES_SEED } from "@/lib/updates-seed";
import { UPDATE_TYPES } from "@/lib/platform-types";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field } from "./AdminModal";
import { useAdminShell } from "./AdminShell";

const EMPTY = { title: "", summary: "", update_type: "إعلان", source_url: "", status: "approved", published_at: new Date().toISOString() };

export function UpdatesSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); adminGetAllUpdates().then(({ data }) => {  const rows = data ?? []; setItems(rows.length > 0 ? rows : UPDATES_SEED); setLoading(false);  }).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="adm-section-hdr">
        <h2 className="adm-section-h2">آخر المستجدات ({items.length})</h2>
        <button onClick={() => { setForm({ ...EMPTY }); setOpen(true); }} className="adm-btn-add">+ إضافة</button>
      </div>
      {loading ? <Loading /> : items.map((item) => (
        <div key={item.id} className="adm-item-card">
          <span className="adm-type-badge">{item.update_type}</span>
          <strong className="adm-block-title">{item.title}</strong>
          <div className="adm-item-actions">
            <button onClick={() => { setForm({ ...item }); setOpen(true); }} className="adm-btn-sm">تعديل</button>
            <button onClick={() => { if (confirm("حذف؟")) adminDeleteUpdate(item.id).then(load).catch(() => showError("تعذّر الحذف.")); }} className="adm-btn-del">حذف</button>
          </div>
        </div>
      ))}
      <AdminModal open={open} onClose={() => setOpen(false)} title="مستجد" onSave={async () => {
        if (!form.title?.trim()) return showError("العنوان مطلوب");
        setSaving(true);
        const { error } = await adminUpsertUpdate(form);
        setSaving(false);
        if (error) return showError(error.message);
        showSuccess("تم الحفظ"); setOpen(false); load();
      }} saving={saving}>
        <Field label="العنوان"><input className="adm-input" value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="النوع"><select className="adm-select" value={form.update_type} onChange={(e) => set("update_type", e.target.value)}>{UPDATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="الملخص"><textarea className="adm-textarea" value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="رابط"><input className="adm-input" value={form.source_url || ""} onChange={(e) => set("source_url", e.target.value)} /></Field>
        <Field label="الحالة"><select className="adm-select" value={form.status || "approved"} onChange={(e) => set("status", e.target.value)}><option value="approved">منشور</option><option value="pending">معلّق</option></select></Field>
      </AdminModal>
    </div>
  );
}
