import { useEffect, useState } from "react";
import { adminGetAllRulings, adminUpsertRuling, adminDeleteRuling } from "@/lib/platform-supabase";
import { RULINGS_SEED } from "@/lib/rulings-seed";
import { RULING_CATEGORIES } from "@/lib/platform-types";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { useAdminShell } from "./AdminShell";

const EMPTY = { title: "", summary: "", body: "", category: "العبادات", status: "approved" };

export function RulingsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); adminGetAllRulings().then(({ data }) => { setItems(data.length > 0 ? data : RULINGS_SEED); setLoading(false); }); };
  useEffect(() => { load(); }, []);
  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep }}>الأحكام الشرعية ({items.length})</h2>
        <button onClick={() => { setForm({ ...EMPTY }); setOpen(true); }} style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>+ إضافة</button>
      </div>
      {loading ? <Loading /> : items.map((item) => (
        <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}>
          <strong>{item.title}</strong> — <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{item.category}</span>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button onClick={() => { setForm({ ...item }); setOpen(true); }} style={{ fontSize: "0.75rem" }}>تعديل</button>
            <button onClick={() => { if (confirm("حذف؟")) adminDeleteRuling(item.id).then(load); }} style={{ fontSize: "0.75rem", color: "#dc2626" }}>حذف</button>
          </div>
        </div>
      ))}
      <AdminModal open={open} onClose={() => setOpen(false)} title="حكم شرعي" onSave={async () => {
        if (!form.title?.trim() || !form.body?.trim()) return showError("العنوان والنص مطلوبان");
        setSaving(true);
        const { error } = await adminUpsertRuling(form);
        setSaving(false);
        if (error) return showError(error.message);
        showSuccess("تم الحفظ"); setOpen(false); load();
      }} saving={saving}>
        <Field label="العنوان"><input style={inputSt} value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="التصنيف"><select style={selectSt} value={form.category} onChange={(e) => set("category", e.target.value)}>{RULING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
        <Field label="الملخص"><textarea style={textareaSt} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="النص"><textarea style={textareaSt} value={form.body || ""} onChange={(e) => set("body", e.target.value)} rows={8} /></Field>
        <Field label="الحالة"><select style={selectSt} value={form.status || "approved"} onChange={(e) => set("status", e.target.value)}><option value="approved">منشور</option><option value="pending">معلّق</option></select></Field>
      </AdminModal>
    </div>
  );
}
