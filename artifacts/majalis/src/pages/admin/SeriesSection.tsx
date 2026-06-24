import { useEffect, useState } from "react";
import { adminDeleteLessonSeries, adminGetLessonSeries, adminGetSheikhs, adminUpsertLessonSeries } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt, selectSt, textareaSt } from "./AdminModal";

const CATS = ["العقيدة", "الفقه", "التفسير", "الحديث", "السيرة"];
const STATUSES: Record<string, string> = { published: "منشور", draft: "مسودة", archived: "أرشيف" };
const EMPTY: any = { title: "", description: "", category: "", sheikh_id: "", total_lessons: 0, completed_lessons: 0, status: "published" };

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

export function SeriesSection() {
  const [items, setItems] = useState<any[]>([]);
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([adminGetLessonSeries(), adminGetSheikhs()]).then(([{ data: s }, { data: sh }]) => {
      setItems(s);
      setSheikhs(sh);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((s) =>
    !search.trim() || [s.title, s.category, s.sheikhs?.name].some((v) => v?.includes(search.trim()))
  );

  const openAdd = () => { setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (item: any) => {
    setForm({ ...EMPTY, ...item, sheikh_id: item.sheikh_id || "" });
    setOpen(true);
  };
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل تريد حذف "${title}"؟`)) return;
    await adminDeleteLessonSeries(id);
    load();
  };
  const handleSave = async () => {
    if (!form.title.trim()) return alert("العنوان مطلوب");
    setSaving(true);
    await adminUpsertLessonSeries({ ...form, sheikh_id: form.sheikh_id || null, total_lessons: Number(form.total_lessons) || 0, completed_lessons: Number(form.completed_lessons) || 0 });
    setSaving(false);
    setOpen(false);
    load();
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>السلاسل العلمية ({items.length})</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." style={{ ...inputSt, width: "10rem" }} />
          <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة سلسلة</button>
        </div>
      </div>

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["العنوان", "التصنيف", "الشيخ", "التقدم", "الحالة", "إجراءات"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 700, color: C.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{s.title}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{s.category}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{s.sheikhs?.name || "—"}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{s.completed_lessons}/{s.total_lessons}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{STATUSES[s.status] || s.status}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>
                    <button style={BTN_EDIT} onClick={() => openEdit(s)}>تعديل</button>
                    {" "}
                    <button style={BTN_DEL} onClick={() => handleDelete(s.id, s.title)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <AdminModal title={form.id ? "تعديل سلسلة" : "إضافة سلسلة"} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          <Field label="العنوان *"><input style={inputSt} value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <FieldRow>
            <Field label="التصنيف">
              <select style={selectSt} value={form.category || ""} onChange={(e) => set("category", e.target.value)}>
                <option value="">—</option>
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="الشيخ">
              <select style={selectSt} value={form.sheikh_id || ""} onChange={(e) => set("sheikh_id", e.target.value)}>
                <option value="">—</option>
                {sheikhs.map((sh) => <option key={sh.id} value={sh.id}>{sh.name}</option>)}
              </select>
            </Field>
          </FieldRow>
          <Field label="الوصف"><textarea style={textareaSt} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <FieldRow>
            <Field label="إجمالي الدروس"><input style={inputSt} type="number" value={form.total_lessons} onChange={(e) => set("total_lessons", e.target.value)} /></Field>
            <Field label="المكتمل"><input style={inputSt} type="number" value={form.completed_lessons} onChange={(e) => set("completed_lessons", e.target.value)} /></Field>
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
