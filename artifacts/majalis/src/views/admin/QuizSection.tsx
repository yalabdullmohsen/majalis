import { useEffect, useState, useCallback } from "react";
import { Lightbulb } from "lucide-react";
import {
  adminGetQuizQuestions,
  adminUpsertQuizQuestion,
  adminDeleteQuizQuestion,
  adminSetQuizQuestionStatus,
  upsertQuizSeedToDb,
  adminResetAllQuizIsUsed,
  resetAllUsedQuizIds,
} from "@/lib/supabase";
import { sanitizeText } from "@/lib/sanitize";
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminModal, Field, FieldRow } from "./AdminModal";
import { useAdminShell } from "./AdminShell";

const SECTIONS = [
  "القرآن الكريم",
  "علوم القرآن",
  "التفسير",
  "الحديث الشريف",
  "السنة النبوية",
  "السيرة النبوية",
  "الأنبياء",
  "الفقه الإسلامي",
  "الأحكام",
  "أصول الفقه",
  "العقيدة",
  "التاريخ الإسلامي",
  "الأخلاق",
  "الصحابة",
];

const LEVELS: { value: string; label: string }[] = [
  { value: "beginner", label: "سهل (200 نقطة)" },
  { value: "intermediate", label: "متوسط (400 نقطة)" },
  { value: "advanced", label: "صعب (600 نقطة)" },
];

const STATUS_LABELS: Record<string, string> = {
  published: "منشور",
  draft: "مسودة",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "سهل",
  intermediate: "متوسط",
  advanced: "صعب",
};

const EMPTY_FORM = {
  section: SECTIONS[0],
  category: "",
  level: "intermediate",
  question: "",
  answer: "",
  hint: "",
  status: "published",
};

export function QuizSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => { const p = new URLSearchParams(window.location.search); return p.get("q") || ""; });
  const [sectionFilter, setSectionFilter] = useState("الكل");
  const [levelFilter, setLevelFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminGetQuizQuestions()
      .then(({ data }) => setItems(data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setOpen(true); };
  const openEdit = (item: any) => { setForm({ ...EMPTY_FORM, ...item }); setOpen(true); };

  const handleDelete = async (id: string, question: string) => {
    if (!confirm(`هل تريد حذف السؤال؟\n"${question.slice(0, 60)}..."`)) return;
    const { error } = await adminDeleteQuizQuestion(id);
    if (error) showError("فشل الحذف");
    else { showSuccess("تم حذف السؤال"); load(); }
  };

  const handleToggleStatus = async (item: any) => {
    const next = item.status === "published" ? "draft" : "published";
    const { error } = await adminSetQuizQuestionStatus(item.id, next);
    if (error) showError("فشل تغيير الحالة");
    else load();
  };

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.question.trim()) return alert("نص السؤال مطلوب");
    if (!form.answer.trim()) return alert("الجواب مطلوب");
    setSaving(true);
    const answerClean = sanitizeText(form.answer, 1000);
    const payload = {
      ...form,
      question: sanitizeText(form.question, 1000),
      answer: answerClean,
      correct_answer: answerClean,
      hint: sanitizeText(form.hint || "", 500),
      category: sanitizeText(form.category || form.section, 200),
      is_used: false,
    };
    const { error } = await adminUpsertQuizQuestion(payload);
    setSaving(false);
    if (error) showError("فشل الحفظ");
    else { showSuccess("تم الحفظ"); setOpen(false); load(); }
  };

  const handleSyncSeed = async () => {
    if (!confirm("سيتم رفع أسئلة الكتالوج الداخلي (55 سؤال) إلى قاعدة البيانات. متابعة؟")) return;
    setSyncing(true);
    const { ok, synced, error } = await upsertQuizSeedToDb();
    setSyncing(false);
    if (ok) { showSuccess(`تمت المزامنة — ${synced} سؤال`); load(); }
    else showError(`فشل: ${error || "خطأ غير معروف"}`);
  };

  const handleResetUsed = async () => {
    if (!confirm("سيتم إعادة تعيين جميع الأسئلة (is_used=false) وحذف سجل الاستخدام المحلي. متابعة؟")) return;
    setResetting(true);
    const { ok, error } = await adminResetAllQuizIsUsed();
    setResetting(false);
    if (ok) { showSuccess("تم إعادة التعيين — يمكن للجميع استخدام الأسئلة مجدداً"); load(); }
    else { showError(`فشل: ${error || "خطأ غير معروف"}`); resetAllUsedQuizIds(); }
  };

  const filtered = items.filter((item) => {
    if (sectionFilter !== "الكل" && item.section !== sectionFilter) return false;
    if (levelFilter !== "الكل" && item.level !== levelFilter) return false;
    if (statusFilter !== "الكل" && item.status !== statusFilter) return false;
    const q = search.trim();
    if (!q) return true;
    const answerText = item.answer || item.correct_answer || "";
    return `${item.question} ${answerText} ${item.section || item.category || ""}`.includes(q);
  });

  const usedCount = items.filter((i) => i.is_used).length;
  const publishedCount = items.filter((i) => i.status === "published").length;
  const uniqueSections = ["الكل", ...Array.from(new Set(items.map((i) => i.section).filter(Boolean)))];

  return (
    <div>
      <div className="qzs-header">
        <h2 className="qzs-title">أسئلة المسابقة ({items.length})</h2>
        <div className="qzs-btn-group">
          <button type="button" className="qzs-btn qzs-btn--warn" onClick={handleResetUsed} disabled={resetting}>
            {resetting ? "جاري الإعادة..." : "إعادة تعيين المُستخدَمة"}
          </button>
          <button type="button" className="qzs-btn qzs-btn--warn" onClick={handleSyncSeed} disabled={syncing}>
            {syncing ? "جاري الرفع..." : "رفع Seed → DB"}
          </button>
          <button type="button" className="qzs-btn qzs-btn--primary" onClick={openAdd}>+ سؤال جديد</button>
        </div>
      </div>

      <div className="qzs-stats-row">
        {[
          { label: "إجمالي", value: items.length, color: "var(--majalis-emerald-deep)" },
          { label: "منشور",    value: publishedCount,              mod: "qzs-stat--published" },
          { label: "مُستخدَم", value: usedCount,                    mod: "qzs-stat--used" },
          { label: "متاح",     value: publishedCount - usedCount,  mod: "qzs-stat--available" },
        ].map((s) => (
          <div key={s.label} className={`qzs-stat ${s.mod}`}>
            <div className="qzs-stat__value">{s.value}</div>
            <div className="qzs-stat__label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="qzs-filters">
        <input
          className="adm-input qzs-filter-input"
          placeholder="بحث في الأسئلة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="adm-select qzs-filter-select" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
          {uniqueSections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="adm-select qzs-filter-select--sm" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="الكل">كل المستويات</option>
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <select className="adm-select qzs-filter-select--xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="الكل">كل الحالات</option>
          <option value="published">منشور</option>
          <option value="draft">مسودة</option>
        </select>
      </div>

      {loading ? (
        <SkeletonCardGrid count={6} />
      ) : filtered.length === 0 ? (
        <div className="qzs-empty">
          {items.length === 0
            ? <>لا توجد أسئلة في قاعدة البيانات. اضغط <strong>رفع Seed → DB</strong> لرفع الأسئلة الأساسية.</>
            : "لا توجد نتائج مطابقة للفلتر."}
        </div>
      ) : (
        <div className="qzs-list">
          {filtered.map((item) => {
            return (
              <div key={item.id} className={`qzs-item${item.is_used ? " qzs-item--used" : ""}`}>
                <div className="qzs-item-body">
                  <div className="qzs-item-tags">
                    <span className={`qzs-tag qzs-tag--${item.level}`}>
                      {LEVEL_LABELS[item.level] || item.level}
                    </span>
                    <span className={`qzs-tag qzs-tag--${item.status}`}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                    {item.is_used && <span className="qzs-tag qzs-tag--used">مُستخدَم</span>}
                    <span className="qzs-tag--section">{item.section}</span>
                  </div>
                  <div className="qzs-item-question">{item.question}</div>
                  <div className="qzs-item-answer">
                    <strong>الجواب:</strong> {item.answer || item.correct_answer}
                  </div>
                  {item.hint && <div className="qzs-item-hint"><Lightbulb size={13} className="inline ml-1" />{item.hint}</div>}
                </div>
                <div className="qzs-item-actions">
                  <button type="button" className="qzs-btn" onClick={() => openEdit(item)}>تعديل</button>
                  <button type="button" className="qzs-btn" onClick={() => handleToggleStatus(item)}>
                    {item.status === "published" ? "إخفاء" : "نشر"}
                  </button>
                  <button type="button" className="qzs-btn qzs-btn--danger" onClick={() => handleDelete(item.id, item.question)}>حذف</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل السؤال" : "سؤال جديد"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="القسم / الموضوع">
          <select className="adm-select" value={form.section} onChange={(e) => set("section", e.target.value)}>
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <FieldRow>
          <Field label="المستوى">
            <select className="adm-select" value={form.level} onChange={(e) => set("level", e.target.value)}>
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </Field>
          <Field label="الحالة">
            <select className="adm-select" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
            </select>
          </Field>
        </FieldRow>
        <Field label="نص السؤال">
          <textarea className="adm-textarea" value={form.question} onChange={(e) => set("question", e.target.value)} placeholder="اكتب السؤال هنا..." rows={3} />
        </Field>
        <Field label="الجواب">
          <textarea className="adm-textarea" value={form.answer} onChange={(e) => set("answer", e.target.value)} placeholder="الجواب الصحيح..." rows={2} />
        </Field>
        <Field label="تلميح (اختياري)">
          <input className="adm-input" value={form.hint || ""} onChange={(e) => set("hint", e.target.value)} placeholder="تلميح يساعد الفريق..." />
        </Field>
      </AdminModal>
    </div>
  );
}
