import { useEffect, useState } from "react";
import { adminGetMiracles, adminUpsertMiracle, adminDeleteMiracle } from "@/lib/supabase";
import { sanitizeText } from "@/lib/sanitize";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, textareaSt } from "./AdminModal";
import { BulkImport } from "./BulkImport";

const EMPTY: any = { title: "", category: "", body: "", status: "approved" };

export function MiraclesSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetMiracles().then(({ data }) => {
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
    return `${item.title} ${item.category ?? ""} ${item.body ?? item.summary ?? ""}`.includes(q);
  });

  const handleSave = async () => {
    if (!form.title.trim()) return alert("العنوان مطلوب");
    setSaving(true);
    const { error } = await adminUpsertMiracle({
      ...form,
      title: sanitizeText(form.title, 300),
      category: sanitizeText(form.category, 120),
      body: sanitizeText(form.body ?? form.summary ?? "", 6000),
    });
    setSaving(false);
    if (error) return alert("تعذّر الحفظ.");
    setOpen(false);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>الإعجاز العلمي ({items.length})</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <BulkImport
            title="استيراد مقالات"
            template={[{ title: "الإعجاز في خلق الإنسان", category: "الأجنة", body: "ملخص المقال...", status: "approved" }]}
            importRow={(row) => adminUpsertMiracle({ status: "approved", ...row })}
            onDone={load}
          />
          <button type="button" onClick={() => { setForm({ ...EMPTY }); setOpen(true); }} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: "white", border: "none", cursor: "pointer" }}>+ إضافة</button>
        </div>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." style={{ ...inputSt, maxWidth: "20rem", marginBottom: "1rem" }} />

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["العنوان", "التصنيف", "إجراءات"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem", textAlign: "right", color: C.emeraldDeep }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem" }}>{item.title}</td>
                  <td style={{ padding: "0.625rem", color: C.inkSoft }}>{item.category || "—"}</td>
                  <td style={{ padding: "0.625rem" }}>
                    <button type="button" onClick={() => { setForm({ ...EMPTY, ...item }); setOpen(true); }} style={{ marginInlineEnd: "0.5rem" }}>تعديل</button>
                    <button type="button" onClick={() => { if (confirm("حذف؟")) adminDeleteMiracle(item.id).then(load).catch(() => alert("تعذّر الحذف.")); }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal open={open} title={form.id ? "تعديل مقال" : "إضافة مقال"} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="العنوان"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputSt} /></Field>
        <Field label="التصنيف"><input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputSt} /></Field>
        <Field label="المحتوى"><textarea value={form.body || form.summary || ""} onChange={(e) => setForm({ ...form, body: e.target.value })} style={textareaSt} rows={6} /></Field>
      </AdminModal>
    </div>
  );
}
