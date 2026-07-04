import { useEffect, useState, useCallback } from "react";
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
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt, selectSt, textareaSt } from "./AdminModal";
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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  published: { bg: "#D1FAE5", text: C.emeraldDeep },
  draft: { bg: "#F3F4F6", text: "#6B7280" },
};

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: "#D1FAE5", text: "#065F46" },
  intermediate: { bg: "#FEF3C7", text: "#92400E" },
  advanced:     { bg: "#FEE2E2", text: "#991B1B" },
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

const BTN: React.CSSProperties = {
  padding: "0.4rem 0.875rem",
  borderRadius: "0.375rem",
  border: `1px solid ${C.line}`,
  background: C.panel,
  color: C.emeraldDeep,
  cursor: "pointer",
  fontSize: "0.8125rem",
  fontFamily: "inherit",
  fontWeight: 600,
};
const BTN_PRIMARY: React.CSSProperties = {
  ...BTN,
  background: C.emerald,
  color: "#fff",
  border: "none",
};
const BTN_DANGER: React.CSSProperties = { ...BTN, color: "#dc2626" };
const BTN_WARN: React.CSSProperties = { ...BTN, background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" };

export function QuizSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
      correct_answer: answerClean, // keep legacy column in sync
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
    // support both new (answer) and legacy (correct_answer) column names
    const answerText = item.answer || item.correct_answer || "";
    return `${item.question} ${answerText} ${item.section || item.category || ""}`.includes(q);
  });

  const usedCount = items.filter((i) => i.is_used).length;
  const publishedCount = items.filter((i) => i.status === "published").length;

  const uniqueSections = ["الكل", ...Array.from(new Set(items.map((i) => i.section).filter(Boolean)))];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>
          أسئلة المسابقة ({items.length})
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button style={BTN_WARN} onClick={handleResetUsed} disabled={resetting}>
            {resetting ? "جاري الإعادة..." : "إعادة تعيين المُستخدَمة"}
          </button>
          <button style={BTN_WARN} onClick={handleSyncSeed} disabled={syncing}>
            {syncing ? "جاري الرفع..." : "رفع Seed → DB"}
          </button>
          <button style={BTN_PRIMARY} onClick={openAdd}>+ سؤال جديد</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {[
          { label: "إجمالي", value: items.length, color: C.emeraldDeep },
          { label: "منشور", value: publishedCount, color: C.emeraldDeep },
          { label: "مُستخدَم", value: usedCount, color: "#dc2626" },
          { label: "متاح", value: publishedCount - usedCount, color: "#059669" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "0.625rem 1rem", background: C.panel, borderRadius: "0.375rem", border: `1px solid ${C.line}`, textAlign: "center", minWidth: "80px" }}>
            <div style={{ fontSize: "1.375rem", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.6875rem", color: C.inkSoft }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...inputSt, maxWidth: "220px" }}
          placeholder="بحث في الأسئلة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={{ ...selectSt, maxWidth: "160px" }} value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
          {uniqueSections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={{ ...selectSt, maxWidth: "150px" }} value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="الكل">كل المستويات</option>
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <select style={{ ...selectSt, maxWidth: "130px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="الكل">كل الحالات</option>
          <option value="published">منشور</option>
          <option value="draft">مسودة</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div style={{ padding: "2.5rem", textAlign: "center", color: C.inkSoft, background: C.panel, borderRadius: "0.5rem", border: `1px solid ${C.line}` }}>
          {items.length === 0
            ? <>لا توجد أسئلة في قاعدة البيانات. اضغط <strong>رفع Seed → DB</strong> لرفع الأسئلة الأساسية.</>
            : "لا توجد نتائج مطابقة للفلتر."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map((item) => {
            const lvl = LEVEL_COLORS[item.level] || { bg: C.panel, text: C.ink };
            const st = STATUS_COLORS[item.status] || { bg: C.panel, text: C.ink };
            return (
              <div
                key={item.id}
                style={{ padding: "0.875rem 1rem", background: item.is_used ? "#FFF8F0" : C.panel, border: `1px solid ${item.is_used ? "#FDE68A" : C.line}`, borderRadius: "0.375rem", display: "flex", gap: "0.875rem", alignItems: "flex-start" }}
              >
                {/* Question body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "99px", background: lvl.bg, color: lvl.text, fontWeight: 700 }}>
                      {LEVEL_LABELS[item.level] || item.level}
                    </span>
                    <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "99px", background: st.bg, color: st.text, fontWeight: 600 }}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                    {item.is_used && (
                      <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "99px", background: "#FEF3C7", color: "#92400E" }}>مُستخدَم</span>
                    )}
                    <span style={{ fontSize: "0.7rem", color: C.inkSoft }}>{item.section}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.25rem", color: C.ink }}>{item.question}</div>
                  <div style={{ fontSize: "0.8125rem", color: C.inkSoft }}>
                    <strong style={{ color: C.emeraldDeep }}>الجواب:</strong> {item.answer || item.correct_answer}
                  </div>
                  {item.hint && (
                    <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.25rem" }}>💡 {item.hint}</div>
                  )}
                </div>
                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", flexShrink: 0 }}>
                  <button style={BTN} onClick={() => openEdit(item)}>تعديل</button>
                  <button style={BTN} onClick={() => handleToggleStatus(item)}>
                    {item.status === "published" ? "إخفاء" : "نشر"}
                  </button>
                  <button style={BTN_DANGER} onClick={() => handleDelete(item.id, item.question)}>حذف</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AdminModal title={form.id ? "تعديل السؤال" : "سؤال جديد"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="القسم / الموضوع">
          <select style={selectSt} value={form.section} onChange={(e) => set("section", e.target.value)}>
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <FieldRow>
          <Field label="المستوى">
            <select style={selectSt} value={form.level} onChange={(e) => set("level", e.target.value)}>
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </Field>
          <Field label="الحالة">
            <select style={selectSt} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
            </select>
          </Field>
        </FieldRow>
        <Field label="نص السؤال">
          <textarea style={textareaSt} value={form.question} onChange={(e) => set("question", e.target.value)} placeholder="اكتب السؤال هنا..." rows={3} />
        </Field>
        <Field label="الجواب">
          <textarea style={textareaSt} value={form.answer} onChange={(e) => set("answer", e.target.value)} placeholder="الجواب الصحيح..." rows={2} />
        </Field>
        <Field label="تلميح (اختياري)">
          <input style={inputSt} value={form.hint || ""} onChange={(e) => set("hint", e.target.value)} placeholder="تلميح يساعد الفريق..." />
        </Field>
      </AdminModal>
    </div>
  );
}
