import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bell, Clock, Globe, RotateCw } from "lucide-react";
import { Link } from "wouter";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";
import {
  adminFetchUniversities,
  adminCreateUniversity,
  adminUpdateUniversity,
  adminAddProgram,
  adminFetchReminders,
  adminUpdateReminder,
  DEGREE_LEVELS,
  STUDY_MODES,
  LANGUAGES,
  ACCREDITATION_LABELS,
  type University,
  type ReviewReminder,
  type UniversityProgram,
  type DegreeLevel,
  type StudyMode,
  type AccreditationStatus,
  type ReminderStatus,
} from "@/lib/universities-service";

type Section = "list" | "add" | "edit" | "reminders";

function UniversityForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<University>;
  onSave: (data: Partial<University>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<University>>({
    name_ar: "", name_en: "", slug: "", country: "", city: "",
    about: "", website_url: "", logo_url: "",
    accreditation_status: "unknown", is_verified: false, is_published: true,
    ...initial,
  });
  const [loading, setLoading] = useState(false);

  function set(k: keyof University, v: unknown) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function autoSlug(nameAr: string) {
    if (form.id) return;
    const slug = nameAr.trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
      .slice(0, 60);
    set("slug", slug);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
    } catch (err) {
      console.error("فشل حفظ الجامعة:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form dir="rtl" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="uap-label">الاسم بالعربية *</label>
          <input className="uap-input" required value={form.name_ar || ""} onChange={(e) => { set("name_ar", e.target.value); autoSlug(e.target.value); }} />
        </div>
        <div>
          <label className="uap-label">الاسم بالإنجليزية</label>
          <input className="uap-input" value={form.name_en || ""} onChange={(e) => set("name_en", e.target.value)} />
        </div>
        <div>
          <label className="uap-label">Slug (رابط) *</label>
          <input className="uap-input" required value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} dir="ltr" />
        </div>
        <div>
          <label className="uap-label">الدولة *</label>
          <input className="uap-input" required value={form.country || ""} onChange={(e) => set("country", e.target.value)} />
        </div>
        <div>
          <label className="uap-label">المدينة</label>
          <input className="uap-input" value={form.city || ""} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <label className="uap-label">رابط الشعار (logo_url)</label>
          <input className="uap-input" dir="ltr" value={form.logo_url || ""} onChange={(e) => set("logo_url", e.target.value)} />
        </div>
        <div>
          <label className="uap-label">الموقع الرسمي</label>
          <input className="uap-input" dir="ltr" value={form.website_url || ""} onChange={(e) => set("website_url", e.target.value)} />
        </div>
        <div>
          <label className="uap-label">حالة الاعتماد</label>
          <select className="uap-input" value={form.accreditation_status || "unknown"} onChange={(e) => set("accreditation_status", e.target.value as AccreditationStatus)}>
            {Object.entries(ACCREDITATION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="uap-label">نبذة عن الجامعة</label>
        <textarea className="uap-input" rows={4} value={form.about || ""} onChange={(e) => set("about", e.target.value)} />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-emerald-600" checked={!!form.is_verified} onChange={(e) => set("is_verified", e.target.checked)} />
          <span className="uap-check-label">موثقة</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-emerald-600" checked={!!form.is_published} onChange={(e) => set("is_published", e.target.checked)} />
          <span className="uap-check-label">منشورة</span>
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="uap-save-btn">
          {loading ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        <button type="button" onClick={onCancel} className="uap-cancel-btn">إلغاء</button>
      </div>
    </form>
  );
}

function ProgramForm({
  universityId,
  onSave,
  onCancel,
}: {
  universityId: string;
  onSave: (p: Partial<UniversityProgram>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<UniversityProgram>>({
    program_name: "", faculty_department: "", specialization: "",
    degree_level: "بكالوريوس", study_language: "العربية", study_mode: "حضوري",
    duration: "", has_scholarship: false, scholarship_details: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof UniversityProgram, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ ...form, university_id: universityId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form dir="rtl" onSubmit={handleSubmit} className="uap-prog-form-box space-y-3">
      <h4 className="uap-form-title">إضافة برنامج جديد</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="uap-label">اسم البرنامج *</label>
          <input className="uap-input" required value={form.program_name || ""} onChange={(e) => set("program_name", e.target.value)} />
        </div>
        <div>
          <label className="uap-label">الكلية / القسم</label>
          <input className="uap-input" value={form.faculty_department || ""} onChange={(e) => set("faculty_department", e.target.value)} />
        </div>
        <div>
          <label className="uap-label">التخصص</label>
          <input className="uap-input" value={form.specialization || ""} onChange={(e) => set("specialization", e.target.value)} />
        </div>
        <div>
          <label className="uap-label">الدرجة العلمية *</label>
          <select className="uap-input" value={form.degree_level || "بكالوريوس"} onChange={(e) => set("degree_level", e.target.value as DegreeLevel)}>
            {DEGREE_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="uap-label">لغة الدراسة</label>
          <select className="uap-input" value={form.study_language || "العربية"} onChange={(e) => set("study_language", e.target.value)}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="uap-label">نظام الدراسة</label>
          <select className="uap-input" value={form.study_mode || "حضوري"} onChange={(e) => set("study_mode", e.target.value as StudyMode)}>
            {STUDY_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="uap-label">المدة</label>
          <input className="uap-input" placeholder="مثال: 4 سنوات" value={form.duration || ""} onChange={(e) => set("duration", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input type="checkbox" className="accent-emerald-600" checked={!!form.has_scholarship} onChange={(e) => set("has_scholarship", e.target.checked)} />
            <span className="uap-check-label">يوجد منح دراسية</span>
          </label>
          {form.has_scholarship && (
            <textarea className="uap-input" rows={2} placeholder="تفاصيل المنحة…" value={form.scholarship_details || ""} onChange={(e) => set("scholarship_details", e.target.value)} />
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="uap-save-btn">
          {loading ? "جارٍ الحفظ…" : "إضافة البرنامج"}
        </button>
        <button type="button" onClick={onCancel} className="uap-text-cancel">إلغاء</button>
      </div>
    </form>
  );
}

function AdminContent() {
  const { showSuccess, showError } = useAdminShell();
  const [section, setSection]           = useState<Section>("list");
  const [universities, setUniversities] = useState<University[]>([]);
  const [reminders, setReminders]       = useState<ReviewReminder[]>([]);
  const [loading, setLoading]           = useState(true);
  const [editTarget, setEditTarget]     = useState<University | null>(null);
  const [showProgForm, setShowProgForm] = useState<string | null>(null);

  const loadUniversities = useCallback(async () => {
    setLoading(true);
    try {
      const items = await adminFetchUniversities();
      setUniversities(items ?? []);
    } catch {
      showError("تعذّر تحميل قائمة الجامعات.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const loadReminders = useCallback(async () => {
    const items = await adminFetchReminders();
    setReminders(items);
  }, []);

  useEffect(() => {
    if (section === "list" || section === "edit" || section === "add") loadUniversities();
    if (section === "reminders") loadReminders();
  }, [section, loadUniversities, loadReminders]);

  async function handleCreate(data: Partial<University>) {
    const u = await adminCreateUniversity(data);
    if (u) { showSuccess("تم إنشاء الجامعة بنجاح"); setSection("list"); }
    else showError("فشل إنشاء الجامعة");
  }

  async function handleUpdate(data: Partial<University>) {
    if (!editTarget) return;
    const u = await adminUpdateUniversity(editTarget.id, data);
    if (u) { showSuccess("تم التحديث بنجاح"); setSection("list"); setEditTarget(null); }
    else showError("فشل التحديث");
  }

  async function handleAddProgram(universityId: string, data: Partial<UniversityProgram>) {
    const p = await adminAddProgram(universityId, data);
    if (p) { showSuccess("تم إضافة البرنامج"); setShowProgForm(null); loadUniversities(); }
    else showError("فشل إضافة البرنامج");
  }

  async function handleReminderStatus(id: string, status: ReminderStatus) {
    const ok = await adminUpdateReminder(id, status);
    if (ok) { showSuccess("تم تحديث التذكير"); loadReminders(); }
    else showError("فشل تحديث التذكير");
  }

  return (
    <div dir="rtl" className="space-y-6 max-w-4xl mx-auto">
      {/* Subnav */}
      <div className="uap-subnav">
        {(["list","add","reminders"] as Section[]).map((s) => (
          <button key={s} type="button" onClick={() => { setSection(s); setEditTarget(null); }}
            className={`uap-tab${section === s ? " uap-tab--active" : ""}`}>
            {s === "list" ? "قائمة الجامعات" : s === "add" ? "+ إضافة جامعة" : <><Bell size={13} className="inline ml-1" />التذكيرات ({reminders.length})</>}
          </button>
        ))}
      </div>

      {/* قائمة الجامعات */}
      {(section === "list" || section === "edit") && (
        <div className="space-y-4">
          {section === "edit" && editTarget && (
            <div className="uap-form-box">
              <h3 className="uap-box-title">تعديل: {editTarget.name_ar}</h3>
              <UniversityForm initial={editTarget} onSave={handleUpdate} onCancel={() => { setSection("list"); setEditTarget(null); }} />
            </div>
          )}

          {loading && <div className="uap-empty">جارٍ التحميل…</div>}

          {!loading && universities.length === 0 && (
            <div className="uap-empty">
              <p>لا توجد جامعات بعد.</p>
              <button type="button" onClick={() => setSection("add")} className="uap-add-link">+ إضافة جامعة</button>
            </div>
          )}

          {!loading && universities.map((u) => (
            <div key={u.id} className="uap-uni-card space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="uap-uni-name">{u.name_ar}</p>
                    {u.is_verified && <span className="uap-verified-badge">✓ موثقة</span>}
                    {!u.is_published && <span className="uap-unpublished-badge">غير منشورة</span>}
                  </div>
                  <p className="uap-uni-meta">{u.country}{u.city ? `، ${u.city}` : ""} | {u.university_programs?.length || 0} برنامج</p>
                  <p className="uap-uni-date">آخر تحديث: {new Date(u.last_updated_at).toLocaleDateString("ar-SA")}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Link href={`/universities/${u.slug}`} className="uap-view-btn">عرض</Link>
                  <button type="button" onClick={() => { setEditTarget(u); setSection("edit"); }} className="uap-edit-btn">
                    تعديل
                  </button>
                </div>
              </div>

              {u.university_programs && u.university_programs.length > 0 && (
                <div className="uap-progs-list space-y-1">
                  {u.university_programs.map((p) => (
                    <div key={p.id} className="uap-prog-item">
                      <span className="uap-prog-dot">•</span>
                      <span>{p.program_name}</span>
                      <span className="uap-deg-badge">{p.degree_level}</span>
                      {!p.is_active && <span className="icon-danger" style={{ opacity: .75 }}>(غير نشط)</span>}
                    </div>
                  ))}
                </div>
              )}

              {showProgForm === u.id ? (
                <ProgramForm universityId={u.id} onSave={(d) => handleAddProgram(u.id, d)} onCancel={() => setShowProgForm(null)} />
              ) : (
                <button type="button" onClick={() => setShowProgForm(u.id)} className="uap-add-prog-btn">
                  + إضافة برنامج
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* نموذج إضافة */}
      {section === "add" && (
        <div className="uap-form-box">
          <h3 className="uap-box-title">إضافة جامعة جديدة</h3>
          <UniversityForm onSave={handleCreate} onCancel={() => setSection("list")} />
        </div>
      )}

      {/* التذكيرات */}
      {section === "reminders" && (
        <div className="space-y-3">
          <p className="uap-note">
            هذه تذكيرات للمراجعة البشرية، لا يُحدَّث أي محتوى تلقائياً.
          </p>
          {reminders.length === 0 && (
            <div className="uap-empty">لا توجد تذكيرات معلّقة. ✅</div>
          )}
          {reminders.map((r) => (
            <div key={r.id} className="uap-reminder-card">
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">
                  {r.reminder_type === "annual_check" ? <RotateCw size={16} /> : r.reminder_type === "deadline_approaching" ? <Clock size={16} /> : <AlertTriangle size={16} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="uap-reminder-title">{r.universities?.name_ar || "جامعة غير معروفة"}</p>
                  <p className="uap-uni-meta">{r.notes}</p>
                  <p className="uap-uni-date">موعد المراجعة: {new Date(r.due_date).toLocaleDateString("ar-SA")}</p>
                  {r.universities?.website_url && (
                    <a href={r.universities.website_url} target="_blank" rel="noopener noreferrer" className="uap-reminder-link">
                      <Globe size={12} className="inline ml-1" />فتح الموقع الرسمي للمراجعة ↗
                    </a>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button type="button" onClick={() => handleReminderStatus(r.id, "reviewed")} className="uap-edit-btn">
                    تمت المراجعة
                  </button>
                  <button type="button" onClick={() => handleReminderStatus(r.id, "dismissed")} className="uap-view-btn">
                    تجاهل
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { AdminContent as UniversitiesSection };

export default function UniversitiesAdminPage() {
  return (
    <AdminShell section="universities" onSectionChange={() => {}}>
      <AdminContent />
    </AdminShell>
  );
}
