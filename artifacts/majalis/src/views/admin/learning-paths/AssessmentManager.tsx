import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { AdminModal, Field, FieldRow } from "@/views/admin/AdminModal";
import { StatusBadge } from "@/views/admin/AdminUI";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  adminFetchAssessments, adminUpsertAssessment, adminDeleteAssessment,
  adminFetchQuestions, adminUpsertQuestion, adminDeleteQuestion,
  type AdminAssessment, type AdminQuestion,
} from "@/lib/learning-paths-admin-service";

const EMPTY_ASSESSMENT: Partial<AdminAssessment> = { title: "", pass_percentage: 70, max_attempts: null, status: "draft" };

const QUESTION_TYPE_LABEL: Record<AdminQuestion["question_type"], string> = {
  mcq: "اختيار من متعدد",
  true_false: "صح / خطأ",
  ordering: "ترتيب",
  matching: "مطابقة",
  short_answer: "إجابة قصيرة",
  essay: "مقالية (بلا تصحيح آلي)",
};

type QuestionForm = {
  id?: string;
  question_type: AdminQuestion["question_type"];
  question_text: string;
  optionsText: string; // سطر لكل خيار
  correctValue: string; // mcq/true_false/short_answer(مقبولة مفصولة بفاصلة)
  correctJson: string; // ordering/matching — JSON خام متقدم
  explanation: string;
  explanation_source: string;
  points: number;
  sort_order: number;
};

function emptyQuestionForm(nextSortOrder: number): QuestionForm {
  return {
    question_type: "mcq",
    question_text: "",
    optionsText: "",
    correctValue: "",
    correctJson: "",
    explanation: "",
    explanation_source: "",
    points: 1,
    sort_order: nextSortOrder,
  };
}

function questionToForm(q: AdminQuestion): QuestionForm {
  const isAdvanced = q.question_type === "ordering" || q.question_type === "matching";
  const options = Array.isArray(q.options) ? (q.options as unknown[]) : [];
  let correctValue = "";
  if (q.question_type === "short_answer") {
    const accepted = (q.correct_answer as any)?.accepted;
    correctValue = Array.isArray(accepted) ? accepted.join("، ") : String((q.correct_answer as any)?.value ?? "");
  } else if (q.question_type === "mcq" || q.question_type === "true_false") {
    correctValue = String((q.correct_answer as any)?.value ?? "");
  }
  return {
    id: q.id,
    question_type: q.question_type,
    question_text: q.question_text,
    optionsText: options.map((o) => String(o)).join("\n"),
    correctValue,
    correctJson: isAdvanced ? JSON.stringify(q.correct_answer ?? null, null, 2) : "",
    explanation: q.explanation ?? "",
    explanation_source: q.explanation_source ?? "",
    points: q.points,
    sort_order: q.sort_order,
  };
}

function formToRow(form: QuestionForm, assessmentId: string): Partial<AdminQuestion> {
  let options: unknown;
  let correct_answer: unknown;
  if (form.question_type === "true_false") {
    options = ["صحيح", "خطأ"];
    correct_answer = { value: form.correctValue.trim() || "صحيح" };
  } else if (form.question_type === "mcq") {
    options = form.optionsText.split("\n").map((s) => s.trim()).filter(Boolean);
    correct_answer = { value: form.correctValue.trim() };
  } else if (form.question_type === "short_answer") {
    options = [];
    correct_answer = { accepted: form.correctValue.split("،").map((s) => s.trim()).filter(Boolean) };
  } else if (form.question_type === "ordering" || form.question_type === "matching") {
    options = form.optionsText.split("\n").map((s) => s.trim()).filter(Boolean);
    try {
      correct_answer = form.correctJson.trim() ? JSON.parse(form.correctJson) : null;
    } catch {
      correct_answer = null;
    }
  } else {
    // essay: لا تصحيح آلي
    options = [];
    correct_answer = null;
  }
  return {
    id: form.id,
    assessment_id: assessmentId,
    question_type: form.question_type,
    question_text: form.question_text.trim(),
    options,
    correct_answer,
    explanation: form.explanation.trim() || null,
    explanation_source: form.explanation_source.trim() || null,
    points: form.points,
    sort_order: form.sort_order,
    // is_approved غير موجود هنا عمدًا: لا يُعتمَد أي سؤال ضمنيًا عند الحفظ من هذا
    // النموذج — الاعتماد فعل صريح منفصل عبر زر "اعتماد" أدناه فقط.
  };
}

export function AssessmentManager({
  scopeType,
  scopeId,
  onAssessmentsChange,
}: {
  scopeType: AdminAssessment["scope_type"];
  scopeId: string;
  /** يُستدعى بعد كل تحميل بقائمة تقييمات هذا النطاق — يستخدمها المستدعي (مثلًا
   *  بطاقة المقرر) لتعبئة قائمة اختيار "الاختبار المرتبط" عند إضافة عنصر تعلّم
   *  من نوع assessment، دون تكرار منطق الجلب. */
  onAssessmentsChange?: (list: AdminAssessment[]) => void;
}) {
  const { showSuccess, showError } = useAdminShell();
  const [assessments, setAssessments] = useState<AdminAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState<Partial<AdminAssessment>>(EMPTY_ASSESSMENT);
  const [saving, setSaving] = useState(false);

  const [questionsByAssessment, setQuestionsByAssessment] = useState<Record<string, AdminQuestion[]>>({});
  const [questionOpen, setQuestionOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestionForm(0));
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await adminFetchAssessments(scopeType, scopeId);
    const list = data ?? [];
    setAssessments(list);
    onAssessmentsChange?.(list);
    const qMap: Record<string, AdminQuestion[]> = {};
    for (const a of list) {
      const { data: qs } = await adminFetchQuestions(a.id);
      qMap[a.id] = qs ?? [];
    }
    setQuestionsByAssessment(qMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, [scopeType, scopeId]);

  const scopeCol = scopeType === "course" ? "course_id" : scopeType === "stage" ? "stage_id" : "path_id";

  const saveAssessment = async () => {
    if (!assessmentForm.title?.trim()) return showError("عنوان التقييم مطلوب");
    setSaving(true);
    const { error } = await adminUpsertAssessment({
      ...assessmentForm,
      scope_type: scopeType,
      [scopeCol]: scopeId,
    } as Partial<AdminAssessment>);
    setSaving(false);
    if (error) return showError(error.message);
    showSuccess("تم حفظ التقييم");
    setAssessmentOpen(false);
    load();
  };

  const deleteAssessment = async (id: string) => {
    if (!confirm("حذف هذا التقييم وكل أسئلته؟ (سيبقى أي عنصر تعلّم مرتبط به بلا اختبار)")) return;
    const { error } = await adminDeleteAssessment(id);
    if (error) return showError(error.message);
    showSuccess("تم الحذف");
    load();
  };

  const saveQuestion = async () => {
    if (!activeAssessmentId) return;
    if (!questionForm.question_text.trim()) return showError("نص السؤال مطلوب");
    setSaving(true);
    const { error } = await adminUpsertQuestion(formToRow(questionForm, activeAssessmentId));
    setSaving(false);
    if (error) return showError(error.message);
    showSuccess("تم حفظ السؤال — لا يزال بحاجة اعتماد صريح قبل ظهوره لأي مستخدم");
    setQuestionOpen(false);
    load();
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("حذف هذا السؤال؟")) return;
    const { error } = await adminDeleteQuestion(id);
    if (error) return showError(error.message);
    load();
  };

  const toggleApproval = async (q: AdminQuestion) => {
    const { error } = await adminUpsertQuestion({ id: q.id, assessment_id: q.assessment_id, is_approved: !q.is_approved });
    if (error) return showError(error.message);
    showSuccess(!q.is_approved ? "تم اعتماد السؤال — سيظهر الآن للطلاب" : "أُلغي اعتماد السؤال — لن يظهر بعد الآن");
    load();
  };

  if (loading) return <p className="adm-empty-msg">جاري تحميل التقييمات…</p>;

  return (
    <div>
      {assessments.length === 0 && (
        <button
          type="button"
          className="adm-btn-add"
          onClick={() => { setAssessmentForm({ ...EMPTY_ASSESSMENT }); setAssessmentOpen(true); }}
        >
          <Plus size={14} /> إنشاء تقييم
        </button>
      )}

      {assessments.map((a) => {
        const questions = questionsByAssessment[a.id] ?? [];
        const approvedCount = questions.filter((q) => q.is_approved).length;
        return (
          <div key={a.id} className="adm-item-card">
            <div className="adm-section-hdr">
              <div>
                <strong>{a.title}</strong>{" "}
                <StatusBadge status={a.status} />{" "}
                <span className="adm-type-badge">نسبة النجاح {a.pass_percentage}%</span>{" "}
                <span className="adm-type-badge">{approvedCount}/{questions.length} سؤال معتمد</span>
              </div>
              <div className="adm-item-actions">
                <button type="button" className="adm-btn-sm" onClick={() => { setAssessmentForm(a); setAssessmentOpen(true); }}>
                  <Pencil size={13} /> تعديل
                </button>
                <button type="button" className="adm-btn-del" onClick={() => deleteAssessment(a.id)}>
                  <Trash2 size={13} /> حذف
                </button>
              </div>
            </div>

            {a.status === "published" && approvedCount === 0 && (
              <p className="adm-empty-msg" role="alert">
                تحذير: هذا التقييم منشور لكن بلا أي سؤال معتمد — لن يستطيع أي طالب اجتيازه فعليًا.
              </p>
            )}

            <div className="adm-section-hdr">
              <span className="adm-block-title">الأسئلة</span>
              <button
                type="button"
                className="adm-btn-sm"
                onClick={() => {
                  setActiveAssessmentId(a.id);
                  setQuestionForm(emptyQuestionForm(questions.length));
                  setQuestionOpen(true);
                }}
              >
                <Plus size={13} /> إضافة سؤال
              </button>
            </div>

            {questions.length === 0 && <p className="adm-empty-msg">لا أسئلة بعد.</p>}
            {questions.map((q) => (
              <div key={q.id} className="adm-item-card">
                <div className="adm-section-hdr">
                  <div>
                    <span className="adm-type-badge">{QUESTION_TYPE_LABEL[q.question_type]}</span>{" "}
                    <StatusBadge status={q.is_approved ? "approved" : "pending"} />{" "}
                    {q.question_text}
                  </div>
                  <div className="adm-item-actions">
                    <button
                      type="button"
                      className="adm-btn-sm"
                      onClick={() => toggleApproval(q)}
                      title={q.is_approved ? "إلغاء الاعتماد" : "اعتماد السؤال — يظهر عندها للطلاب"}
                    >
                      {q.is_approved ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                      {q.is_approved ? " إلغاء الاعتماد" : " اعتماد"}
                    </button>
                    <button
                      type="button"
                      className="adm-btn-sm"
                      onClick={() => {
                        setActiveAssessmentId(a.id);
                        setQuestionForm(questionToForm(q));
                        setQuestionOpen(true);
                      }}
                    >
                      <Pencil size={13} /> تعديل
                    </button>
                    <button type="button" className="adm-btn-del" onClick={() => deleteQuestion(q.id)}>
                      <Trash2 size={13} /> حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <AdminModal open={assessmentOpen} onClose={() => setAssessmentOpen(false)} title="بيانات التقييم" onSave={saveAssessment} saving={saving}>
        <Field label="العنوان">
          <input className="adm-input" value={assessmentForm.title ?? ""} onChange={(e) => setAssessmentForm((f) => ({ ...f, title: e.target.value }))} />
        </Field>
        <FieldRow>
          <Field label="نسبة النجاح %">
            <input
              className="adm-input" type="number" min={0} max={100}
              value={assessmentForm.pass_percentage ?? 70}
              onChange={(e) => setAssessmentForm((f) => ({ ...f, pass_percentage: Number(e.target.value) }))}
            />
          </Field>
          <Field label="أقصى عدد محاولات (اتركه فارغًا = بلا حد)">
            <input
              className="adm-input" type="number" min={1}
              value={assessmentForm.max_attempts ?? ""}
              onChange={(e) => setAssessmentForm((f) => ({ ...f, max_attempts: e.target.value ? Number(e.target.value) : null }))}
            />
          </Field>
        </FieldRow>
        <Field label="الحالة">
          <select className="adm-select" value={assessmentForm.status ?? "draft"} onChange={(e) => setAssessmentForm((f) => ({ ...f, status: e.target.value as AdminAssessment["status"] }))}>
            <option value="draft">مسودة</option>
            <option value="needs_review">يحتاج مراجعة</option>
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </Field>
      </AdminModal>

      <AdminModal open={questionOpen} onClose={() => setQuestionOpen(false)} title="سؤال تقييم" onSave={saveQuestion} saving={saving}>
        <Field label="نوع السؤال">
          <select
            className="adm-select"
            value={questionForm.question_type}
            onChange={(e) => setQuestionForm((f) => ({ ...f, question_type: e.target.value as AdminQuestion["question_type"] }))}
          >
            {Object.entries(QUESTION_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="نص السؤال">
          <textarea className="adm-textarea" rows={2} value={questionForm.question_text} onChange={(e) => setQuestionForm((f) => ({ ...f, question_text: e.target.value }))} />
        </Field>

        {questionForm.question_type === "mcq" && (
          <>
            <Field label="الخيارات (خيار في كل سطر)">
              <textarea className="adm-textarea" rows={4} value={questionForm.optionsText} onChange={(e) => setQuestionForm((f) => ({ ...f, optionsText: e.target.value }))} />
            </Field>
            <Field label="نص الإجابة الصحيحة (مطابق حرفيًا لأحد الخيارات أعلاه)">
              <input className="adm-input" value={questionForm.correctValue} onChange={(e) => setQuestionForm((f) => ({ ...f, correctValue: e.target.value }))} />
            </Field>
          </>
        )}

        {questionForm.question_type === "true_false" && (
          <Field label="الإجابة الصحيحة">
            <select className="adm-select" value={questionForm.correctValue || "صحيح"} onChange={(e) => setQuestionForm((f) => ({ ...f, correctValue: e.target.value }))}>
              <option value="صحيح">صحيح</option>
              <option value="خطأ">خطأ</option>
            </select>
          </Field>
        )}

        {questionForm.question_type === "short_answer" && (
          <Field label="الإجابات المقبولة (مفصولة بفاصلة عربية «،»)">
            <input className="adm-input" value={questionForm.correctValue} onChange={(e) => setQuestionForm((f) => ({ ...f, correctValue: e.target.value }))} />
          </Field>
        )}

        {(questionForm.question_type === "ordering" || questionForm.question_type === "matching") && (
          <>
            <Field label="العناصر (عنصر في كل سطر)">
              <textarea className="adm-textarea" rows={4} value={questionForm.optionsText} onChange={(e) => setQuestionForm((f) => ({ ...f, optionsText: e.target.value }))} />
            </Field>
            <Field label="الإجابة الصحيحة — JSON خام (متقدم)">
              <textarea className="adm-textarea" rows={3} dir="ltr" value={questionForm.correctJson} onChange={(e) => setQuestionForm((f) => ({ ...f, correctJson: e.target.value }))} />
            </Field>
          </>
        )}

        {questionForm.question_type === "essay" && (
          <p className="adm-empty-msg">سؤال مقالي — لا تصحيح آلي، يحتاج مراجعة يدوية لكل إجابة (غير مدعوم بعد في مسار التصحيح الآلي).</p>
        )}

        <FieldRow>
          <Field label="الدرجة">
            <input className="adm-input" type="number" min={0.5} step={0.5} value={questionForm.points} onChange={(e) => setQuestionForm((f) => ({ ...f, points: Number(e.target.value) }))} />
          </Field>
          <Field label="ترتيب الظهور">
            <input className="adm-input" type="number" value={questionForm.sort_order} onChange={(e) => setQuestionForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
          </Field>
        </FieldRow>
        <Field label="الشرح (يظهر للطالب بعد الإجابة)">
          <textarea className="adm-textarea" rows={2} value={questionForm.explanation} onChange={(e) => setQuestionForm((f) => ({ ...f, explanation: e.target.value }))} />
        </Field>
        <Field label="مصدر الشرح">
          <input className="adm-input" value={questionForm.explanation_source} onChange={(e) => setQuestionForm((f) => ({ ...f, explanation_source: e.target.value }))} />
        </Field>
        <p className="adm-empty-msg">
          ملاحظة: حفظ السؤال هنا لا يعتمده تلقائيًا — استخدم زر «اعتماد» في القائمة بعد المراجعة العلمية.
        </p>
      </AdminModal>
    </div>
  );
}
