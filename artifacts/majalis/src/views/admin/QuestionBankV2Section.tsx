import { useMemo, useState } from "react";
import { AdminModal } from "@/views/admin/AdminModal";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  getAllQuestionBankItems,
  getQuestionBankV2Report,
} from "@/lib/sin-jeem/questions-bank";
import {
  MAIN_CATEGORIES,
  resolveMainCategory,
} from "@/lib/question-bank-v2/categories";
import {
  validateQuestionStructure,
  canAdvanceWorkflow,
} from "@/lib/question-bank-v2/validation";
import { findDuplicate, contentHash } from "@/lib/question-bank-v2/dedup";
import type { CSSProperties } from "react";
import type { QuestionBankItem, WorkflowStage } from "@/lib/question-bank-v2/types";
import { WORKFLOW_STAGES, DIFFICULTIES } from "@/lib/question-bank-v2/types";

const STAGE_LABELS: Record<WorkflowStage, string> = {
  author: "كاتب السؤال",
  linguistic_review: "مراجع لغوي",
  sharia_review: "مراجع شرعي",
  final_approval: "اعتماد نهائي",
  published: "منشور",
};

const emptyForm = (): Partial<QuestionBankItem> => ({
  question: "",
  options: ["", "", "", ""],
  correct_index: 0,
  explanation: "",
  source: "",
  reference: "",
  evidence: "",
  book_name: "",
  chapter: "",
  difficulty: "متوسط",
  category_slug: "quran",
  keywords: [],
  language: "ar",
  status: "draft",
  workflow_stage: "author",
});

function completionScore(q: QuestionBankItem): number {
  const fields = [
    q.question,
    q.options?.every(Boolean),
    q.explanation,
    q.source,
    q.reference || q.source,
    q.category_slug,
    q.difficulty,
    q.content_hash,
    q.evidence,
    q.book_name,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function parseCsv(text: string): Partial<QuestionBankItem>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
  const idx = (n: string) => header.indexOf(n);
  return lines.slice(1).map((line) => {
    const cols = line.match(/("([^"]|"")*"|[^,]*)/g)?.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) || [];
    const opts = (cols[idx("options")] || "").split("|").filter(Boolean);
    return {
      question: cols[idx("question")] || "",
      options: (opts.length === 4 ? opts : ["", "", "", ""]) as [string, string, string, string],
      correct_index: Number(cols[idx("correct_index")] || 0) as 0 | 1 | 2 | 3,
      category_slug: cols[idx("category_slug")] || "quran",
      difficulty: (cols[idx("difficulty")] || "متوسط") as QuestionBankItem["difficulty"],
      source: cols[idx("source")] || "",
      explanation: cols[idx("explanation")] || "",
      evidence: cols[idx("evidence")] || "",
      reference: cols[idx("reference")] || "",
      book_name: cols[idx("book_name")] || "",
      chapter: cols[idx("chapter")] || "",
    };
  }).filter((q) => q.question);
}

export function QuestionBankV2Section() {
  const [items, setItems] = useState<QuestionBankItem[]>(() => getAllQuestionBankItems());
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [filter, setFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [msg, setMsg] = useState("");

  const report = useMemo(() => getQuestionBankV2Report(), [items]);

  const filtered = useMemo(() => items.filter((q) => {
    if (filter && !q.question.includes(filter) && !q.id.includes(filter)) return false;
    if (stageFilter && q.workflow_stage !== stageFilter) return false;
    if (categoryFilter && resolveMainCategory(q.category_slug) !== categoryFilter) return false;
    return true;
  }), [items, filter, stageFilter, categoryFilter]);

  const coverage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of items) {
      const main = resolveMainCategory(q.category_slug);
      map[main] = (map[main] || 0) + 1;
    }
    return map;
  }, [items]);

  const runQualityAudit = (q: Partial<QuestionBankItem>): string[] => {
    const errors: string[] = [];
    const struct = validateQuestionStructure(q);
    if (!struct.ok) errors.push(...struct.errors);
    const dup = findDuplicate(
      q as QuestionBankItem,
      items.filter((x) => x.id !== q.id),
    );
    if (dup.duplicate) errors.push(`duplicate:${dup.reason}`);
    return errors;
  };

  const saveLocal = (next: QuestionBankItem[]) => {
    setItems(next);
    setMsg("تم التحديث محلياً — للمزامنة مع Supabase استخدم API");
  };

  const openNew = () => {
    setForm(emptyForm());
    setModal(true);
  };

  const openEdit = (q: QuestionBankItem) => {
    setForm({ ...q, options: [...q.options] });
    setModal(true);
  };

  const save = () => {
    const opts = form.options || ["", "", "", ""];
    const answer = opts[form.correct_index ?? 0] || "";
    const hash = contentHash(form.question || "", answer);
    const candidate: QuestionBankItem = {
      id: form.id || `qb-v2-${hash.slice(0, 8)}`,
      question: form.question || "",
      options: opts as [string, string, string, string],
      correct_index: (form.correct_index ?? 0) as 0 | 1 | 2 | 3,
      explanation: form.explanation || "",
      source: form.source || "",
      reference: form.reference || form.source || "",
      evidence: form.evidence,
      book_name: form.book_name,
      chapter: form.chapter,
      difficulty: form.difficulty || "متوسط",
      category_slug: form.category_slug || "quran",
      subcategory_slug: form.subcategory_slug,
      keywords: form.keywords || [],
      language: form.language || "ar",
      status: form.status || "draft",
      workflow_stage: form.workflow_stage || "author",
      content_hash: hash,
      question_type: form.question_type,
      points: form.points || 10,
    };

    const audit = runQualityAudit(candidate);
    if (audit.length && candidate.workflow_stage === "published") {
      setMsg(`لا يمكن النشر: ${audit.join(", ")}`);
      return;
    }

    const dup = findDuplicate(candidate, items.filter((x) => x.id !== candidate.id));
    if (dup.duplicate) {
      setMsg(`تكرار مكتشف: ${dup.reason} (${Math.round((dup.score || 1) * 100)}%)`);
      return;
    }

    const idx = items.findIndex((x) => x.id === candidate.id);
    const next = idx >= 0 ? items.map((x, i) => (i === idx ? candidate : x)) : [...items, candidate];
    saveLocal(next);
    setModal(false);
  };

  const advanceStage = (q: QuestionBankItem) => {
    const order = WORKFLOW_STAGES;
    const i = order.indexOf(q.workflow_stage);
    if (i < 0 || i >= order.length - 1) return;
    const nextStage = order[i + 1];
    if (!canAdvanceWorkflow(q.workflow_stage, nextStage)) return;

    const audit = runQualityAudit(q);
    if (audit.length) {
      setMsg(`فشل التدقيق: ${audit.join(", ")}`);
      return;
    }

    const updated: QuestionBankItem = {
      ...q,
      workflow_stage: nextStage,
      status: nextStage === "published" ? "published" : "review",
      reviewed_at: new Date().toISOString().slice(0, 10),
    };
    saveLocal(items.map((x) => (x.id === q.id ? updated : x)));
    setMsg(`تم التقدم إلى: ${STAGE_LABELS[nextStage]}`);
  };

  const remove = (id: string) => {
    if (!confirm("حذف السؤال؟")) return;
    saveLocal(items.filter((x) => x.id !== id));
  };

  const importCsv = async (file: File) => {
    setLoading(true);
    const text = await file.text();
    const rows = parseCsv(text);
    const added: QuestionBankItem[] = [];
    for (const row of rows) {
      const audit = runQualityAudit(row);
      if (audit.length) continue;
      const opts = row.options as [string, string, string, string];
      const hash = contentHash(row.question || "", opts[row.correct_index ?? 0]);
      added.push({
        ...(row as QuestionBankItem),
        id: `qb-v2-import-${hash.slice(0, 8)}`,
        content_hash: hash,
        workflow_stage: "author",
        status: "draft",
        language: "ar",
        keywords: [],
      });
    }
    saveLocal([...items, ...added]);
    setMsg(`استيراد ${added.length} سؤال`);
    setLoading(false);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h2 style={{ marginBottom: "0.5rem" }}>بنك الأسئلة V2 — Global Quality Edition</h2>
      <p style={{ color: C.inkSoft, fontSize: "0.875rem", marginBottom: "1rem" }}>
        سير العمل: كاتب → مراجع لغوي → مراجع شرعي → اعتماد → نشر. لا يمكن تجاوز أي مرحلة.
      </p>

      {msg && (
        <p style={{ padding: "0.5rem 1rem", background: "#ecfdf5", borderRadius: "0.5rem", marginBottom: "1rem" }}>
          {msg}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <Stat label="إجمالي" value={report.total} />
        <Stat label="منشور" value={report.published} />
        <Stat label="قيد المراجعة" value={report.review} />
        <Stat label="جودة النشر" value={`${report.total ? Math.round((report.published / report.total) * 100) : 0}%`} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        <button type="button" onClick={openNew} style={btnPrimary}>+ سؤال جديد</button>
        <label style={{ ...btnSecondary, cursor: "pointer" }}>
          استيراد CSV
          <input type="file" accept=".csv,.txt" hidden onChange={(e) => e.target.files?.[0] && void importCsv(e.target.files[0])} />
        </label>
        <input placeholder="بحث..." value={filter} onChange={(e) => setFilter(e.target.value)} style={inputStyle} />
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={inputStyle}>
          <option value="">كل المراحل</option>
          {WORKFLOW_STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={inputStyle}>
          <option value="">كل التصنيفات</option>
          {MAIN_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name_ar}</option>
          ))}
        </select>
      </div>

      <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.5rem" }}>تغطية التصنيفات</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1.25rem" }}>
        {MAIN_CATEGORIES.map((c) => (
          <span key={c.slug} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", background: "#f3f4f6", borderRadius: "999px" }}>
            {c.icon} {c.name_ar}: {coverage[c.slug] || 0}
          </span>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={th}>السؤال</th>
              <th style={th}>التصنيف</th>
              <th style={th}>المرحلة</th>
              <th style={th}>اكتمال</th>
              <th style={th}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((q) => (
              <tr key={q.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={td}>{q.question.slice(0, 80)}{q.question.length > 80 ? "…" : ""}</td>
                <td style={td}>{resolveMainCategory(q.category_slug)}</td>
                <td style={td}>{STAGE_LABELS[q.workflow_stage]}</td>
                <td style={td}>{completionScore(q)}%</td>
                <td style={td}>
                  <button type="button" onClick={() => openEdit(q)} style={linkBtn}>تعديل</button>
                  {q.workflow_stage !== "published" && (
                    <button type="button" onClick={() => advanceStage(q)} style={linkBtn}>→ تقدم</button>
                  )}
                  <button type="button" onClick={() => remove(q.id)} style={{ ...linkBtn, color: "#b91c1c" }}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminModal open={modal} onClose={() => setModal(false)} onSave={save} title={form.id ? "تعديل سؤال" : "سؤال جديد"}>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <textarea placeholder="السؤال" value={form.question || ""} onChange={(e) => setForm({ ...form, question: e.target.value })} rows={3} style={inputStyle} />
          {(form.options || ["", "", "", ""]).map((opt, i) => (
            <input key={i} placeholder={`خيار ${i + 1}`} value={opt} onChange={(e) => {
              const opts = [...(form.options || ["", "", "", ""])] as [string, string, string, string];
              opts[i] = e.target.value;
              setForm({ ...form, options: opts });
            }} style={inputStyle} />
          ))}
          <select value={form.correct_index ?? 0} onChange={(e) => setForm({ ...form, correct_index: Number(e.target.value) as 0 | 1 | 2 | 3 })} style={inputStyle}>
            {[0, 1, 2, 3].map((i) => <option key={i} value={i}>الإجابة الصحيحة: خيار {i + 1}</option>)}
          </select>
          <textarea placeholder="التفسير" value={form.explanation || ""} onChange={(e) => setForm({ ...form, explanation: e.target.value })} rows={2} style={inputStyle} />
          <input placeholder="الدليل (قرآن/سنة)" value={form.evidence || ""} onChange={(e) => setForm({ ...form, evidence: e.target.value })} style={inputStyle} />
          <input placeholder="المصدر" value={form.source || ""} onChange={(e) => setForm({ ...form, source: e.target.value })} style={inputStyle} />
          <input placeholder="المرجع" value={form.reference || ""} onChange={(e) => setForm({ ...form, reference: e.target.value })} style={inputStyle} />
          <input placeholder="اسم الكتاب" value={form.book_name || ""} onChange={(e) => setForm({ ...form, book_name: e.target.value })} style={inputStyle} />
          <input placeholder="الباب" value={form.chapter || ""} onChange={(e) => setForm({ ...form, chapter: e.target.value })} style={inputStyle} />
          <select value={form.category_slug || "quran"} onChange={(e) => setForm({ ...form, category_slug: e.target.value })} style={inputStyle}>
            {MAIN_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name_ar}</option>)}
          </select>
          <select value={form.difficulty || "متوسط"} onChange={(e) => setForm({ ...form, difficulty: e.target.value as QuestionBankItem["difficulty"] })} style={inputStyle}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button type="button" onClick={save} style={btnPrimary}>حفظ</button>
        </div>
      </AdminModal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: "0.75rem", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.5rem", textAlign: "center" }}>
      <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{label}</div>
    </div>
  );
}

const inputStyle: CSSProperties = { width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", fontFamily: "inherit" };
const btnPrimary: CSSProperties = { padding: "0.5rem 1rem", background: C.emerald, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontWeight: 600 };
const btnSecondary: CSSProperties = { ...btnPrimary, background: "#fff", color: C.emerald, border: `1px solid ${C.emerald}` };
const th: CSSProperties = { padding: "0.5rem", textAlign: "right", fontWeight: 600 };
const td: CSSProperties = { padding: "0.5rem", verticalAlign: "top" };
const linkBtn: CSSProperties = { background: "none", border: "none", color: C.emerald, cursor: "pointer", marginInlineStart: "0.35rem", fontSize: "0.8125rem" };

export default QuestionBankV2Section;
