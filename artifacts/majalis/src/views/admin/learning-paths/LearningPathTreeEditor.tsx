import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, ArrowUp, ArrowDown, X } from "lucide-react";
import { AdminModal, Field, FieldRow } from "@/views/admin/AdminModal";
import { StatusBadge } from "@/views/admin/AdminUI";
import { useAdminShell } from "@/views/admin/AdminShell";
import { AssessmentManager } from "./AssessmentManager";
import {
  adminFetchStages, adminUpsertStage, adminDeleteStage,
  adminFetchCourses, adminUpsertCourse, adminDeleteCourse,
  adminFetchAllCoursesInPath, adminFetchPrerequisites, adminAddPrerequisite, adminRemovePrerequisite,
  adminFetchUnits, adminUpsertUnit, adminDeleteUnit,
  adminFetchItems, adminUpsertItem, adminDeleteItem,
  adminFetchBooks, adminUpsertBook, adminDeleteBook,
  adminSwapSortOrder, adminValidateCourseForPublish,
  type AdminStage, type AdminCourse, type AdminUnit, type AdminItem, type AdminBook, type AdminPrerequisite, type AdminAssessment,
} from "@/lib/learning-paths-admin-service";

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* ═══ بطاقة مرحلة ═══════════════════════════════════════════════════════ */

function StageCard({
  stage, pathId, index, total, onMove, onReload,
}: {
  stage: AdminStage; pathId: string; index: number; total: number;
  onMove: (dir: -1 | 1) => void; onReload: () => void;
}) {
  const { showSuccess, showError } = useAdminShell();
  const [expanded, setExpanded] = useState(false);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<AdminStage>>(stage);
  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    const { data } = await adminFetchCourses(stage.id);
    setCourses(data ?? []);
    setLoading(false);
  };

  useEffect(() => { if (expanded) loadCourses(); }, [expanded]);

  const saveStage = async () => {
    if (!form.title?.trim()) return showError("عنوان المرحلة مطلوب");
    setSaving(true);
    const { error } = await adminUpsertStage({
      ...form,
      path_id: pathId,
      slug: form.slug?.trim() || slugify(form.title),
    });
    setSaving(false);
    if (error) return showError(error.message);
    showSuccess("تم حفظ المرحلة");
    setOpen(false);
    onReload();
  };

  const deleteStage = async () => {
    if (!confirm(`حذف مرحلة «${stage.title}» وكل مقرراتها؟ لا يمكن التراجع.`)) return;
    const { error } = await adminDeleteStage(stage.id);
    if (error) return showError(error.message);
    onReload();
  };

  return (
    <div className="adm-item-card">
      <div className="adm-section-hdr">
        <button type="button" className="adm-btn-sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <div style={{ flex: 1 }}>
          <strong>{stage.title}</strong> <StatusBadge status={stage.status} />
        </div>
        <div className="adm-item-actions">
          <button type="button" className="adm-btn-sm" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={13} /></button>
          <button type="button" className="adm-btn-sm" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown size={13} /></button>
          <button type="button" className="adm-btn-sm" onClick={() => { setForm(stage); setOpen(true); }}><Pencil size={13} /> تعديل</button>
          <button type="button" className="adm-btn-del" onClick={deleteStage}><Trash2 size={13} /> حذف</button>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingInlineStart: "1.25rem" }}>
          {loading ? <p className="adm-empty-msg">جاري التحميل…</p> : (
            <>
              {courses.length === 0 && <p className="adm-empty-msg">لا مقررات بعد في هذه المرحلة.</p>}
              {courses
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((c, i, arr) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    pathId={pathId}
                    index={i}
                    total={arr.length}
                    onMove={async (dir) => {
                      const other = arr[i + dir];
                      if (!other) return;
                      await adminSwapSortOrder("courses", c, other);
                      loadCourses();
                    }}
                    onReload={loadCourses}
                  />
                ))}
              <button
                type="button"
                className="adm-btn-add"
                onClick={async () => {
                  const title = prompt("عنوان المقرر الجديد؟");
                  if (!title?.trim()) return;
                  const { error } = await adminUpsertCourse({
                    stage_id: stage.id,
                    title: title.trim(),
                    slug: slugify(title),
                    level: "foundational",
                    sort_order: courses.length,
                    pass_percentage: 70,
                    outcomes: [],
                    status: "draft",
                  });
                  if (error) return showError(error.message);
                  loadCourses();
                }}
              >
                <Plus size={14} /> إضافة مقرر
              </button>
            </>
          )}
        </div>
      )}

      <AdminModal open={open} onClose={() => setOpen(false)} title="بيانات المرحلة" onSave={saveStage} saving={saving}>
        <Field label="العنوان"><input className="adm-input" value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
        <Field label="الوصف"><textarea className="adm-textarea" rows={2} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <Field label="الحالة">
          <select className="adm-select" value={form.status ?? "draft"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AdminStage["status"] }))}>
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}

/* ═══ بطاقة مقرر ═══════════════════════════════════════════════════════ */

function CourseCard({
  course, pathId, index, total, onMove, onReload,
}: {
  course: AdminCourse; pathId: string; index: number; total: number;
  onMove: (dir: -1 | 1) => void; onReload: () => void;
}) {
  const { showSuccess, showError } = useAdminShell();
  const [expanded, setExpanded] = useState(false);
  const [units, setUnits] = useState<AdminUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<AdminCourse>>(course);
  const [saving, setSaving] = useState(false);

  const [allCourses, setAllCourses] = useState<Array<{ id: string; title: string; stage_title: string }>>([]);
  const [prereqs, setPrereqs] = useState<AdminPrerequisite[]>([]);
  const [courseAssessments, setCourseAssessments] = useState<AdminAssessment[]>([]);

  const loadUnits = async () => {
    setLoading(true);
    const { data } = await adminFetchUnits(course.id);
    setUnits(data ?? []);
    setLoading(false);
  };

  const loadPrereqs = async () => {
    const [{ data: prereqData }, list] = await Promise.all([
      adminFetchPrerequisites(course.id),
      adminFetchAllCoursesInPath(pathId),
    ]);
    setPrereqs(prereqData ?? []);
    setAllCourses(list.filter((c) => c.id !== course.id));
  };

  useEffect(() => { if (expanded) { loadUnits(); loadPrereqs(); } }, [expanded]);

  const saveCourse = async () => {
    if (!form.title?.trim()) return showError("عنوان المقرر مطلوب");
    if (form.status === "published") {
      const check = await adminValidateCourseForPublish(course.id);
      if (!check.ok) return showError("تعذّر النشر: " + check.errors.join(" — "));
    }
    setSaving(true);
    const { error } = await adminUpsertCourse({ ...form, slug: form.slug?.trim() || slugify(form.title) });
    setSaving(false);
    if (error) return showError(error.message);
    showSuccess("تم حفظ المقرر");
    setOpen(false);
    onReload();
  };

  const deleteCourse = async () => {
    if (!confirm(`حذف مقرر «${course.title}» وكل وحداته وعناصره؟ لا يمكن التراجع.`)) return;
    const { error } = await adminDeleteCourse(course.id);
    if (error) return showError(error.message);
    onReload();
  };

  const addPrereq = async (requiresId: string) => {
    if (!requiresId) return;
    const { error } = await adminAddPrerequisite(course.id, requiresId);
    if (error) return showError(error.message);
    loadPrereqs();
  };

  const removePrereq = async (id: string) => {
    const { error } = await adminRemovePrerequisite(id);
    if (error) return showError(error.message);
    loadPrereqs();
  };

  return (
    <div className="adm-item-card">
      <div className="adm-section-hdr">
        <button type="button" className="adm-btn-sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <div style={{ flex: 1 }}>
          <strong>{course.title}</strong> <StatusBadge status={course.status} />{" "}
          <span className="adm-type-badge">{course.level}</span>
        </div>
        <div className="adm-item-actions">
          <button type="button" className="adm-btn-sm" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={13} /></button>
          <button type="button" className="adm-btn-sm" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown size={13} /></button>
          <button type="button" className="adm-btn-sm" onClick={() => { setForm(course); setOpen(true); }}><Pencil size={13} /> تعديل</button>
          <button type="button" className="adm-btn-del" onClick={deleteCourse}><Trash2 size={13} /> حذف</button>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingInlineStart: "1.25rem" }}>
          <div className="adm-block-title">المتطلبات السابقة</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBlockEnd: "0.5rem" }}>
            {prereqs.map((p) => {
              const c = allCourses.find((ac) => ac.id === p.requires_course_id);
              return (
                <span key={p.id} className="adm-type-badge">
                  {c?.title ?? p.requires_course_id}
                  <button type="button" onClick={() => removePrereq(p.id)} aria-label="إزالة" style={{ marginInlineStart: 4 }}><X size={11} /></button>
                </span>
              );
            })}
            {prereqs.length === 0 && <span className="adm-empty-msg">بلا متطلبات — مفتوح دومًا</span>}
          </div>
          <select className="adm-select" value="" onChange={(e) => addPrereq(e.target.value)}>
            <option value="">+ إضافة متطلب سابق…</option>
            {allCourses
              .filter((c) => !prereqs.some((p) => p.requires_course_id === c.id))
              .map((c) => <option key={c.id} value={c.id}>{c.stage_title} — {c.title}</option>)}
          </select>

          <div className="adm-block-title" style={{ marginBlockStart: "0.75rem" }}>الوحدات والعناصر</div>
          {loading ? <p className="adm-empty-msg">جاري التحميل…</p> : (
            <>
              {units.length === 0 && <p className="adm-empty-msg">لا وحدات بعد.</p>}
              {units
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((u, i, arr) => (
                  <UnitCard
                    key={u.id}
                    unit={u}
                    index={i}
                    total={arr.length}
                    courseAssessments={courseAssessments}
                    onMove={async (dir) => {
                      const other = arr[i + dir];
                      if (!other) return;
                      await adminSwapSortOrder("course_units", u, other);
                      loadUnits();
                    }}
                    onReload={loadUnits}
                  />
                ))}
              <button
                type="button"
                className="adm-btn-add"
                onClick={async () => {
                  const title = prompt("عنوان الوحدة الجديدة؟");
                  if (!title?.trim()) return;
                  const { error } = await adminUpsertUnit({ course_id: course.id, title: title.trim(), sort_order: units.length });
                  if (error) return showError(error.message);
                  loadUnits();
                }}
              >
                <Plus size={14} /> إضافة وحدة
              </button>
            </>
          )}

          <div className="adm-block-title" style={{ marginBlockStart: "0.75rem" }}>تقييم المقرر</div>
          <AssessmentManager scopeType="course" scopeId={course.id} onAssessmentsChange={setCourseAssessments} />
        </div>
      )}

      <AdminModal open={open} onClose={() => setOpen(false)} title="بيانات المقرر" onSave={saveCourse} saving={saving}>
        <Field label="العنوان"><input className="adm-input" value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
        <Field label="الوصف"><textarea className="adm-textarea" rows={2} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <Field label="هدف التعلّم"><textarea className="adm-textarea" rows={2} value={form.learning_goal ?? ""} onChange={(e) => setForm((f) => ({ ...f, learning_goal: e.target.value }))} /></Field>
        <FieldRow>
          <Field label="المستوى">
            <select className="adm-select" value={form.level ?? "foundational"} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as AdminCourse["level"] }))}>
              <option value="foundational">تأسيسي</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
              <option value="specialist">تخصصي</option>
            </select>
          </Field>
          <Field label="نسبة النجاح %">
            <input className="adm-input" type="number" min={0} max={100} value={form.pass_percentage ?? 70} onChange={(e) => setForm((f) => ({ ...f, pass_percentage: Number(e.target.value) }))} />
          </Field>
        </FieldRow>
        <Field label="الحالة">
          <select className="adm-select" value={form.status ?? "draft"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AdminCourse["status"] }))}>
            <option value="draft">مسودة</option>
            <option value="needs_review">يحتاج مراجعة</option>
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </Field>
        <p className="adm-empty-msg">النشر مقفل تلقائيًا إن لم يوجد محتوى إلزامي كافٍ، أو اختبار إلزامي بلا أسئلة معتمدة.</p>
      </AdminModal>
    </div>
  );
}

/* ═══ بطاقة وحدة + عناصرها ═══════════════════════════════════════════════ */

const ITEM_TYPE_LABEL: Record<AdminItem["item_type"], string> = {
  book: "كتاب", lesson: "درس", activity: "نشاط", assessment: "اختبار",
};
const COMPLETION_METHOD_LABEL: Record<AdminItem["completion_method"], string> = {
  manual_confirm: "تأكيد يدوي", watch_percent: "نسبة مشاهدة", read_scroll: "نسبة قراءة",
  assessment_pass: "اجتياز اختبار", activity_submit: "تسليم نشاط",
};

function UnitCard({
  unit, index, total, courseAssessments, onMove, onReload,
}: {
  unit: AdminUnit; index: number; total: number; courseAssessments: AdminAssessment[];
  onMove: (dir: -1 | 1) => void; onReload: () => void;
}) {
  const { showError } = useAdminShell();
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [titleEdit, setTitleEdit] = useState(false);
  const [titleDraft, setTitleDraft] = useState(unit.title);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await adminFetchItems(unit.id);
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { if (expanded) loadItems(); }, [expanded]);

  const deleteUnit = async () => {
    if (!confirm(`حذف وحدة «${unit.title}» وكل عناصرها؟`)) return;
    const { error } = await adminDeleteUnit(unit.id);
    if (error) return showError(error.message);
    onReload();
  };

  const saveTitle = async () => {
    if (!titleDraft.trim()) return;
    const { error } = await adminUpsertUnit({ id: unit.id, title: titleDraft.trim() });
    if (error) return showError(error.message);
    setTitleEdit(false);
    onReload();
  };

  return (
    <div className="adm-item-card">
      <div className="adm-section-hdr">
        <button type="button" className="adm-btn-sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {titleEdit ? (
          <FieldRow>
            <input className="adm-input" value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} />
            <button type="button" className="adm-btn-sm" onClick={saveTitle}>حفظ</button>
          </FieldRow>
        ) : (
          <strong style={{ flex: 1 }}>{unit.title}</strong>
        )}
        <div className="adm-item-actions">
          <button type="button" className="adm-btn-sm" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={13} /></button>
          <button type="button" className="adm-btn-sm" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown size={13} /></button>
          <button type="button" className="adm-btn-sm" onClick={() => setTitleEdit((v) => !v)}><Pencil size={13} /> تعديل</button>
          <button type="button" className="adm-btn-del" onClick={deleteUnit}><Trash2 size={13} /> حذف</button>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingInlineStart: "1.25rem" }}>
          {loading ? <p className="adm-empty-msg">جاري التحميل…</p> : (
            <>
              {items.length === 0 && <p className="adm-empty-msg">لا عناصر بعد.</p>}
              {items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((it, i, arr) => (
                  <ItemCard
                    key={it.id}
                    item={it}
                    index={i}
                    total={arr.length}
                    courseAssessments={courseAssessments}
                    onMove={async (dir) => {
                      const other = arr[i + dir];
                      if (!other) return;
                      await adminSwapSortOrder("learning_items", it, other);
                      loadItems();
                    }}
                    onReload={loadItems}
                  />
                ))}
              <button
                type="button"
                className="adm-btn-add"
                onClick={async () => {
                  const title = prompt("عنوان العنصر الجديد؟");
                  if (!title?.trim()) return;
                  const { error } = await adminUpsertItem({
                    unit_id: unit.id,
                    item_type: "lesson",
                    title: title.trim(),
                    session_estimate: 1,
                    weight: 1,
                    is_required: true,
                    completion_method: "manual_confirm",
                    sort_order: items.length,
                    status: "draft",
                    is_approved: true,
                  });
                  if (error) return showError(error.message);
                  loadItems();
                }}
              >
                <Plus size={14} /> إضافة عنصر
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ بطاقة عنصر تعلّم (+ الكتاب المرتبط إن وُجد) ═══════════════════════ */

function ItemCard({
  item, index, total, courseAssessments, onMove, onReload,
}: {
  item: AdminItem; index: number; total: number; courseAssessments: AdminAssessment[];
  onMove: (dir: -1 | 1) => void; onReload: () => void;
}) {
  const { showSuccess, showError } = useAdminShell();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<AdminItem>>(item);
  const [saving, setSaving] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  const saveItem = async () => {
    if (!form.title?.trim()) return showError("عنوان العنصر مطلوب");
    if (!form.session_estimate || form.session_estimate <= 0) return showError("عدد الجلسات المقدَّر يجب أن يكون أكبر من صفر");
    setSaving(true);
    const { error } = await adminUpsertItem(form);
    setSaving(false);
    if (error) return showError(error.message);
    showSuccess("تم حفظ العنصر");
    setOpen(false);
    onReload();
  };

  const deleteItem = async () => {
    if (!confirm(`حذف عنصر «${item.title}»؟`)) return;
    const { error } = await adminDeleteItem(item.id);
    if (error) return showError(error.message);
    onReload();
  };

  return (
    <div className="adm-item-card">
      <div className="adm-section-hdr">
        <div style={{ flex: 1 }}>
          <span className="adm-type-badge">{ITEM_TYPE_LABEL[item.item_type]}</span>{" "}
          <strong>{item.title}</strong>{" "}
          <StatusBadge status={item.status} />{" "}
          {!item.is_approved && <StatusBadge status="pending" label="بحاجة مراجعة علمية" />}
          {!item.is_required && <span className="adm-type-badge">اختياري</span>}
          <span className="adm-type-badge">{item.session_estimate} جلسة · وزن {item.weight}</span>
        </div>
        <div className="adm-item-actions">
          <button type="button" className="adm-btn-sm" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={13} /></button>
          <button type="button" className="adm-btn-sm" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown size={13} /></button>
          {item.item_type === "book" && (
            <button type="button" className="adm-btn-sm" onClick={() => setBookOpen((v) => !v)}>الكتاب</button>
          )}
          <button type="button" className="adm-btn-sm" onClick={() => { setForm(item); setOpen(true); }}><Pencil size={13} /> تعديل</button>
          <button type="button" className="adm-btn-del" onClick={deleteItem}><Trash2 size={13} /> حذف</button>
        </div>
      </div>

      {bookOpen && <BookEditor learningItemId={item.id} />}

      <AdminModal open={open} onClose={() => setOpen(false)} title="بيانات عنصر التعلّم" onSave={saveItem} saving={saving}>
        <Field label="العنوان"><input className="adm-input" value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
        <Field label="الوصف"><textarea className="adm-textarea" rows={2} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <FieldRow>
          <Field label="النوع">
            <select className="adm-select" value={form.item_type ?? "lesson"} onChange={(e) => setForm((f) => ({ ...f, item_type: e.target.value as AdminItem["item_type"] }))}>
              {Object.entries(ITEM_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="طريقة الإنجاز">
            <select className="adm-select" value={form.completion_method ?? "manual_confirm"} onChange={(e) => setForm((f) => ({ ...f, completion_method: e.target.value as AdminItem["completion_method"] }))}>
              {Object.entries(COMPLETION_METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </FieldRow>

        {form.item_type === "assessment" && (
          <Field label="الاختبار المرتبط">
            <select className="adm-select" value={form.assessment_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, assessment_id: e.target.value || null }))}>
              <option value="">— بلا اختبار (أنشئ تقييم المقرر أولًا) —</option>
              {courseAssessments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </Field>
        )}

        {(form.completion_method === "watch_percent" || form.completion_method === "read_scroll") && (
          <Field label="نسبة الإنجاز المطلوبة % (مثال: 80)">
            <input className="adm-input" type="number" min={1} max={100} value={form.completion_threshold ?? 80} onChange={(e) => setForm((f) => ({ ...f, completion_threshold: Number(e.target.value) }))} />
          </Field>
        )}

        <FieldRow>
          <Field label="عدد الجلسات المقدَّر">
            <input className="adm-input" type="number" min={0.5} step={0.5} value={form.session_estimate ?? 1} onChange={(e) => setForm((f) => ({ ...f, session_estimate: Number(e.target.value) }))} />
          </Field>
          <Field label="دقائق تقديرية (اختياري)">
            <input className="adm-input" type="number" min={1} value={form.minutes_estimate ?? ""} onChange={(e) => setForm((f) => ({ ...f, minutes_estimate: e.target.value ? Number(e.target.value) : null }))} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="الوزن في حساب نسبة الإنجاز">
            <input className="adm-input" type="number" min={0} step={0.5} value={form.weight ?? 1} onChange={(e) => setForm((f) => ({ ...f, weight: Number(e.target.value) }))} />
          </Field>
          <Field label="إلزامي لاجتياز المقرر؟">
            <select className="adm-select" value={form.is_required === false ? "no" : "yes"} onChange={(e) => setForm((f) => ({ ...f, is_required: e.target.value === "yes" }))}>
              <option value="yes">نعم، إلزامي</option>
              <option value="no">لا، اختياري (لا يؤثر على الاجتياز)</option>
            </select>
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label="مرجع محتوى — الجدول (اختياري)">
            <select className="adm-select" value={form.content_ref_table ?? ""} onChange={(e) => setForm((f) => ({ ...f, content_ref_table: (e.target.value || null) as AdminItem["content_ref_table"] }))}>
              <option value="">بلا مرجع</option>
              <option value="lessons">دروس (lessons)</option>
              <option value="library_items">مكتبة (library_items)</option>
            </select>
          </Field>
          <Field label="معرّف السجل (UUID)">
            <input className="adm-input" dir="ltr" value={form.content_ref_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, content_ref_id: e.target.value || null }))} />
          </Field>
        </FieldRow>
        <Field label="رابط خارجي (اختياري)">
          <input className="adm-input" dir="ltr" value={form.external_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value || null }))} />
        </Field>

        <FieldRow>
          <Field label="الحالة">
            <select className="adm-select" value={form.status ?? "draft"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AdminItem["status"] }))}>
              <option value="draft">مسودة</option>
              <option value="needs_review">يحتاج مراجعة</option>
              <option value="published">منشور</option>
              <option value="archived">مؤرشف</option>
            </select>
          </Field>
          <Field label="مُراجَع علميًا؟">
            <select className="adm-select" value={form.is_approved === false ? "no" : "yes"} onChange={(e) => setForm((f) => ({ ...f, is_approved: e.target.value === "yes" }))}>
              <option value="yes">نعم</option>
              <option value="no">لا — بحاجة مراجعة</option>
            </select>
          </Field>
        </FieldRow>
      </AdminModal>
    </div>
  );
}

/* ═══ محرّر الكتاب المرتبط بعنصر من نوع "كتاب" ══════════════════════════ */

const MATERIAL_ROLES: AdminBook["material_role"][] = [
  "أساسية إلزامية", "شرح أساسي", "مادة مساندة", "قراءة إثرائية", "مرجع متقدم", "اختيارية",
];

function BookEditor({ learningItemId }: { learningItemId: string }) {
  const { showSuccess, showError } = useAdminShell();
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<AdminBook>>({ material_role: "أساسية إلزامية" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await adminFetchBooks(learningItemId);
    setBooks(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [learningItemId]);

  const save = async () => {
    if (!form.book_title?.trim()) return showError("عنوان الكتاب مطلوب");
    setSaving(true);
    const { error } = await adminUpsertBook({ ...form, learning_item_id: learningItemId });
    setSaving(false);
    if (error) return showError(error.message);
    showSuccess("تم حفظ بيانات الكتاب");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف بيانات هذا الكتاب؟")) return;
    const { error } = await adminDeleteBook(id);
    if (error) return showError(error.message);
    load();
  };

  return (
    <div style={{ paddingInlineStart: "1.25rem", marginBlockEnd: "0.5rem" }}>
      {loading ? <p className="adm-empty-msg">جاري التحميل…</p> : (
        <>
          {books.map((b) => (
            <div key={b.id} className="adm-item-card">
              <div className="adm-section-hdr">
                <div>
                  <strong>{b.book_title}</strong>{b.book_author ? ` — ${b.book_author}` : ""}{" "}
                  <span className="adm-type-badge">{b.material_role}</span>
                </div>
                <div className="adm-item-actions">
                  <button type="button" className="adm-btn-sm" onClick={() => { setForm(b); setOpen(true); }}><Pencil size={13} /> تعديل</button>
                  <button type="button" className="adm-btn-del" onClick={() => remove(b.id)}><Trash2 size={13} /> حذف</button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="adm-btn-add" onClick={() => { setForm({ material_role: "أساسية إلزامية" }); setOpen(true); }}>
            <Plus size={14} /> إضافة بيانات كتاب
          </button>
        </>
      )}

      <AdminModal open={open} onClose={() => setOpen(false)} title="بيانات الكتاب" onSave={save} saving={saving}>
        <Field label="عنوان الكتاب"><input className="adm-input" value={form.book_title ?? ""} onChange={(e) => setForm((f) => ({ ...f, book_title: e.target.value }))} /></Field>
        <Field label="المؤلف"><input className="adm-input" value={form.book_author ?? ""} onChange={(e) => setForm((f) => ({ ...f, book_author: e.target.value }))} /></Field>
        <Field label="دور المادة">
          <select className="adm-select" value={form.material_role ?? "أساسية إلزامية"} onChange={(e) => setForm((f) => ({ ...f, material_role: e.target.value as AdminBook["material_role"] }))}>
            {MATERIAL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="نطاق الدراسة (أي أجزاء من الكتاب)"><textarea className="adm-textarea" rows={2} value={form.scope_description ?? ""} onChange={(e) => setForm((f) => ({ ...f, scope_description: e.target.value }))} /></Field>
        <Field label="سبب الإدراج"><textarea className="adm-textarea" rows={2} value={form.inclusion_reason ?? ""} onChange={(e) => setForm((f) => ({ ...f, inclusion_reason: e.target.value }))} /></Field>
        <FieldRow>
          <Field label="اسم المصدر"><input className="adm-input" value={form.source_name ?? ""} onChange={(e) => setForm((f) => ({ ...f, source_name: e.target.value }))} /></Field>
          <Field label="رابط المصدر"><input className="adm-input" dir="ltr" value={form.source_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))} /></Field>
        </FieldRow>
        <Field label="ملاحظة الترخيص"><input className="adm-input" value={form.license_note ?? ""} onChange={(e) => setForm((f) => ({ ...f, license_note: e.target.value }))} /></Field>
      </AdminModal>
    </div>
  );
}

/* ═══ الجذر: كل مراحل مسار واحد ══════════════════════════════════════════ */

export function LearningPathTreeEditor({ pathId }: { pathId: string }) {
  const { showError } = useAdminShell();
  const [stages, setStages] = useState<AdminStage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await adminFetchStages(pathId);
    setStages(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [pathId]);

  if (loading) return <p className="adm-empty-msg">جاري تحميل مراحل المسار…</p>;

  const sorted = [...stages].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      {sorted.length === 0 && <p className="adm-empty-msg">لا مراحل بعد في هذا المسار.</p>}
      {sorted.map((s, i, arr) => (
        <StageCard
          key={s.id}
          stage={s}
          pathId={pathId}
          index={i}
          total={arr.length}
          onMove={async (dir) => {
            const other = arr[i + dir];
            if (!other) return;
            const { error } = await adminSwapSortOrder("path_stages", s, other);
            if (error) return showError(error.message);
            load();
          }}
          onReload={load}
        />
      ))}
      <button
        type="button"
        className="adm-btn-add"
        onClick={async () => {
          const title = prompt("عنوان المرحلة الجديدة؟");
          if (!title?.trim()) return;
          const { error } = await adminUpsertStage({
            path_id: pathId,
            title: title.trim(),
            slug: slugify(title),
            sort_order: stages.length,
            status: "draft",
          });
          if (error) return showError(error.message);
          load();
        }}
      >
        <Plus size={14} /> إضافة مرحلة
      </button>
    </div>
  );
}
