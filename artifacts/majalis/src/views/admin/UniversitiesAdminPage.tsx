import { useCallback, useEffect, useState } from "react";
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

/* ── نموذج الجامعة ─────────────────────────────────────────────────────── */
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
    if (form.id) return; // لا تغيّر الـ slug عند التعديل
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
    await onSave(form);
    setLoading(false);
  }

  const inputCls = "w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  return (
    <form dir="rtl" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>الاسم بالعربية *</label>
          <input className={inputCls} required value={form.name_ar || ""} onChange={(e) => { set("name_ar", e.target.value); autoSlug(e.target.value); }} />
        </div>
        <div>
          <label className={labelCls}>الاسم بالإنجليزية</label>
          <input className={inputCls} value={form.name_en || ""} onChange={(e) => set("name_en", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Slug (رابط) *</label>
          <input className={inputCls} required value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} dir="ltr" />
        </div>
        <div>
          <label className={labelCls}>الدولة *</label>
          <input className={inputCls} required value={form.country || ""} onChange={(e) => set("country", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>المدينة</label>
          <input className={inputCls} value={form.city || ""} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>رابط الشعار (logo_url)</label>
          <input className={inputCls} dir="ltr" value={form.logo_url || ""} onChange={(e) => set("logo_url", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>الموقع الرسمي</label>
          <input className={inputCls} dir="ltr" value={form.website_url || ""} onChange={(e) => set("website_url", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>حالة الاعتماد</label>
          <select className={inputCls} value={form.accreditation_status || "unknown"} onChange={(e) => set("accreditation_status", e.target.value as AccreditationStatus)}>
            {Object.entries(ACCREDITATION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>نبذة عن الجامعة</label>
        <textarea className={inputCls} rows={4} value={form.about || ""} onChange={(e) => set("about", e.target.value)} />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-emerald-600" checked={!!form.is_verified} onChange={(e) => set("is_verified", e.target.checked)} />
          <span className="text-sm text-gray-700 dark:text-gray-200">موثقة</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-emerald-600" checked={!!form.is_published} onChange={(e) => set("is_published", e.target.checked)} />
          <span className="text-sm text-gray-700 dark:text-gray-200">منشورة</span>
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors">
          {loading ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-xl hover:bg-gray-200 transition-colors">
          إلغاء
        </button>
      </div>
    </form>
  );
}

/* ── نموذج البرنامج ─────────────────────────────────────────────────────── */
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
  const inputCls = "w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSave({ ...form, university_id: universityId });
    setLoading(false);
  }

  return (
    <form dir="rtl" onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
      <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">إضافة برنامج جديد</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>اسم البرنامج *</label>
          <input className={inputCls} required value={form.program_name || ""} onChange={(e) => set("program_name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>الكلية / القسم</label>
          <input className={inputCls} value={form.faculty_department || ""} onChange={(e) => set("faculty_department", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>التخصص</label>
          <input className={inputCls} value={form.specialization || ""} onChange={(e) => set("specialization", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>الدرجة العلمية *</label>
          <select className={inputCls} value={form.degree_level || "بكالوريوس"} onChange={(e) => set("degree_level", e.target.value as DegreeLevel)}>
            {DEGREE_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>لغة الدراسة</label>
          <select className={inputCls} value={form.study_language || "العربية"} onChange={(e) => set("study_language", e.target.value)}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>نظام الدراسة</label>
          <select className={inputCls} value={form.study_mode || "حضوري"} onChange={(e) => set("study_mode", e.target.value as StudyMode)}>
            {STUDY_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>المدة</label>
          <input className={inputCls} placeholder="مثال: 4 سنوات" value={form.duration || ""} onChange={(e) => set("duration", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input type="checkbox" className="accent-emerald-600" checked={!!form.has_scholarship} onChange={(e) => set("has_scholarship", e.target.checked)} />
            <span className="text-sm text-gray-700 dark:text-gray-200">يوجد منح دراسية</span>
          </label>
          {form.has_scholarship && (
            <textarea className={inputCls} rows={2} placeholder="تفاصيل المنحة…" value={form.scholarship_details || ""} onChange={(e) => set("scholarship_details", e.target.value)} />
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl disabled:opacity-50 transition-colors">
          {loading ? "جارٍ الحفظ…" : "إضافة البرنامج"}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">إلغاء</button>
      </div>
    </form>
  );
}

/* ── محتوى الإدارة ─────────────────────────────────────────────────────── */
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
    const items = await adminFetchUniversities();
    setUniversities(items);
    setLoading(false);
  }, []);

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
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {(["list","add","reminders"] as Section[]).map((s) => (
          <button key={s} type="button" onClick={() => { setSection(s); setEditTarget(null); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              section === s
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            {s === "list" ? "قائمة الجامعات" : s === "add" ? "+ إضافة جامعة" : `🔔 التذكيرات (${reminders.length})`}
          </button>
        ))}
      </div>

      {/* قائمة الجامعات */}
      {(section === "list" || section === "edit") && (
        <div className="space-y-4">
          {section === "edit" && editTarget && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">تعديل: {editTarget.name_ar}</h3>
              <UniversityForm initial={editTarget} onSave={handleUpdate} onCancel={() => { setSection("list"); setEditTarget(null); }} />
            </div>
          )}

          {loading && <div className="text-center py-10 text-gray-400">جارٍ التحميل…</div>}

          {!loading && universities.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p>لا توجد جامعات بعد.</p>
              <button type="button" onClick={() => setSection("add")}
                className="mt-3 text-sm text-emerald-600 hover:underline">+ إضافة جامعة</button>
            </div>
          )}

          {!loading && universities.map((u) => (
            <div key={u.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{u.name_ar}</p>
                    {u.is_verified && <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">✓ موثقة</span>}
                    {!u.is_published && <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded">غير منشورة</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{u.country}{u.city ? ` — ${u.city}` : ""} | {u.university_programs?.length || 0} برنامج</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600">آخر تحديث: {new Date(u.last_updated_at).toLocaleDateString("ar-SA")}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Link href={`/universities/${u.slug}`} className="px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">عرض</Link>
                  <button type="button" onClick={() => { setEditTarget(u); setSection("edit"); }}
                    className="px-2.5 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition-colors">
                    تعديل
                  </button>
                </div>
              </div>

              {/* برامج */}
              {u.university_programs && u.university_programs.length > 0 && (
                <div className="space-y-1 pr-2 border-r border-gray-100 dark:border-gray-700">
                  {u.university_programs.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="text-emerald-500">•</span>
                      <span>{p.program_name}</span>
                      <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{p.degree_level}</span>
                      {!p.is_active && <span className="text-red-400">(غير نشط)</span>}
                    </div>
                  ))}
                </div>
              )}

              {showProgForm === u.id ? (
                <ProgramForm universityId={u.id} onSave={(d) => handleAddProgram(u.id, d)} onCancel={() => setShowProgForm(null)} />
              ) : (
                <button type="button" onClick={() => setShowProgForm(u.id)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                  + إضافة برنامج
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* نموذج إضافة */}
      {section === "add" && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">إضافة جامعة جديدة</h3>
          <UniversityForm onSave={handleCreate} onCancel={() => setSection("list")} />
        </div>
      )}

      {/* التذكيرات */}
      {section === "reminders" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            هذه تذكيرات للمراجعة البشرية — لا يُحدَّث أي محتوى تلقائياً.
          </p>
          {reminders.length === 0 && (
            <div className="text-center py-10 text-gray-400">لا توجد تذكيرات معلّقة. ✅</div>
          )}
          {reminders.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className={`text-lg flex-shrink-0 ${r.reminder_type === "annual_check" ? "🔄" : r.reminder_type === "deadline_approaching" ? "⏰" : "⚠️"}`}>
                  {r.reminder_type === "annual_check" ? "🔄" : r.reminder_type === "deadline_approaching" ? "⏰" : "⚠️"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                    {r.universities?.name_ar || "جامعة غير معروفة"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.notes}</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">
                    موعد المراجعة: {new Date(r.due_date).toLocaleDateString("ar-SA")}
                  </p>
                  {r.universities?.website_url && (
                    <a href={r.universities.website_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1 block">
                      🌐 فتح الموقع الرسمي للمراجعة ↗
                    </a>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button type="button" onClick={() => handleReminderStatus(r.id, "reviewed")}
                    className="px-2.5 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition-colors">
                    تمت المراجعة
                  </button>
                  <button type="button" onClick={() => handleReminderStatus(r.id, "dismissed")}
                    className="px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
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

export default function UniversitiesAdminPage() {
  return (
    <AdminShell section="universities" onSectionChange={() => {}}>
      <AdminContent />
    </AdminShell>
  );
}
