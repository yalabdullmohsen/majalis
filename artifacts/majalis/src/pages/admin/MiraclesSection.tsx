import { useEffect, useState } from "react";
import { adminGetMiracles, adminUpsertMiracle, adminDeleteMiracle, getSupabaseErrorMessage } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading, ErrorMessage } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt, selectSt, textareaSt } from "./AdminModal";
import { BulkImport } from "./BulkImport";

const CATEGORIES = ["فلك", "طب", "جيولوجيا", "أحياء", "كيمياء", "فيزياء", "أخرى"];
const SOURCE_TYPES = ["قرآن", "سنة"];
const STATUSES: Record<string, string> = { approved: "معتمد", pending: "معلّق", rejected: "مرفوض" };
const EMPTY: any = { title: "", category: "", source_type: "", reference: "", body: "", media_url: "", scholarly_source: "", status: "approved" };

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

export function MiraclesSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    adminGetMiracles().then(({ data, error }) => {
      if (error) setError(getSupabaseErrorMessage(error, "تعذّر تحميل مقالات الإعجاز."));
      setItems(data);
      setLoading(false);
    }).catch((err) => {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل مقالات الإعجاز."));
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (item: any) => { setForm({ ...EMPTY, ...item }); setOpen(true); };
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل تريد حذف "${title}"؟`)) return;
    const { error } = await adminDeleteMiracle(id);
    if (error) {
      setError(getSupabaseErrorMessage(error, "تعذّر حذف مقال الإعجاز."));
      return;
    }
    load();
  };
  const handleSave = async () => {
    if (!form.title.trim()) return alert("العنوان مطلوب");
    setSaving(true);
    const { error } = await adminUpsertMiracle(form);
    setSaving(false);
    if (error) {
      setError(getSupabaseErrorMessage(error, "تعذّر حفظ مقال الإعجاز."));
      return;
    }
    setOpen(false); load();
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>الإعجاز العلمي ({items.length})</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <BulkImport
            title="استيراد مقالات الإعجاز العلمي"
            template={[{ title: "خلق الإنسان في القرآن", category: "طب", source_type: "قرآن", reference: "﴿وَلَقَدْ خَلَقْنَا الْإِنْسَانَ مِن سُلَالَةٍ مِّن طِينٍ﴾", body: "نص المقال العلمي التفصيلي…", scholarly_source: "اسم الدراسة العلمية", status: "approved" }]}
            importRow={(row) => adminUpsertMiracle({ status: "approved", ...row })}
            onDone={load}
          />
          <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة مقال</button>
        </div>
      </div>

      {error && <ErrorMessage text={error} onRetry={load} />}

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["العنوان", "الفئة", "المصدر", "المرجع", "الحالة", "إجراءات"].map(h => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", color: C.emeraldDeep, fontWeight: 700, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem 0.75rem", color: C.ink, fontWeight: 600, maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</td>
                  <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft }}>{item.category || "—"}</td>
                  <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft }}>{item.source_type || "—"}</td>
                  <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.reference || "—"}</td>
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
          {items.length === 0 && <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem" }}>لا توجد مقالات — ابدأ بإضافة أول مقال</p>}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل المقال" : "إضافة مقال إعجاز علمي"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="العنوان *">
          <input style={inputSt} value={form.title} onChange={e => set("title", e.target.value)} placeholder="عنوان مقال الإعجاز العلمي" />
        </Field>
        <FieldRow>
          <Field label="الفئة العلمية">
            <select style={selectSt} value={form.category || ""} onChange={e => set("category", e.target.value)}>
              <option value="">اختر الفئة</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="نوع المصدر">
            <select style={selectSt} value={form.source_type || ""} onChange={e => set("source_type", e.target.value)}>
              <option value="">اختر المصدر</option>
              {SOURCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </FieldRow>
        <Field label="الآية أو الحديث (المرجع الشرعي)">
          <textarea style={{ ...textareaSt, minHeight: "3rem" }} value={form.reference || ""} onChange={e => set("reference", e.target.value)} placeholder="النص القرآني الكريم أو الحديث النبوي الشريف..." />
        </Field>
        <Field label="محتوى المقال">
          <textarea style={{ ...textareaSt, minHeight: "9rem" }} value={form.body || ""} onChange={e => set("body", e.target.value)} placeholder="اكتب محتوى المقال العلمي التفصيلي هنا..." />
        </Field>
        <Field label="المرجع العلمي الموثّق">
          <input style={inputSt} value={form.scholarly_source || ""} onChange={e => set("scholarly_source", e.target.value)} placeholder="اسم المصدر أو الدراسة العلمية..." />
        </Field>
        <Field label="رابط الوسائط (فيديو / إنفوجرافيك)">
          <input style={inputSt} value={form.media_url || ""} onChange={e => set("media_url", e.target.value)} placeholder="https://..." />
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
