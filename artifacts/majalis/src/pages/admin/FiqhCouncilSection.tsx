import { useEffect, useState } from "react";
import {
  adminGetAllFiqhDecisions,
  adminUpsertFiqhDecision,
  adminDeleteFiqhDecision,
  adminSetPlatformContentStatus,
} from "@/lib/platform-supabase";
import { FIQH_COUNCIL_SEED } from "@/lib/fiqh-council-seed";
import { FIQH_CATEGORIES, FIQH_DECISION_TYPES } from "@/lib/platform-types";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { useAdminShell } from "./AdminShell";

const EMPTY = {
  title: "",
  summary: "",
  body: "",
  decision_type: "قرار",
  category: "قضايا معاصرة",
  session_number: "",
  decision_date: "",
  status: "approved",
};

export function FiqhCouncilSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetAllFiqhDecisions()
      .then(({ data, error }) => {
        setItems(data.length > 0 ? data : FIQH_COUNCIL_SEED);
        if (error) showError("تعذّر تحميل القرارات — عرض البيانات المحلية.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title?.trim()) return showError("العنوان مطلوب");
    setSaving(true);
    const { error } = await adminUpsertFiqhDecision(form);
    setSaving(false);
    if (error) return showError(`تعذّر الحفظ: ${error.message}`);
    showSuccess("تم حفظ القرار");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا القرار؟")) return;
    await adminDeleteFiqhDecision(id);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep }}>المجمع الفقهي ({items.length})</h2>
        <button onClick={() => { setForm({ ...EMPTY }); setOpen(true); }} style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>+ إضافة</button>
      </div>
      {loading ? <Loading /> : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {items.map((item) => (
            <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem" }}>
              <strong>{item.title}</strong>
              <p style={{ margin: "0.5rem 0", fontSize: "0.875rem", color: C.inkSoft }}>{item.category} · {item.decision_type}</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={() => { setForm({ ...item }); setOpen(true); }} style={{ fontSize: "0.75rem", cursor: "pointer" }}>تعديل</button>
                {item.status !== "approved" && (
                  <button onClick={() => adminSetPlatformContentStatus("fiqh_council_decisions", item.id, "approved").then(load)} style={{ fontSize: "0.75rem", cursor: "pointer" }}>نشر</button>
                )}
                <button onClick={() => handleDelete(item.id)} style={{ fontSize: "0.75rem", color: "#dc2626", cursor: "pointer" }}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AdminModal open={open} onClose={() => setOpen(false)} title="قرار المجمع الفقهي" onSave={handleSave} saving={saving}>
        <Field label="العنوان"><input style={inputSt} value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="النوع">
          <select style={selectSt} value={form.decision_type} onChange={(e) => set("decision_type", e.target.value)}>
            {FIQH_DECISION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="التصنيف">
          <select style={selectSt} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {FIQH_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="الملخص"><textarea style={textareaSt} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="النص"><textarea style={textareaSt} value={form.body || ""} onChange={(e) => set("body", e.target.value)} rows={6} /></Field>
        <Field label="رقم الجلسة"><input style={inputSt} value={form.session_number || ""} onChange={(e) => set("session_number", e.target.value)} /></Field>
        <Field label="تاريخ القرار"><input style={inputSt} type="date" value={form.decision_date || ""} onChange={(e) => set("decision_date", e.target.value)} /></Field>
        <Field label="الحالة">
          <select style={selectSt} value={form.status || "approved"} onChange={(e) => set("status", e.target.value)}>
            <option value="approved">منشور</option>
            <option value="pending">معلّق</option>
            <option value="draft">مسودة</option>
            <option value="archived">مؤرشف</option>
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
