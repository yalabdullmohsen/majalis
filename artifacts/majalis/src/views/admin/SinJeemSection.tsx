import { useCallback, useEffect, useState } from "react";
import { AdminModal } from "@/views/admin/AdminModal";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { SIN_JEEM_CATEGORIES } from "@/lib/sin-jeem/categories-seed";
import { SIN_JEEM_QUESTIONS } from "@/lib/sin-jeem/questions-seed";
import { adminDeleteQuestion, adminGetQuestions, adminUpsertQuestion } from "@/lib/sin-jeem/supabase";
import type { Difficulty, SinJeemQuestion } from "@/lib/sin-jeem/types";
import { DIFFICULTIES } from "@/lib/sin-jeem/constants";

const emptyForm = (): Partial<SinJeemQuestion> => ({
  question: "",
  options: ["", "", "", ""],
  correct_index: 0,
  difficulty: "متوسط",
  question_type: "multiple_choice",
  explanation: "",
  category_slug: "quran",
});

export function SinJeemSection() {
  const [questions, setQuestions] = useState<SinJeemQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminGetQuestions().then((q) => {
      setQuestions(q.length ? q : SIN_JEEM_QUESTIONS);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = questions.filter(
    (q) => !filter || q.question.includes(filter) || q.category_slug?.includes(filter),
  );

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

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(String(e.target?.result));
        const rows = Array.isArray(data) ? data : data.questions || [];
        for (const row of rows) {
          await adminUpsertQuestion(row);
        }
        setMsg(`تم استيراد ${rows.length} سؤال`);
        load();
      } catch {
        setMsg("ملف JSON غير صالح");
      }
    };
    reader.readAsText(file);
  };

  const generateAi = async () => {
    setMsg("جاري التوليد...");
    try {
      const res = await fetch("/api/sin-jeem?action=generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "fawaid", count: 1 }),
      });
      const data = await res.json();
      if (data.question) {
        setForm({ ...emptyForm(), ...data.question });
        setModal(true);
        setMsg("تم توليد سؤال بالذكاء الاصطناعي");
      } else {
        setMsg(data.error || "تعذر التوليد — تحقق من OPENAI_API_KEY");
      }
    } catch {
      setMsg("فشل الاتصال بمولد الأسئلة");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", marginBottom: "1rem", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep, flex: 1 }}>سين وجيم — إدارة الأسئلة</h2>
        <button type="button" className="page-action-btn" onClick={() => { setForm(emptyForm()); setModal(true); }}>
          + سؤال جديد
        </button>
        <button type="button" className="page-action-btn" onClick={generateAi}>🤖 توليد AI</button>
        <label className="page-action-btn" style={{ cursor: "pointer" }}>
          📥 استيراد JSON
          <input type="file" accept=".json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </label>
      </div>

      {msg && <p style={{ marginBottom: "0.75rem", color: C.emeraldDeep, fontSize: "0.875rem" }}>{msg}</p>}

      <input
        placeholder="بحث..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ width: "100%", maxWidth: 320, padding: "0.5rem", marginBottom: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}` }}
      />

      {loading ? <Loading /> : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {filtered.slice(0, 100).map((q) => (
            <div key={q.id} style={{ padding: "0.75rem", border: `1px solid ${C.line}`, borderRadius: "0.5rem", background: C.panel }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{q.question}</div>
              <div style={{ fontSize: "0.75rem", color: C.inkSoft }}>
                {q.category_slug} · {q.difficulty} · {q.question_type}
              </div>
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={() => { setForm(q); setModal(true); }}>تعديل</button>
                <button type="button" onClick={() => remove(q.id)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: C.inkSoft }}>
        {SIN_JEEM_CATEGORIES.length} فئة · {questions.length} سؤال
      </p>

      <AdminModal open={modal} onClose={() => setModal(false)} onSave={save} title="سؤال">
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <textarea
            rows={3}
            placeholder="نص السؤال"
            value={form.question || ""}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            style={{ width: "100%", padding: "0.5rem" }}
          />
          {(form.options || []).map((opt, i) => (
            <input
              key={i}
              placeholder={`الخيار ${i + 1}`}
              value={opt}
              onChange={(e) => {
                const options = [...(form.options || [])];
                options[i] = e.target.value;
                setForm({ ...form, options });
              }}
            />
          ))}
          <select value={form.correct_index ?? 0} onChange={(e) => setForm({ ...form, correct_index: Number(e.target.value) })}>
            {[0, 1, 2, 3].map((i) => (
              <option key={i} value={i}>الإجابة الصحيحة: {i + 1}</option>
            ))}
          </select>
          <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
            {SIN_JEEM_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name_ar}</option>)}
          </select>
          <textarea
            rows={2}
            placeholder="التفسير"
            value={form.explanation || ""}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          />
          <button type="button" className="page-action-btn" onClick={save}>حفظ</button>
        </div>
      </AdminModal>
    </div>
  );
}

export default SinJeemSection;
