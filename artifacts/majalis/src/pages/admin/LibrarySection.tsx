import { useEffect, useState } from "react";
import { adminGetLibrary, adminUpsertLibraryItem, adminDeleteLibraryItem, adminGetSheikhs } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt, selectSt, textareaSt } from "./AdminModal";

const TYPES = ["كتاب", "متن", "تفريغ", "ملخص", "مقال", "صوت", "مرئي"];
const CATS = ["فقه", "عقيدة", "تفسير", "حديث", "سيرة", "أصول", "تزكية", "لغة", "أخرى"];
const STATUSES: Record<string, string> = { approved: "معتمد", pending: "معلّق", rejected: "مرفوض" };
const EMPTY: any = { title: "", type: "", category: "", sheikh_id: "", description: "", external_url: "", file_url: "", status: "approved" };

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

export function LibrarySection() {
  const [items, setItems] = useState<any[]>([]);
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([adminGetLibrary(), adminGetSheikhs()]).then(([{ data: l }, { data: s }]) => {
      setItems(l); setSheikhs(s); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (item: any) => {
    const { sheikhs: _s, ...rest } = item;
    setForm({ ...EMPTY, ...rest, sheikh_id: item.sheikh_id || "" });
    setOpen(true);
  };
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل تريد حذف "${title}"؟`)) return;
    await adminDeleteLibraryItem(id); load();
  };
  const handleSave = async () => {
    if (!form.title.trim()) return alert("العنوان مطلوب");
    if (!form.type) return alert("نوع المادة مطلوب");
    setSaving(true);
    await adminUpsertLibraryItem({ ...form, sheikh_id: form.sheikh_id || null });
    setSaving(false); setOpen(false); load();
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>المكتبة العلمية ({items.length})</h2>
        <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة مادة</button>
      </div>

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["العنوان", "النوع", "التصنيف", "الشيخ / المؤلف", "الحالة", "إجراءات"].map(h => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", color: C.emeraldDeep, fontWeight: 700, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem 0.75rem", color: C.ink, fontWeight: 600, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>
                    <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: C.parchmentDeep, color: C.brassDeep, fontSize: "0.75rem" }}>{item.type || "—"}</span>
                  </td>
                  <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft }}>{item.category || "—"}</td>
                  <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft }}>{item.sheikhs?.name || "—"}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>
                    <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: item.status === "approved" ? "#D1FAE5" : C.parchmentDeep, color: item.status === "approved" ? C.emeraldDeep : C.inkSoft, fontSize: "0.75rem" }}>
                      {STATUSES[item.status] || item.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <button onClick={() => openEdit(item)} style={BTN_EDIT}>تعديل</button>
                      <button onClick={() => handleDelete(item.id, item.title)} style={BTN_DEL}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem" }}>لا توجد مواد — ابدأ بإضافة أول مادة للمكتبة</p>}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل المادة" : "إضافة مادة للمكتبة"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="العنوان *">
          <input style={inputSt} value={form.title} onChange={e => set("title", e.target.value)} placeholder="عنوان الكتاب أو المادة العلمية" />
        </Field>
        <FieldRow>
          <Field label="النوع *">
            <select style={selectSt} value={form.type} onChange={e => set("type", e.target.value)}>
              <option value="">اختر النوع</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="التصنيف">
            <select style={selectSt} value={form.category || ""} onChange={e => set("category", e.target.value)}>
              <option value="">اختر التصنيف</option>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </FieldRow>
        <Field label="الشيخ / المؤلف">
          <select style={selectSt} value={form.sheikh_id || ""} onChange={e => set("sheikh_id", e.target.value)}>
            <option value="">اختر من القائمة (اختياري)</option>
            {sheikhs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="الوصف">
          <textarea style={textareaSt} value={form.description || ""} onChange={e => set("description", e.target.value)} placeholder="وصف المادة العلمية..." />
        </Field>
        <Field label="الرابط الخارجي">
          <input style={inputSt} value={form.external_url || ""} onChange={e => set("external_url", e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="رابط الملف">
          <input style={inputSt} value={form.file_url || ""} onChange={e => set("file_url", e.target.value)} placeholder="رابط الملف في Supabase Storage..." />
        </Field>
        <Field label="الحالة">
          <select style={selectSt} value={form.status} onChange={e => set("status", e.target.value)}>
            {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
