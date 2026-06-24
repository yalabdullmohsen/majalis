import { useEffect, useState } from "react";
import {
  adminGetQuizQuestions,
  adminUpsertQuizQuestion,
  adminDeleteQuizQuestion,
  adminSetQuizQuestionStatus,
} from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt, selectSt, textareaSt } from "./AdminModal";
import { BulkImport } from "./BulkImport";

const LEVELS = ["سهل", "متوسط", "صعب"];
const EMPTY: any = {
  section: "",
  category: "",
  level: "متوسط",
  question: "",
  answer: "",
  status: "published",
};

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

export function QuizSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterSection, setFilterSection] = useState("all");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    adminGetQuizQuestions().then(({ data }) => { setItems(data); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const sections = [...new Set(items.map((i) => i.section).filter(Boolean))];

  const openAdd = () => { setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (item: any) => { setForm({ ...EMPTY, ...item }); setOpen(true); };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleDelete = async (id: string, question: string) => {
    if (!confirm(`حذف السؤال "${question.slice(0, 40)}..."؟`)) return;
    const { error } = await adminDeleteQuizQuestion(id);
    if (error) return alert(`تعذّر الحذف: ${error.message}`);
    load();
  };

  const toggleStatus = async (item: any) => {
    const next = item.status === "published" ? "draft" : "published";
    const { error } = await adminSetQuizQuestionStatus(item.id, next);
    if (error) return alert(`تعذّر تغيير الحالة: ${error.message}`);
    load();
  };

  const handleSave = async () => {
    if (!form.section.trim() || !form.category.trim()) return alert("القسم والتصنيف مطلوبان");
    if (!form.question.trim() || !form.answer.trim()) return alert("السؤال والجواب مطلوبان");
    setSaving(true);
    const { error } = await adminUpsertQuizQuestion(form);
    setSaving(false);
    if (error) return alert(`تعذّر الحفظ: ${error.message}`);
    setOpen(false);
    load();
  };

  const filtered = items
    .filter((i) => filterSection === "all" || i.section === filterSection)
    .filter((i) => {
      const s = search.trim();
      if (!s) return true;
      return i.question?.includes(s) || i.answer?.includes(s) || i.category?.includes(s);
    });

  const publishedCount = items.filter((i) => i.status === "published").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          المسابقات ({items.length})
          <span style={{ padding: "0.1rem 0.5rem", borderRadius: "0.75rem", background: C.sage, color: C.emeraldDeep, fontSize: "0.7rem" }}>{publishedCount} منشور</span>
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <BulkImport
            title="استيراد أسئلة المسابقة"
            hint="الصق مصفوفة JSON. الحقول: section, category, level, question, answer, status"
            template={[{
              section: "الأنبياء",
              category: "الرسل",
              level: "متوسط",
              question: "من أول الرسل إلى أهل الأرض بعد آدم؟",
              answer: "نوح عليه السلام",
              status: "published",
            }]}
            importRow={(row) => adminUpsertQuizQuestion({ status: "published", level: "متوسط", ...row })}
            onDone={load}
          />
          <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة سؤال</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.25rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث..."
          style={{ ...inputSt, width: "auto", flex: "1 1 220px" }}
        />
        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} style={{ ...selectSt, width: "auto", flex: "0 1 200px" }}>
          <option value="all">كل الأقسام</option>
          {sections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {filtered.map((item) => (
            <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", color: C.emeraldDeep, background: C.sage, padding: "0.1rem 0.5rem", borderRadius: "999px" }}>
                  {item.section} · {item.category} · {item.level}
                </span>
                <span style={{ fontSize: "0.75rem", color: item.status === "published" ? C.emeraldDeep : C.inkSoft }}>
                  {item.status === "published" ? "منشور" : "مسودة"}
                </span>
              </div>
              <p style={{ margin: "0 0 0.35rem", fontWeight: 700, color: C.ink }}>{item.question}</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: C.inkSoft }}>الجواب: {item.answer}</p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                <button type="button" onClick={() => openEdit(item)} style={BTN_EDIT}>تعديل</button>
                <button type="button" onClick={() => toggleStatus(item)} style={BTN_EDIT}>
                  {item.status === "published" ? "إخفاء" : "نشر"}
                </button>
                <button type="button" onClick={() => handleDelete(item.id, item.question)} style={BTN_DEL}>حذف</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ color: C.inkSoft, textAlign: "center" }}>لا توجد أسئلة.</p>}
        </div>
      )}

      <AdminModal open={open} onClose={() => setOpen(false)} title={form.id ? "تعديل سؤال" : "إضافة سؤال"} onSave={handleSave} saving={saving}>
        <FieldRow>
          <Field label="القسم">
            <input value={form.section} onChange={(e) => set("section", e.target.value)} style={inputSt} placeholder="الأنبياء" />
          </Field>
          <Field label="التصنيف">
            <input value={form.category} onChange={(e) => set("category", e.target.value)} style={inputSt} placeholder="الرسل" />
          </Field>
        </FieldRow>
        <Field label="المستوى">
          <select value={form.level} onChange={(e) => set("level", e.target.value)} style={selectSt}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="السؤال">
          <textarea value={form.question} onChange={(e) => set("question", e.target.value)} rows={3} style={textareaSt} />
        </Field>
        <Field label="الجواب">
          <input value={form.answer} onChange={(e) => set("answer", e.target.value)} style={inputSt} />
        </Field>
        <Field label="الحالة">
          <select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectSt}>
            <option value="published">منشور</option>
            <option value="draft">مسودة</option>
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
