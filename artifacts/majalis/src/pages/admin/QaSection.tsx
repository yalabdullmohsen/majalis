import { useEffect, useState } from "react";
import {
  adminGetQuestions,
  adminUpsertQuestion,
  adminDeleteQuestion,
  adminSetQuestionStatus,
  getQaCategories,
} from "@/lib/supabase";
import {
  C,
  QA_RULING_TYPES,
  QA_RULING_CATEGORY_SLUG,
  QA_RULING_COLORS,
  QA_REVIEW_LABELS,
} from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt, selectSt, textareaSt } from "./AdminModal";

const EMPTY: any = {
  question: "",
  answer: "",
  category_id: "",
  ruling_type: "",
  evidence: "",
  reference: "",
  review_status: "needs_review",
  status: "draft",
};

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

export function QaSection() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    adminGetQuestions().then(({ data }) => { setItems(data); setLoading(false); });
  };
  useEffect(() => {
    load();
    getQaCategories().then(({ data }) => setCategories(data));
  }, []);

  const firstCatId = categories[0]?.id || "";
  const openAdd = () => { setForm({ ...EMPTY, category_id: firstCatId }); setOpen(true); };
  const openEdit = (item: any) => {
    setForm({ ...EMPTY, ...item, category_id: item.category_id || "", ruling_type: item.ruling_type || "" });
    setOpen(true);
  };

  const handleDelete = async (id: string, question: string) => {
    if (!confirm(`هل تريد حذف السؤال "${question.slice(0, 40)}..."؟`)) return;
    const { error } = await adminDeleteQuestion(id);
    if (error) return alert(`تعذّر الحذف: ${error.message}`);
    load();
  };

  const toggleStatus = async (item: any) => {
    const next = item.status === "published" ? "draft" : "published";
    const { error } = await adminSetQuestionStatus(item.id, next);
    if (error) return alert(`تعذّر تغيير حالة النشر: ${error.message}`);
    load();
  };

  const handleSave = async () => {
    if (!form.question.trim()) return alert("نص السؤال مطلوب");
    if (!form.answer.trim()) return alert("نص الجواب مطلوب");
    setSaving(true);
    const { error } = await adminUpsertQuestion(form);
    setSaving(false);
    if (error) return alert(`تعذّر الحفظ: ${error.message}`);
    setOpen(false); load();
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const filtered = items
    .filter((i) => filter === "all" || i.category_id === filter)
    .filter((i) => {
      const s = search.trim();
      if (!s) return true;
      return i.question?.includes(s) || i.answer?.includes(s);
    });

  const publishedCount = items.filter((i) => i.status === "published").length;
  const draftCount = items.length - publishedCount;
  const reviewCount = items.filter((i) => i.review_status === "needs_review").length;

  const selectedCat = categories.find((c) => c.id === form.category_id);
  const isRuling = selectedCat?.slug === QA_RULING_CATEGORY_SLUG;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          الأسئلة والأجوبة ({items.length})
          <span style={{ padding: "0.1rem 0.5rem", borderRadius: "0.75rem", background: C.sage, color: C.emeraldDeep, fontSize: "0.7rem" }}>{publishedCount} منشور</span>
          <span style={{ padding: "0.1rem 0.5rem", borderRadius: "0.75rem", background: C.parchmentDeep, color: C.inkSoft, fontSize: "0.7rem" }}>{draftCount} مسودة</span>
          {reviewCount > 0 && (
            <span style={{ padding: "0.1rem 0.5rem", borderRadius: "0.75rem", background: "#FEF3C7", color: "#92400E", fontSize: "0.7rem" }}>{reviewCount} يحتاج مراجعة</span>
          )}
        </h2>
        <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة سؤال</button>
      </div>

      {/* أدوات الفلترة والبحث */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.25rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث في السؤال والجواب..."
          style={{ ...inputSt, width: "auto", flex: "1 1 220px" }}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...selectSt, width: "auto", flex: "0 1 200px" }}>
          <option value="all">كل التصنيفات</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["السؤال", "التصنيف", "نوع الحكم", "الاعتماد", "النشر", "إجراءات"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", color: C.emeraldDeep, fontWeight: 700, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const rc = item.ruling_type ? (QA_RULING_COLORS[item.ruling_type] || { bg: C.parchmentDeep, text: C.inkSoft }) : null;
                const approved = item.review_status === "approved";
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.ink, fontWeight: 600, maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.question}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>{item.qa_categories?.name || "—"}</td>
                    <td style={{ padding: "0.625rem 0.75rem" }}>
                      {rc ? <span style={{ padding: "0.125rem 0.5rem", borderRadius: "999px", background: rc.bg, color: rc.text, fontSize: "0.7rem", fontWeight: 700 }}>{item.ruling_type}</span> : <span style={{ color: C.inkSoft }}>—</span>}
                    </td>
                    <td style={{ padding: "0.625rem 0.75rem" }}>
                      <span style={{ padding: "0.125rem 0.5rem", borderRadius: "999px", background: approved ? "#D1FAE5" : "#FEF3C7", color: approved ? "#065F46" : "#92400E", fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {QA_REVIEW_LABELS[item.review_status] || item.review_status}
                      </span>
                    </td>
                    <td style={{ padding: "0.625rem 0.75rem" }}>
                      <button
                        onClick={() => toggleStatus(item)}
                        title={item.status === "published" ? "اضغط لإخفائه" : "اضغط لنشره"}
                        style={{ padding: "0.2rem 0.625rem", borderRadius: "999px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap", background: item.status === "published" ? C.emerald : C.parchmentDeep, color: item.status === "published" ? C.parchment : C.inkSoft }}
                      >
                        {item.status === "published" ? "منشور" : "مسودة"}
                      </button>
                    </td>
                    <td style={{ padding: "0.625rem 0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        <button onClick={() => openEdit(item)} style={BTN_EDIT}>تعديل</button>
                        <button onClick={() => handleDelete(item.id, item.question)} style={BTN_DEL}>حذف</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem" }}>لا توجد أسئلة مطابقة — أضف سؤالًا جديدًا</p>}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل السؤال" : "إضافة سؤال جديد"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="السؤال *">
          <textarea style={{ ...textareaSt, minHeight: "3.5rem" }} value={form.question} onChange={(e) => set("question", e.target.value)} placeholder="اكتب نص السؤال..." />
        </Field>
        <Field label="الجواب *">
          <textarea style={{ ...textareaSt, minHeight: "8rem" }} value={form.answer} onChange={(e) => set("answer", e.target.value)} placeholder="اكتب الجواب العلمي التفصيلي..." />
        </Field>
        <FieldRow>
          <Field label="التصنيف">
            <select style={selectSt} value={form.category_id || ""} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">اختر التصنيف</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="نوع الحكم">
            <select style={{ ...selectSt, opacity: isRuling ? 1 : 0.5 }} disabled={!isRuling} value={form.ruling_type || ""} onChange={(e) => set("ruling_type", e.target.value)}>
              <option value="">{isRuling ? "اختر نوع الحكم" : "— لأحكام الشرعية فقط"}</option>
              {QA_RULING_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </FieldRow>
        <Field label="الدليل الشرعي">
          <textarea style={{ ...textareaSt, minHeight: "3.5rem" }} value={form.evidence || ""} onChange={(e) => set("evidence", e.target.value)} placeholder="الآية أو الحديث أو الدليل..." />
        </Field>
        <FieldRow>
          <Field label="المرجع">
            <input style={inputSt} value={form.reference || ""} onChange={(e) => set("reference", e.target.value)} placeholder="اسم الكتاب أو المصدر..." />
          </Field>
          <Field label="درجة الاعتماد">
            <select style={selectSt} value={form.review_status} onChange={(e) => set("review_status", e.target.value)}>
              <option value="needs_review">{QA_REVIEW_LABELS.needs_review}</option>
              <option value="approved">{QA_REVIEW_LABELS.approved}</option>
            </select>
          </Field>
        </FieldRow>
        <Field label="حالة النشر">
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: C.ink }}>
            <input type="checkbox" checked={form.status === "published"} onChange={(e) => set("status", e.target.checked ? "published" : "draft")} style={{ width: "1rem", height: "1rem", cursor: "pointer" }} />
            {form.status === "published" ? "منشور (ظاهر للجميع)" : "مسودة (غير ظاهر)"}
          </label>
        </Field>
      </AdminModal>
    </div>
  );
}
