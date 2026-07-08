import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { adminGetAllLessons, adminUpsertLesson, adminDeleteLesson, adminGetSheikhs, upsertSeedLessonsToDb } from "@/lib/supabase";
import { parseTimeToMinutes } from "@/lib/lesson-time";
import { invalidateLessonsCache } from "@/lib/lessons-service";
import { sanitizeText } from "@/lib/sanitize";
import { GOVERNORATES } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { adminListLoad } from "@/lib/admin-list-load";
import { AdminModal, Field, FieldRow } from "./AdminModal";
import { BulkImport } from "./BulkImport";

const CATEGORIES = ["تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "أخرى"];
const VENUE_TYPES = ["مسجد", "مجلس", "ديوان", "مزرعة", "استراحة", "مركز", "جامعة", "أخرى"] as const;
const WEEK_DAYS   = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"] as const;

const TOPIC_HINT_RE = /^(فضل|حكم|أحكام|شرح|تفسير|أصول|أحاديث|السيرة|الفقه|العقيدة|كتاب|موضوع|بحث|أهمية|منهج|آداب|مسائل|فوائد|دروس|حقوق|واجبات|أساسيات)/u;

function looksLikeTopic(name: string): boolean {
  if (!name.trim()) return false;
  return TOPIC_HINT_RE.test(name.trim());
}

function parseVenueFromMosque(mosque: string): { type: string; name: string } {
  const raw = (mosque || "").trim();
  for (const t of VENUE_TYPES) {
    if (t !== "مسجد" && raw.startsWith(`${t} — `)) {
      return { type: t, name: raw.slice(t.length + 3) };
    }
  }
  return { type: "مسجد", name: raw };
}

const AUDIENCE = ["الكل", "رجال", "نساء", "أطفال"];
const DELIVERY = ["حضور فقط", "بث مباشر", "كلاهما"];
const STATUSES: Record<string, string> = { approved: "معتمد", pending: "معلّق", rejected: "مرفوض" };
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "#D1FAE5", text: "var(--majalis-emerald-deep)" },
  pending:  { bg: "rgba(14,110,82,0.08)", text: "#0E6E52" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
};
const EMPTY: any = {
  title: "",
  sheikh_id: "",
  speaker_name: "",
  venue_type: "مسجد",
  mosque: "",
  city: "العاصمة",
  region: "",
  category: "",
  audience: "الكل",
  delivery: "حضور فقط",
  schedule: "",
  days_of_week: [] as string[],
  lesson_time: "",
  description: "",
  end_date: "",
  status: "approved",
};

function toHHMM(raw: string): string {
  if (!raw?.trim()) return "";
  if (/^\d{1,2}:\d{2}$/.test(raw.trim())) {
    const [h, m] = raw.trim().split(":").map(Number);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const mins = parseTimeToMinutes(raw);
  if (mins == null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function LessonsSection() {
  const [items, setItems] = useState<any[]>([]);
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [syncMsg, setSyncMsg]     = useState<string | null>(null);
  const [origTime, setOrigTime]   = useState<string | null>(null);

  const load = () => {
    adminListLoad({
      label: "admin:lessons",
      setLoading,
      load: () => Promise.all([adminGetAllLessons(), adminGetSheikhs()]),
      onSuccess: ([{ data: l }, { data: s }]) => {
        setItems(l ?? []);
        setSheikhs(s ?? []);
      },
      onError: () => {
        setItems([]);
        setSheikhs([]);
      },
    });
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setOrigTime(null);
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const openEdit = (item: any) => {
    const rest = { ...item };
    delete rest.sheikhs;
    const rawTime = item.lesson_time || "";
    const hhmm = toHHMM(rawTime);
    const needsConversion = rawTime && !/^\d{1,2}:\d{2}$/.test(rawTime.trim());
    setOrigTime(needsConversion ? rawTime : null);
    const { type: venueType, name: venueName } = parseVenueFromMosque(item.mosque || "");
    const storedDays = (item.day_of_week || "").trim();
    const daysArr = storedDays ? storedDays.split("،").map((d: string) => d.trim()).filter(Boolean) : [];
    setForm({ ...EMPTY, ...rest, sheikh_id: item.sheikh_id || "", lesson_time: hhmm, venue_type: venueType, mosque: venueName, days_of_week: daysArr });
    setOpen(true);
  };
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل تريد حذف الدرس "${title}"؟`)) return;
    const { data, error } = await adminDeleteLesson(id);
    if (error) {
      alert(`تعذّر حذف الدرس: ${error.message || "خطأ غير معروف"}`);
      return;
    }
    if (!data || data.length === 0) {
      alert("لم يُحذف الدرس. تأكّد أنك مسجّل الدخول بحساب مشرف معتمد؛ إن استمرّت المشكلة فصلاحية الإشراف قد تكون غير مُفعّلة على مستوى قاعدة البيانات.");
      return;
    }
    invalidateLessonsCache();
    load();
  };
  const handleSave = async () => {
    if (!form.title?.trim()) {
      form.title = form.speaker_name?.trim()
        ? `درس الشيخ ${form.speaker_name.trim()}`
        : `درس — ${new Date().toLocaleDateString("ar-SA")}`;
    }
    setSaving(true);
    const venueName = (form.mosque || "").trim();
    const combinedMosque = form.venue_type && form.venue_type !== "مسجد" && venueName
      ? `${form.venue_type} — ${venueName}`
      : venueName;
    const dayOfWeek = Array.isArray(form.days_of_week) && form.days_of_week.length > 0
      ? form.days_of_week.join("،")
      : "";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { venue_type: _vt, days_of_week: _dw, ...rest } = form;
    const payload = {
      ...rest,
      title: sanitizeText(form.title, 500),
      speaker_name: sanitizeText(form.speaker_name, 200),
      description: sanitizeText(form.description, 8000),
      mosque: sanitizeText(combinedMosque, 400),
      region: sanitizeText(form.region, 400),
      schedule: sanitizeText(form.schedule, 300),
      sheikh_id: form.sheikh_id || null,
      day_of_week: dayOfWeek,
    };
    const { error } = await adminUpsertLesson(payload);
    setSaving(false);
    if (error) return alert("تعذّر الحفظ.");
    invalidateLessonsCache();
    setOpen(false);
    load();
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSyncSeed = async () => {
    if (!confirm("سيتم رفع جميع الدروس من الكتالوج الداخلي إلى قاعدة البيانات (upsert). متابعة؟")) return;
    setSyncing(true);
    setSyncMsg(null);
    const { ok, synced, error } = await upsertSeedLessonsToDb();
    setSyncing(false);
    if (ok) {
      setSyncMsg(`✓ تمت المزامنة — ${synced} درس`);
      invalidateLessonsCache();
      load();
    } else {
      setSyncMsg(`✗ فشل: ${error || "خطأ غير معروف"}`);
    }
  };

  const filtered = items.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    const q = search.trim();
    if (!q) return true;
    const hay = `${item.title} ${item.sheikhs?.name ?? ""} ${item.category ?? ""} ${item.city ?? ""} ${item.mosque ?? ""}`;
    return hay.includes(q);
  });

  return (
    <div>
      <div className="les-header">
        <h2 className="les-title">الدروس ({items.length})</h2>
        <div className="les-actions">
          <BulkImport
            title="استيراد الدروس"
            hint="يمكن ربط الشيخ باسمه عبر الحقل sheikh_name (يُطابَق تلقائيًا)."
            template={[{ title: "شرح كتاب التوحيد", sheikh_name: "الشيخ عبدالله الأنصاري", category: "عقيدة", city: "العاصمة", mosque: "مسجد الدعوة", audience: "الكل", delivery: "حضور فقط", schedule: "كل اثنين بعد العشاء", status: "approved" }]}
            importRow={(row) => {
              const { sheikh_name, ...rest } = row;
              let sheikh_id = row.sheikh_id || null;
              if (!sheikh_id && sheikh_name) {
                const m = sheikhs.find((s) => s.name === sheikh_name || s.name?.includes(sheikh_name));
                sheikh_id = m?.id || null;
              }
              return adminUpsertLesson({ audience: "الكل", delivery: "حضور فقط", status: "approved", ...rest, sheikh_id });
            }}
            onDone={() => {
              invalidateLessonsCache();
              load();
            }}
          />
          <Link href="/admin/sources" className="les-link-btn les-link-btn--green">أتمتة المصادر</Link>
          <Link href="/admin/review-center" className="les-link-btn les-link-btn--pink">مركز المراجعة</Link>
          <Link href="/admin/content-import/image" className="les-link-btn les-link-btn--blue">إضافة درس من صورة</Link>
          <Link href="/admin/content-import/url" className="les-link-btn les-link-btn--purple">إضافة درس من رابط</Link>
          <button onClick={handleSyncSeed} disabled={syncing} className="les-sync-btn">
            {syncing ? "جاري المزامنة…" : "⬆ مزامنة الكتالوج مع DB"}
          </button>
          <button onClick={openAdd} className="les-add-btn">+ إضافة درس</button>
        </div>
      </div>
      {syncMsg && (
        <div
          className="les-sync-msg"
          style={{
            "--les-msg-bg": syncMsg.startsWith("✓") ? "#D1FAE5" : "#FEE2E2",
            "--les-msg-color": syncMsg.startsWith("✓") ? "var(--majalis-emerald-deep)" : "#991B1B",
          } as React.CSSProperties}
        >
          {syncMsg}
        </div>
      )}
      <div className="les-filter-row">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في الدروس..." className="adm-input les-search" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="adm-select">
          <option value="all">كل الحالات</option>
          {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : (
        <div className="les-table-wrap">
          <table className="les-table">
            <thead>
              <tr className="les-thead-row">
                {["العنوان", "الشيخ", "التصنيف", "المحافظة", "الحضور", "الحالة", "إجراءات"].map(h => (
                  <th key={h} className="les-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const sc = STATUS_COLORS[item.status] || { bg: "var(--majalis-parchment-deep)", text: "var(--majalis-ink-soft)" };
                return (
                  <tr key={item.id} className="les-tr">
                    <td className="les-td les-td--name">{item.title}</td>
                    <td className="les-td les-td--nowrap">
                      {item.sheikhs?.name || (item.speaker_name ? (
                        <span>
                          {item.speaker_name}
                          {looksLikeTopic(item.speaker_name) && (
                            <span title="يبدو أن هذا موضوع وليس اسم شيخ" className="les-topic-warn"><AlertTriangle size={12} /></span>
                          )}
                        </span>
                      ) : "—")}
                    </td>
                    <td className="les-td">{item.category || "—"}</td>
                    <td className="les-td">{item.city || "—"}</td>
                    <td className="les-td les-td--nowrap">{item.delivery || "—"}</td>
                    <td className="les-td">
                      <span
                        className="les-status-badge"
                        style={{ "--les-status-bg": sc.bg, "--les-status-color": sc.text } as React.CSSProperties}
                      >
                        {STATUSES[item.status] || item.status}
                      </span>
                    </td>
                    <td className="les-td">
                      <div className="les-cell-actions">
                        <button onClick={() => openEdit(item)} className="les-btn-edit">تعديل</button>
                        <button onClick={() => handleDelete(item.id, item.title)} className="les-btn-del">حذف</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="les-empty">{search || statusFilter !== "all" ? "لا توجد دروس مطابقة" : "لا توجد دروس — ابدأ بإضافة أول درس"}</p>}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل الدرس" : "إضافة درس جديد"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="عنوان الدرس *">
          <input className="adm-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="عنوان الدرس أو الدورة" />
        </Field>
        <Field label="الشيخ">
          <select className="adm-select" value={form.sheikh_id || ""} onChange={e => set("sheikh_id", e.target.value)}>
            <option value="">اختر الشيخ (اختياري)</option>
            {sheikhs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <FieldRow>
          <Field label="التصنيف">
            <select className="adm-select" value={form.category || ""} onChange={e => set("category", e.target.value)}>
              <option value="">اختر التصنيف</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="المحافظة">
            <select className="adm-select" value={form.city || ""} onChange={e => set("city", e.target.value)}>
              <option value="">اختر المحافظة</option>
              {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="نوع المكان">
            <select className="adm-select" value={form.venue_type || "مسجد"} onChange={e => set("venue_type", e.target.value)}>
              {VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="اسم المكان">
            <input className="adm-input" value={form.mosque || ""} onChange={e => set("mosque", e.target.value)} placeholder={form.venue_type === "مسجد" ? "مسجد الرحمة" : form.venue_type === "ديوان" ? "ديوان آل فلان" : form.venue_type === "مجلس" ? "مجلس الشيخ فلان" : "اسم المكان"} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="المنطقة">
            <input className="adm-input" value={form.region || ""} onChange={e => set("region", e.target.value)} placeholder="مثال: الصديق" />
          </Field>
          <Field label="اسم الشيخ (إن لم يُربط بحساب)">
            <input className="adm-input" value={form.speaker_name || ""} onChange={e => set("speaker_name", e.target.value)} placeholder="مثال: عبدالله الأنصاري" />
            {looksLikeTopic(form.speaker_name) && (
              <div className="les-topic-warn">
                <AlertTriangle size={13} className="inline ml-1" />يبدو أن هذا موضوع وليس اسم شيخ. يُرجى التأكد من إدخال الاسم الصحيح.
              </div>
            )}
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="الجمهور المستهدف">
            <select className="adm-select" value={form.audience} onChange={e => set("audience", e.target.value)}>
              {AUDIENCE.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="طريقة الحضور">
            <select className="adm-select" value={form.delivery} onChange={e => set("delivery", e.target.value)}>
              {DELIVERY.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        </FieldRow>
        <Field label="أيام الدرس (يمكن اختيار أكثر من يوم)">
          <div className="les-days-row">
            {WEEK_DAYS.map(d => {
              const selected = Array.isArray(form.days_of_week) && form.days_of_week.includes(d);
              return (
                <label key={d} className={`les-day-label${selected ? " les-day-label--active" : ""}`}>
                  <input
                    type="checkbox"
                    className="les-day-checkbox"
                    checked={selected}
                    onChange={e => {
                      const cur: string[] = Array.isArray(form.days_of_week) ? form.days_of_week : [];
                      set("days_of_week", e.target.checked ? [...cur, d] : cur.filter(x => x !== d));
                    }}
                  />
                  {d}
                </label>
              );
            })}
          </div>
          {Array.isArray(form.days_of_week) && form.days_of_week.length > 1 && (
            <div className="les-days-note">
              الدرس يتكرر كل: {form.days_of_week.join(" و")}
            </div>
          )}
        </Field>
        <Field label="تاريخ الانتهاء (اختياري)">
          <input type="date" className="adm-input" value={form.end_date || ""} onChange={e => set("end_date", e.target.value || null)} />
        </Field>
        <FieldRow>
          <Field label="الجدول الزمني">
            <input className="adm-input" value={form.schedule || ""} onChange={e => set("schedule", e.target.value)} placeholder="كل اثنين بعد العشاء" />
          </Field>
          <Field label="وقت الدرس">
            <input
              type="time"
              className="adm-input"
              value={form.lesson_time || ""}
              onChange={e => { set("lesson_time", e.target.value); setOrigTime(null); }}
            />
            {origTime && (
              <span className="les-time-note">
                {form.lesson_time
                  ? `القيمة السابقة «${origTime}» حُوِّلت تلقائياً — عدّلها إن احتجت`
                  : `القيمة السابقة «${origTime}» — تعذّر تحويلها، حدّد الوقت من المنتقي`}
              </span>
            )}
          </Field>
        </FieldRow>
        <Field label="الوصف">
          <textarea className="adm-textarea" value={form.description || ""} onChange={e => set("description", e.target.value)} placeholder="وصف موجز للدرس أو الدورة..." />
        </Field>
        <Field label="الحالة">
          <select className="adm-select" value={form.status} onChange={e => set("status", e.target.value)}>
            {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
