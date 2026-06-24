import { useEffect, useState } from "react";
import { adminDeleteBook, adminGetBooks, adminUpsertBook } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt, selectSt, textareaSt } from "./AdminModal";

const CATS = ["عقيدة", "فقه", "تفسير", "حديث", "سيرة", "أخرى"];
const STATUSES: Record<string, string> = { published: "منشور", draft: "مسودة", archived: "أرشيف" };
const EMPTY: any = { title: "", author: "", category: "", pdf_url: "", cover_url: "", description: "", status: "published" };

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

export function BooksSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    adminGetBooks().then(({ data }) => { setItems(data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((b) =>
    !search.trim() || [b.title, b.author, b.category].some((v) => v?.includes(search.trim()))
  );

  const openAdd = () => { setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (item: any) => { setForm({ ...EMPTY, ...item }); setOpen(true); };
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل تريد حذف "${title}"؟`)) return;
    await adminDeleteBook(id);
    load();
  };
  const handleSave = async () => {
    if (!form.title.trim()) return alert("العنوان مطلوب");
    setSaving(true);
    await adminUpsertBook(form);
    setSaving(false);
    setOpen(false);
    load();
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>الكتب ({items.length})</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." style={{ ...inputSt, width: "10rem" }} />
          <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة كتاب</button>
        </div>
      </div>

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["العنوان", "المؤلف", "التصنيف", "الحالة", "إجراءات"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 700, color: C.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{b.title}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{b.author}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{b.category}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{STATUSES[b.status] || b.status}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>
                    <button style={BTN_EDIT} onClick={() => openEdit(b)}>تعديل</button>
                    {" "}
                    <button style={BTN_DEL} onClick={() => handleDelete(b.id, b.title)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <AdminModal title={form.id ? "تعديل كتاب" : "إضافة كتاب"} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          <Field label="العنوان *"><input style={inputSt} value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <FieldRow>
            <Field label="المؤلف"><input style={inputSt} value={form.author || ""} onChange={(e) => set("author", e.target.value)} /></Field>
            <Field label="التصنيف">
              <select style={selectSt} value={form.category || ""} onChange={(e) => set("category", e.target.value)}>
                <option value="">—</option>
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </FieldRow>
          <Field label="الوصف"><textarea style={textareaSt} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <FieldRow>
            <Field label="رابط PDF"><input style={inputSt} value={form.pdf_url || ""} onChange={(e) => set("pdf_url", e.target.value)} /></Field>
            <Field label="رابط الغلاف"><input style={inputSt} value={form.cover_url || ""} onChange={(e) => set("cover_url", e.target.value)} /></Field>
          </FieldRow>
          <Field label="الحالة">
            <select style={selectSt} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </AdminModal>
      )}
    </div>
  );
}
