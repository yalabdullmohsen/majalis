import { useEffect, useState } from "react";
import { adminGetLibrary, adminUpsertLibraryItem, adminDeleteLibraryItem } from "@/lib/supabase";
import { sanitizeText } from "@/lib/sanitize";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field } from "./AdminModal";
import { BulkImport } from "./BulkImport";

const TYPES = ["كتاب", "متن", "تفريغ", "ملخص", "صوت", "مرئي"];
const EMPTY: any = { title: "", author: "", category: "", item_type: "كتاب", description: "", status: "approved" };

export function LibrarySection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => { const p = new URLSearchParams(window.location.search); return p.get("q") || ""; });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetLibrary().then(({ data }) => {
      setItems(data ?? []);
      setLoading(false);
     }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((item) => {
    const q = search.trim();
    if (!q) return true;
    return `${item.title} ${item.author ?? ""} ${item.category ?? ""}`.includes(q);
  });

  const handleSave = async () => {
    if (!form.title.trim()) return alert("عنوان المادة مطلوب");
    setSaving(true);
    const payload = {
      ...form,
      title: sanitizeText(form.title, 300),
      author: sanitizeText(form.author, 200),
      description: sanitizeText(form.description, 4000),
      category: sanitizeText(form.category, 120),
    };
    await adminUpsertLibraryItem(payload);
    setSaving(false);
    setOpen(false);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>المكتبة ({items.length})</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <BulkImport
            title="استيراد المكتبة"
            template={[{ title: "كتاب العلم", author: "ابن القيم", category: "عقيدة", item_type: "كتاب", status: "approved" }]}
            importRow={(row) => adminUpsertLibraryItem({ status: "approved", ...row })}
            onDone={load}
          />
          <button type="button" onClick={() => { setForm({ ...EMPTY }); setOpen(true); }} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ إضافة</button>
        </div>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="adm-input" style={{ maxWidth: "20rem", marginBottom: "1rem" }} />

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["العنوان", "المؤلف", "التصنيف", "النوع", "إجراءات"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem", textAlign: "right", color: C.emeraldDeep }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem" }}>{item.title}</td>
                  <td style={{ padding: "0.625rem", color: C.inkSoft }}>{item.author || "—"}</td>
                  <td style={{ padding: "0.625rem", color: C.inkSoft }}>{item.category || "—"}</td>
                  <td style={{ padding: "0.625rem", color: C.inkSoft }}>{item.item_type || "—"}</td>
                  <td style={{ padding: "0.625rem" }}>
                    <button type="button" onClick={() => { setForm({ ...EMPTY, ...item }); setOpen(true); }} style={{ marginInlineEnd: "0.5rem" }}>تعديل</button>
                    <button type="button" onClick={() => { if (confirm("حذف؟")) adminDeleteLibraryItem(item.id).then(load); }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal open={open} title={form.id ? "تعديل مادة" : "إضافة مادة"} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="العنوان"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="adm-input" /></Field>
        <Field label="المؤلف"><input value={form.author || ""} onChange={(e) => setForm({ ...form, author: e.target.value })} className="adm-input" /></Field>
        <Field label="التصنيف"><input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="adm-input" /></Field>
        <Field label="النوع">
          <select value={form.item_type || "كتاب"} onChange={(e) => setForm({ ...form, item_type: e.target.value })} className="adm-select">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="الوصف"><textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="adm-textarea" rows={4} /></Field>
      </AdminModal>
    </div>
  );
}
