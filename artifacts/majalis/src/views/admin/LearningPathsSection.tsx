import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Settings, RefreshCw, ArrowRight } from "lucide-react";
import { AdminModal, Field, FieldRow } from "@/views/admin/AdminModal";
import { AdminSectionToolbar } from "@/views/admin/AdminSectionToolbar";
import { StatusBadge } from "@/views/admin/AdminUI";
import { useAdminShell } from "@/views/admin/AdminShell";
import { SkeletonCardGrid } from "@/components/ui-common";
import { LearningPathTreeEditor } from "@/views/admin/learning-paths/LearningPathTreeEditor";
import {
  adminFetchPaths, adminUpsertPath, adminDeletePath, adminRecomputePathTotalSessions,
  adminValidatePathForPublish, type AdminPath,
} from "@/lib/learning-paths-admin-service";

const EMPTY_PATH: Partial<AdminPath> = {
  slug: "", title: "", title_en: "", description: "", level: "beginner",
  category: "", icon: "", sort_order: 0, status: "draft", total_sessions: 0, what_you_learn: [],
};

function slugify(text: string): string {
  return text.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function LearningPathsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [paths, setPaths] = useState<AdminPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<AdminPath>>(EMPTY_PATH);
  const [saving, setSaving] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [whatYouLearnText, setWhatYouLearnText] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await adminFetchPaths();
    setPaths(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const savePath = async () => {
    if (!form.title?.trim()) return showError("عنوان المسار مطلوب");
    if (form.status === "published" && form.id) {
      const check = await adminValidatePathForPublish(form.id);
      if (!check.ok) return showError("تعذّر النشر: " + check.errors.join(" — "));
    }
    setSaving(true);
    const { error } = await adminUpsertPath({
      ...form,
      slug: form.slug?.trim() || slugify(form.title),
      what_you_learn: whatYouLearnText.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    setSaving(false);
    if (error) return showError(error.message);
    showSuccess("تم حفظ المسار");
    setOpen(false);
    load();
  };

  const deletePath = async (p: AdminPath) => {
    if (!confirm(`حذف مسار «${p.title}» بكل مراحله ومقرراته؟ لا يمكن التراجع.`)) return;
    const { error } = await adminDeletePath(p.id);
    if (error) return showError(error.message);
    showSuccess("تم الحذف");
    load();
  };

  const recompute = async (p: AdminPath) => {
    const { total, error } = await adminRecomputePathTotalSessions(p.id);
    if (error) return showError(error.message);
    showSuccess(`أُعيد احتساب إجمالي الجلسات: ${total}`);
    load();
  };

  const filtered = paths.filter((p) => !search.trim() || p.title.includes(search) || p.slug.includes(search));

  if (selectedPathId) {
    const p = paths.find((x) => x.id === selectedPathId);
    return (
      <div>
        <button type="button" className="adm-btn-sm" onClick={() => setSelectedPathId(null)}>
          <ArrowRight size={13} /> رجوع لقائمة المسارات
        </button>
        <h2 className="adm-section-h2">{p?.title}</h2>
        <LearningPathTreeEditor pathId={selectedPathId} />
      </div>
    );
  }

  return (
    <div>
      <AdminSectionToolbar
        title="المسارات العلمية"
        count={filtered.length}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث بالعنوان أو المعرّف…"
        actions={
          <button type="button" className="adm-btn-add" onClick={() => { setForm({ ...EMPTY_PATH }); setWhatYouLearnText(""); setOpen(true); }}>
            <Plus size={14} /> إضافة مسار
          </button>
        }
      />

      {loading ? <SkeletonCardGrid count={4} /> : (
        <>
          {filtered.length === 0 && <p className="adm-empty-msg">لا مسارات مطابقة.</p>}
          {filtered
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((p) => (
              <div key={p.id} className="adm-item-card">
                <div className="adm-section-hdr">
                  <div>
                    <strong>{p.title}</strong> <StatusBadge status={p.status} />{" "}
                    <span className="adm-type-badge">{p.level}</span>{" "}
                    <span className="adm-type-badge">{p.total_sessions} جلسة</span>
                  </div>
                  <div className="adm-item-actions">
                    <button type="button" className="adm-btn-sm" onClick={() => setSelectedPathId(p.id)}>
                      <Settings size={13} /> إدارة المحتوى
                    </button>
                    <button type="button" className="adm-btn-sm" onClick={() => recompute(p)} title="إعادة احتساب إجمالي الجلسات من العناصر الفعلية">
                      <RefreshCw size={13} />
                    </button>
                    <button
                      type="button"
                      className="adm-btn-sm"
                      onClick={() => { setForm(p); setWhatYouLearnText((p.what_you_learn ?? []).join("\n")); setOpen(true); }}
                    >
                      <Pencil size={13} /> تعديل
                    </button>
                    <button type="button" className="adm-btn-del" onClick={() => deletePath(p)}><Trash2 size={13} /> حذف</button>
                  </div>
                </div>
                {p.description && <p className="adm-empty-msg">{p.description}</p>}
              </div>
            ))}
        </>
      )}

      <AdminModal open={open} onClose={() => setOpen(false)} title="بيانات المسار العلمي" onSave={savePath} saving={saving}>
        <Field label="العنوان"><input className="adm-input" value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
        <Field label="المعرّف (slug) — يُشتقّ تلقائيًا إن تُرك فارغًا">
          <input className="adm-input" dir="ltr" value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
        </Field>
        <Field label="الوصف"><textarea className="adm-textarea" rows={3} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <Field label="ماذا ستتعلّم (نقطة في كل سطر)">
          <textarea className="adm-textarea" rows={4} value={whatYouLearnText} onChange={(e) => setWhatYouLearnText(e.target.value)} />
        </Field>
        <FieldRow>
          <Field label="المستوى">
            <select className="adm-select" value={form.level ?? "beginner"} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as AdminPath["level"] }))}>
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
          </Field>
          <Field label="التصنيف">
            <input className="adm-input" value={form.category ?? ""} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="أيقونة (اسم Lucide، اختياري)">
            <input className="adm-input" dir="ltr" value={form.icon ?? ""} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
          </Field>
          <Field label="ترتيب الظهور">
            <input className="adm-input" type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
          </Field>
        </FieldRow>
        <Field label="الحالة">
          <select className="adm-select" value={form.status ?? "draft"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AdminPath["status"] }))}>
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </Field>
        <p className="adm-empty-msg">
          النشر مقفل تلقائيًا إن لم يوجد مقرر منشور واحد على الأقل ضمن مراحل هذا المسار.
          إجمالي الجلسات يُحسَب من زر التحديث (↻) في القائمة، لا يُكتب يدويًا هنا.
        </p>
      </AdminModal>
    </div>
  );
}
