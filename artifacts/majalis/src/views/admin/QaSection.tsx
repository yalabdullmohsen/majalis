import { useEffect, useState } from "react";
import {
  adminGetQuestions,
  adminUpsertQuestion,
  adminDeleteQuestion,
  adminSetQuestionStatus,
  getQaCategories,
} from "@/lib/supabase";
import {
  QA_RULING_TYPES,
  QA_RULING_CATEGORY_SLUG,
  QA_REVIEW_LABELS,
} from "@/lib/theme";

const RULING_CSS: Record<string, string> = {
  "حلال": "halal", "مباح": "mubah", "سنة": "sunnah",
  "مندوب": "mandub", "مكروه": "makruh", "حرام": "haram",
};
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminModal, Field, FieldRow } from "./AdminModal";
import { BulkImport } from "./BulkImport";

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

export function QaSection() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState(() => { const p = new URLSearchParams(window.location.search); return p.get("q") || ""; });

  const load = () => {
    setLoading(true);
    adminGetQuestions().then(({ data }) => {  setItems(data ?? []); setLoading(false);  }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    getQaCategories().then(({ data }) => setCategories(data ?? [])).catch(() => setCategories([]));
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
      <div className="qa-header">
        <h2 className="qa-title">
          الأسئلة والأجوبة ({items.length})
          <span className="qa-badge qa-badge--published">{publishedCount} منشور</span>
          <span className="qa-badge qa-badge--draft">{draftCount} مسودة</span>
          {reviewCount > 0 && (
            <span className="qa-badge qa-badge--review">{reviewCount} يحتاج مراجعة</span>
          )}
        </h2>
        <div className="qa-actions">
          <BulkImport
            title="استيراد الأسئلة والأجوبة"
            hint="يمكن ربط التصنيف باسمه عبر الحقل category_name (يُطابَق تلقائيًا)."
            template={[{ question: "ما حكم صيام يوم عرفة؟", answer: "صيام يوم عرفة سنة مؤكدة لغير الحاج…", category_name: "أحكام شرعية", ruling_type: "سنة", evidence: "حديث: «صيام يوم عرفة أحتسب على الله…»", reference: "صحيح مسلم", status: "published" }]}
            importRow={(row) => {
              const { category_name, ...rest } = row;
              let category_id = row.category_id || null;
              if (!category_id && category_name) {
                const m = categories.find((c) => c.name === category_name || c.name?.includes(category_name));
                category_id = m?.id || null;
              }
              return adminUpsertQuestion({ review_status: "approved", status: "published", ...rest, category_id });
            }}
            onDone={load}
          />
          <button type="button" onClick={openAdd} className="qa-add-btn">+ إضافة سؤال</button>
        </div>
      </div>

      <div className="qa-filters">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث في السؤال والجواب..."
          className="adm-input qa-search"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="adm-select qa-filter-select">
          <option value="all">كل التصنيفات</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <SkeletonCardGrid count={6} /> : (
        <div className="qa-table-wrap">
          <table className="qa-table">
            <thead>
              <tr className="qa-thead-row">
                {["السؤال", "التصنيف", "نوع الحكم", "الاعتماد", "النشر", "إجراءات"].map((h) => (
                  <th key={h} className="qa-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const rulingCssClass = item.ruling_type ? (RULING_CSS[item.ruling_type] || null) : null;
                const approved = item.review_status === "approved";
                return (
                  <tr key={item.id} className="qa-tr">
                    <td className="qa-td qa-td--question">{item.question}</td>
                    <td className="qa-td qa-td--muted">{item.qa_categories?.name || "—"}</td>
                    <td className="qa-td">
                      {rulingCssClass ? (
                        <span className={`qa-ruling-badge qa-ruling-badge--${rulingCssClass}`}>
                          {item.ruling_type}
                        </span>
                      ) : <span className="qa-ruling-none">—</span>}
                    </td>
                    <td className="qa-td">
                      <span className={`qa-review-badge${approved ? " qa-review-badge--approved" : ""}`}>
                        {QA_REVIEW_LABELS[item.review_status] || item.review_status}
                      </span>
                    </td>
                    <td className="qa-td">
                      <button
                        type="button"
                        onClick={() => toggleStatus(item)}
                        title={item.status === "published" ? "اضغط لإخفائه" : "اضغط لنشره"}
                        className={`qa-publish-btn${item.status === "published" ? " qa-publish-btn--published" : ""}`}
                      >
                        {item.status === "published" ? "منشور" : "مسودة"}
                      </button>
                    </td>
                    <td className="qa-td">
                      <div className="qa-cell-actions">
                        <button type="button" onClick={() => openEdit(item)} className="qa-btn-edit">تعديل</button>
                        <button type="button" onClick={() => handleDelete(item.id, item.question)} className="qa-btn-del">حذف</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="qa-empty">لا توجد أسئلة مطابقة، أضف سؤالًا جديدًا</p>}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل السؤال" : "إضافة سؤال جديد"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="السؤال *">
          <textarea className="adm-textarea qa-textarea--sm" value={form.question} onChange={(e) => set("question", e.target.value)} placeholder="اكتب نص السؤال..." />
        </Field>
        <Field label="الجواب *">
          <textarea className="adm-textarea qa-textarea--lg" value={form.answer} onChange={(e) => set("answer", e.target.value)} placeholder="اكتب الجواب العلمي التفصيلي..." />
        </Field>
        <FieldRow>
          <Field label="التصنيف">
            <select className="adm-select" value={form.category_id || ""} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">اختر التصنيف</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="نوع الحكم">
            <select
              className={`adm-select${!isRuling ? " qa-ruling-select--faded" : ""}`}
              disabled={!isRuling}
              value={form.ruling_type || ""}
              onChange={(e) => set("ruling_type", e.target.value)}
            >
              <option value="">{isRuling ? "اختر نوع الحكم" : "— لأحكام الشرعية فقط"}</option>
              {QA_RULING_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </FieldRow>
        <Field label="الدليل الشرعي">
          <textarea className="adm-textarea qa-textarea--sm" value={form.evidence || ""} onChange={(e) => set("evidence", e.target.value)} placeholder="الآية أو الحديث أو الدليل..." />
        </Field>
        <FieldRow>
          <Field label="المرجع">
            <input className="adm-input" value={form.reference || ""} onChange={(e) => set("reference", e.target.value)} placeholder="اسم الكتاب أو المصدر..." />
          </Field>
          <Field label="درجة الاعتماد">
            <select className="adm-select" value={form.review_status} onChange={(e) => set("review_status", e.target.value)}>
              <option value="needs_review">{QA_REVIEW_LABELS.needs_review}</option>
              <option value="approved">{QA_REVIEW_LABELS.approved}</option>
            </select>
          </Field>
        </FieldRow>
        <Field label="حالة النشر">
          <label className="qa-status-label">
            <input
              type="checkbox"
              className="qa-status-checkbox"
              checked={form.status === "published"}
              onChange={(e) => set("status", e.target.checked ? "published" : "draft")}
            />
            {form.status === "published" ? "منشور (ظاهر للجميع)" : "مسودة (غير ظاهر)"}
          </label>
        </Field>
      </AdminModal>
    </div>
  );
}
