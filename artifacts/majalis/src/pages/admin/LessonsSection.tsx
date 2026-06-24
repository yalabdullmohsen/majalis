import { useEffect, useState } from "react";
import { adminGetLessons, adminUpsertLesson, adminDeleteLesson, adminGetSheikhs } from "@/lib/supabase";
import { C, GOVERNORATES } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt, selectSt, textareaSt } from "./AdminModal";
import { BulkImport } from "./BulkImport";

const CATEGORIES = ["تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "أخرى"];
const AUDIENCE = ["الكل", "رجال", "نساء", "أطفال"];
const DELIVERY = ["حضور فقط", "بث مباشر", "كلاهما"];
const STATUSES: Record<string, string> = { approved: "معتمد", pending: "معلّق", rejected: "مرفوض" };
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "#D1FAE5", text: C.emeraldDeep },
  pending:  { bg: "#FEF3C7", text: "#92400E" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
};
const EMPTY: any = { title: "", sheikh_id: "", mosque: "", city: "", category: "", audience: "الكل", delivery: "حضور فقط", schedule: "", lesson_time: "", description: "", status: "approved" };

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

export function LessonsSection() {
  const [items, setItems] = useState<any[]>([]);
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([adminGetLessons(), adminGetSheikhs()]).then(([{ data: l }, { data: s }]) => {
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
    if (!confirm(`هل تريد حذف الدرس "${title}"؟`)) return;
    await adminDeleteLesson(id); load();
  };
  const handleSave = async () => {
    if (!form.title.trim()) return alert("عنوان الدرس مطلوب");
    setSaving(true);
    await adminUpsertLesson({ ...form, sheikh_id: form.sheikh_id || null });
    setSaving(false); setOpen(false); load();
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>الدروس ({items.length})</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <BulkImport
            title="استيراد الدروس"
            hint="يمكن ربط الشيخ باسمه عبر الحقل sheikh_name (يُطابَق تلقائيًا)."
            template={[{ title: "شرح كتاب التوحيد", sheikh_name: "الشيخ عبدالله الأنصاري", category: "عقيدة", city: "العاصمة", mosque: "مسجد الدعوة", audience: "الكل", delivery: "حضور فقط", schedule: "كل اثنين بعد العشاء", status: "approved" }]}
            importRow={(row) => {
              const { sheikh_name, ...rest } = row;
              let sheikh_id = row.sheikh_id || null;
              if (!sheikh_id && sheikh_name) {
                const m = sheikhs.find((s) => s.name === sheikh_name || s.name?.includes(sheikh_name));
                sheikh_id = m?.id || null;
              }
              return adminUpsertLesson({ audience: "الكل", delivery: "حضور فقط", status: "approved", ...rest, sheikh_id });
            }}
            onDone={load}
          />
          <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة درس</button>
        </div>
      </div>

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["العنوان", "الشيخ", "التصنيف", "المحافظة", "الحضور", "الحالة", "إجراءات"].map(h => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", color: C.emeraldDeep, fontWeight: 700, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const sc = STATUS_COLORS[item.status] || { bg: C.parchmentDeep, text: C.inkSoft };
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.ink, fontWeight: 600, maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>{item.sheikhs?.name || "—"}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft }}>{item.category || "—"}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft }}>{item.city || "—"}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>{item.delivery || "—"}</td>
                    <td style={{ padding: "0.625rem 0.75rem" }}>
                      <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: sc.bg, color: sc.text, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
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
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem" }}>لا توجد دروس — ابدأ بإضافة أول درس</p>}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل الدرس" : "إضافة درس جديد"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="عنوان الدرس *">
          <input style={inputSt} value={form.title} onChange={e => set("title", e.target.value)} placeholder="عنوان الدرس أو الدورة" />
        </Field>
        <Field label="الشيخ">
          <select style={selectSt} value={form.sheikh_id || ""} onChange={e => set("sheikh_id", e.target.value)}>
            <option value="">اختر الشيخ (اختياري)</option>
            {sheikhs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <FieldRow>
          <Field label="التصنيف">
            <select style={selectSt} value={form.category || ""} onChange={e => set("category", e.target.value)}>
              <option value="">اختر التصنيف</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="المحافظة">
            <select style={selectSt} value={form.city || ""} onChange={e => set("city", e.target.value)}>
              <option value="">اختر المحافظة</option>
              {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </FieldRow>
        <Field label="المسجد / المكان">
          <input style={inputSt} value={form.mosque || ""} onChange={e => set("mosque", e.target.value)} placeholder="اسم المسجد أو المركز" />
        </Field>
        <FieldRow>
          <Field label="الجمهور المستهدف">
            <select style={selectSt} value={form.audience} onChange={e => set("audience", e.target.value)}>
              {AUDIENCE.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="طريقة الحضور">
            <select style={selectSt} value={form.delivery} onChange={e => set("delivery", e.target.value)}>
              {DELIVERY.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="الجدول الزمني">
            <input style={inputSt} value={form.schedule || ""} onChange={e => set("schedule", e.target.value)} placeholder="كل اثنين بعد العشاء" />
          </Field>
          <Field label="وقت الدرس">
            <input style={inputSt} value={form.lesson_time || ""} onChange={e => set("lesson_time", e.target.value)} placeholder="8:30 م" />
          </Field>
        </FieldRow>
        <Field label="الوصف">
          <textarea style={textareaSt} value={form.description || ""} onChange={e => set("description", e.target.value)} placeholder="وصف موجز للدرس أو الدورة..." />
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
