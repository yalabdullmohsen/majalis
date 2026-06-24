import { useEffect, useState } from "react";
import { adminDeleteDailyContent, adminGetDailyContent, adminUpsertDailyContent } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt, selectSt, textareaSt } from "./AdminModal";

const TYPES: Record<string, string> = { hadith: "حديث", ayah: "آية", lesson: "درس" };
const EMPTY: any = { type: "hadith", title: "", content: "", source: "", explanation: "", publish_date: new Date().toISOString().slice(0, 10), is_published: true };

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

export function DailyContentSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("");

  const load = () => {
    setLoading(true);
    adminGetDailyContent().then(({ data }) => { setItems(data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((d) => !filterType || d.type === filterType);

  const openAdd = () => { setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (item: any) => { setForm({ ...EMPTY, ...item }); setOpen(true); };
  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد الحذف؟")) return;
    await adminDeleteDailyContent(id);
    load();
  };
  const handleSave = async () => {
    if (!form.content.trim()) return alert("المحتوى مطلوب");
    setSaving(true);
    await adminUpsertDailyContent(form);
    setSaving(false);
    setOpen(false);
    load();
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>محتوى اليوم ({items.length})</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <select style={selectSt} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">كل الأنواع</option>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة</button>
        </div>
      </div>

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["النوع", "التاريخ", "المحتوى", "منشور", "إجراءات"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 700, color: C.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{TYPES[d.type] || d.type}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{d.publish_date}</td>
                  <td style={{ padding: "0.625rem 0.75rem", maxWidth: "20rem" }}>{d.content?.slice(0, 80)}...</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{d.is_published ? "نعم" : "لا"}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>
                    <button style={BTN_EDIT} onClick={() => openEdit(d)}>تعديل</button>
                    {" "}
                    <button style={BTN_DEL} onClick={() => handleDelete(d.id)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <AdminModal title={form.id ? "تعديل محتوى" : "إضافة محتوى يومي"} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          <FieldRow>
            <Field label="النوع">
              <select style={selectSt} value={form.type} onChange={(e) => set("type", e.target.value)}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="تاريخ النشر"><input style={inputSt} type="date" value={form.publish_date?.slice(0, 10) || ""} onChange={(e) => set("publish_date", e.target.value)} /></Field>
          </FieldRow>
          <Field label="العنوان"><input style={inputSt} value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="المحتوى *"><textarea style={textareaSt} value={form.content} onChange={(e) => set("content", e.target.value)} /></Field>
          <Field label="المصدر"><input style={inputSt} value={form.source || ""} onChange={(e) => set("source", e.target.value)} /></Field>
          <Field label="الشرح / المعنى"><textarea style={textareaSt} value={form.explanation || ""} onChange={(e) => set("explanation", e.target.value)} /></Field>
          <Field label="منشور">
            <select style={selectSt} value={form.is_published ? "true" : "false"} onChange={(e) => set("is_published", e.target.value === "true")}>
              <option value="true">نعم</option>
              <option value="false">لا</option>
            </select>
          </Field>
        </AdminModal>
      )}
    </div>
  );
}
