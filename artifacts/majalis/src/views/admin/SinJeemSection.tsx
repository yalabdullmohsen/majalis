import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminModal } from "@/views/admin/AdminModal";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { SIN_JEEM_CATEGORIES } from "@/lib/sin-jeem/categories-seed";
import { SIN_JEEM_QUESTIONS } from "@/lib/sin-jeem/questions-seed";
import { adminDeleteQuestion, adminGetQuestions, adminUpsertQuestion } from "@/lib/sin-jeem/supabase";
import type { Difficulty, QuestionType, SinJeemQuestion } from "@/lib/sin-jeem/types";
import { DIFFICULTIES } from "@/lib/sin-jeem/constants";

type AuditRow = { id: string; action: string; created_at: string; question_id?: string; payload?: unknown };

const QUESTION_TYPES: QuestionType[] = [
  "multiple_choice", "true_false", "complete_verse", "complete_hadith", "complete_mutoon",
  "order_events", "match", "image_choice", "mosque_choice", "companion_choice",
  "scholar_choice", "book_choice", "battle_choice", "seira_timeline", "audio_choice", "video_choice",
];

const emptyForm = (): Partial<SinJeemQuestion> => ({
  question: "",
  options: ["", "", "", ""],
  correct_index: 0,
  difficulty: "متوسط",
  question_type: "multiple_choice",
  explanation: "",
  category_slug: "quran",
  review_status: "approved",
});

async function adminApi(action: string, body?: Record<string, unknown>) {
  const res = await fetch(`/api/question-answer?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action, ...body }),
  });
  return res.json();
}

function parseCsvClient(text: string): Partial<SinJeemQuestion>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
  const idx = (n: string) => header.indexOf(n);
  return lines.slice(1).map((line) => {
    const cols = line.match(/("([^"]|"")*"|[^,]*)/g)?.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) || [];
    const opts = (cols[idx("options")] || "").split("|").filter(Boolean);
    return {
      question: cols[idx("question")] || cols[0] || "",
      options: opts.length ? opts : undefined,
      correct_index: Number(cols[idx("correct_index")] || 0),
      category_slug: cols[idx("category_slug")] || "fiqh",
      question_type: (cols[idx("question_type")] || "multiple_choice") as QuestionType,
      difficulty: (cols[idx("difficulty")] || "متوسط") as Difficulty,
      source: cols[idx("source")],
      explanation: cols[idx("explanation")],
    };
  }).filter((q) => q.question);
}

export function SinJeemSection() {
  const [questions, setQuestions] = useState<SinJeemQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminGetQuestions().then((q) => {
      setQuestions(q.length ? q : SIN_JEEM_QUESTIONS);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => questions.filter((q) => {
    if (filter && !q.question.includes(filter) && !q.category_slug?.includes(filter)) return false;
    if (statusFilter && q.review_status !== statusFilter) return false;
    if (typeFilter && q.question_type !== typeFilter) return false;
    if (difficultyFilter && q.difficulty !== difficultyFilter) return false;
    return true;
  }), [questions, filter, statusFilter, typeFilter, difficultyFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filtered.slice(0, 100).map((q) => q.id)));
  };

  const save = async () => {
    if (!form.question?.trim()) return;
    const ok = await adminUpsertQuestion(form as SinJeemQuestion & { question: string });
    setMsg(ok ? "تم الحفظ" : "فشل الحفظ (تحقق من Supabase)");
    setModal(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف السؤال؟")) return;
    await adminDeleteQuestion(id);
    load();
  };

  const bulkAction = async (action: "admin_bulk_approve" | "admin_bulk_reject" | "admin_bulk_delete") => {
    const ids = [...selected].filter((id) => !id.startsWith("sq-"));
    if (!ids.length) { setMsg("اختر أسئلة من قاعدة البيانات"); return; }
    const data = await adminApi(action, { ids });
    setMsg(data.ok ? `تم (${data.updated || data.deleted})` : data.error || "فشل");
    setSelected(new Set());
    load();
  };

  const importRows = async (rows: Partial<SinJeemQuestion>[]) => {
    const data = await adminApi("admin_import", { questions: rows });
    if (data.ok) {
      setMsg(`استيراد: ${data.inserted} جديد، ${data.skipped} مكرر`);
      load();
    } else {
      for (const row of rows) await adminUpsertQuestion(row as SinJeemQuestion & { question: string });
      setMsg(`استيراد محلي: ${rows.length} سؤال`);
      load();
    }
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(String(e.target?.result));
        const rows = Array.isArray(data) ? data : data.questions || [];
        await importRows(rows);
      } catch {
        setMsg("ملف JSON غير صالح");
      }
    };
    reader.readAsText(file);
  };

  const importCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rows = parseCsvClient(String(e.target?.result || ""));
      if (!rows.length) { setMsg("CSV فارغ أو غير صالح"); return; }
      await importRows(rows);
    };
    reader.readAsText(file);
  };

  const importExcel = async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
      const mapped = rows.map((r) => ({
        question: r.question || r.سؤال || "",
        options: String(r.options || r.خيارات || "").split("|").filter(Boolean),
        correct_index: Number(r.correct_index ?? r.إجابة ?? 0),
        category_slug: r.category_slug || r.تصنيف || "fiqh",
        question_type: (r.question_type || r.نوع || "multiple_choice") as QuestionType,
        difficulty: (r.difficulty || r.مستوى || "متوسط") as Difficulty,
        source: r.source || r.مصدر,
        explanation: r.explanation || r.شرح,
      })).filter((q) => q.question);
      await importRows(mapped);
    } catch {
      setMsg("فشل قراءة Excel — ثبّت xlsx أو صدّر CSV");
    }
  };

  const exportData = async (format: "json" | "csv") => {
    const data = await adminApi("admin_export", { format });
    if (!data.ok) {
      const blob = new Blob([JSON.stringify(questions, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `question-answer-export.${format}`;
      a.click();
      return;
    }
    const content = format === "csv" ? data.content : JSON.stringify(data.questions, null, 2);
    const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `question-answer-export.${format}`;
    a.click();
    setMsg(`تم التصدير (${format})`);
  };

  const loadAudit = async () => {
    const data = await adminApi("admin_audit");
    setAudit(data.audit || []);
    setShowAudit(true);
  };

  const generateAi = async () => {
    setMsg("جاري التوليد...");
    try {
      const res = await fetch("/api/question-answer?action=generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "fawaid", count: 1 }),
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.question) {
        setForm({ ...emptyForm(), ...data.question, review_status: data.review_status === "pending" ? "pending" : "approved" });
        setModal(true);
        setMsg(data.review_status === "pending" ? "سؤال للمراجعة (ثقة منخفضة)" : "تم توليد سؤال");
      } else {
        setMsg(data.error || "تعذر التوليد");
      }
    } catch {
      setMsg("فشل الاتصال بمولد الأسئلة");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", marginBottom: "1rem", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep, flex: 1 }}>سؤال وجواب — إدارة الأسئلة</h2>
        <button type="button" className="page-action-btn" onClick={() => { setForm(emptyForm()); setModal(true); }}>+ سؤال</button>
        <button type="button" className="page-action-btn" onClick={generateAi}>🤖 AI</button>
        <label className="page-action-btn" style={{ cursor: "pointer" }}>
          JSON<input type="file" accept=".json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </label>
        <label className="page-action-btn" style={{ cursor: "pointer" }}>
          CSV<input type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} />
        </label>
        <label className="page-action-btn" style={{ cursor: "pointer" }}>
          Excel<input type="file" accept=".xlsx,.xls" hidden onChange={(e) => e.target.files?.[0] && importExcel(e.target.files[0])} />
        </label>
        <button type="button" className="page-action-btn" onClick={() => exportData("json")}>تصدير JSON</button>
        <button type="button" className="page-action-btn" onClick={() => exportData("csv")}>تصدير CSV</button>
        <button type="button" className="page-action-btn" onClick={loadAudit}>سجل التعديلات</button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button type="button" onClick={selectAll}>تحديد الكل</button>
        <button type="button" onClick={() => bulkAction("admin_bulk_approve")}>اعتماد جماعي</button>
        <button type="button" onClick={() => bulkAction("admin_bulk_reject")}>رفض جماعي</button>
        <button type="button" onClick={() => bulkAction("admin_bulk_delete")}>حذف جماعي</button>
        <span style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{selected.size} محدد</span>
      </div>

      {msg && <p style={{ marginBottom: "0.75rem", color: C.emeraldDeep, fontSize: "0.875rem" }}>{msg}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        <input placeholder="بحث..." value={filter} onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, minWidth: 180 }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="pending">قيد المراجعة</option>
          <option value="approved">معتمد</option>
          <option value="rejected">مرفوض</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">كل الأنواع</option>
          {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
          <option value="">كل المستويات</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {filtered.slice(0, 100).map((q) => (
            <div key={q.id} style={{ padding: "0.75rem", border: `1px solid ${C.line}`, borderRadius: "0.5rem", background: C.panel, display: "flex", gap: "0.5rem" }}>
              <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{q.question}</div>
                <div style={{ fontSize: "0.75rem", color: C.inkSoft }}>
                  {q.category_slug} · {q.difficulty} · {q.question_type}
                  {q.review_status && q.review_status !== "approved" && ` · ${q.review_status}`}
                  {q.source && ` · ${q.source}`}
                </div>
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                  <button type="button" onClick={() => { setForm(q); setModal(true); }}>تعديل</button>
                  <button type="button" onClick={() => remove(q.id)}>حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: C.inkSoft }}>
        {SIN_JEEM_CATEGORIES.length} فئة · {questions.length} سؤال · {filtered.length} بعد الفلتر
      </p>

      {showAudit && (
        <AdminModal open={showAudit} onClose={() => setShowAudit(false)} onSave={() => setShowAudit(false)} title="سجل التعديلات">
          <div style={{ maxHeight: 320, overflow: "auto" }}>
            {audit.length ? audit.map((a) => (
              <div key={a.id} style={{ padding: "0.5rem 0", borderBottom: `1px solid ${C.line}`, fontSize: "0.8125rem" }}>
                <strong>{a.action}</strong> · {a.question_id?.slice(0, 8)} · {new Date(a.created_at).toLocaleString("ar")}
              </div>
            )) : <p>لا سجلات بعد — تُسجَّل عند الاعتماد/الرفض/الحذف</p>}
          </div>
        </AdminModal>
      )}

      <AdminModal open={modal} onClose={() => setModal(false)} onSave={save} title="سؤال">
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <textarea rows={3} placeholder="نص السؤال" value={form.question || ""}
            onChange={(e) => setForm({ ...form, question: e.target.value })} style={{ width: "100%", padding: "0.5rem" }} />
          {(form.options || []).map((opt, i) => (
            <input key={i} placeholder={`الخيار ${i + 1}`} value={opt}
              onChange={(e) => { const options = [...(form.options || [])]; options[i] = e.target.value; setForm({ ...form, options }); }} />
          ))}
          <select value={form.correct_index ?? 0} onChange={(e) => setForm({ ...form, correct_index: Number(e.target.value) })}>
            {[0, 1, 2, 3].map((i) => <option key={i} value={i}>الإجابة: {i + 1}</option>)}
          </select>
          <select value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value as QuestionType })}>
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
            {SIN_JEEM_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name_ar}</option>)}
          </select>
          <input placeholder="المصدر" value={form.source || ""} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <textarea rows={2} placeholder="التفسير" value={form.explanation || ""}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
        </div>
      </AdminModal>
    </div>
  );
}

export default SinJeemSection;
