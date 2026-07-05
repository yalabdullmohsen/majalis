import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminGetAllLessons, adminUpsertLesson, adminDeleteLesson, adminGetSheikhs, upsertSeedLessonsToDb } from "@/lib/supabase";
import { parseTimeToMinutes } from "@/lib/lesson-time";
import { invalidateLessonsCache } from "@/lib/lessons-service";
import { sanitizeText } from "@/lib/sanitize";
import { C, GOVERNORATES } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { adminListLoad } from "@/lib/admin-list-load";
import { AdminModal, Field, FieldRow, inputSt, selectSt, textareaSt } from "./AdminModal";
import { BulkImport } from "./BulkImport";

const CATEGORIES = ["تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "أخرى"];
const VENUE_TYPES = ["مسجد", "مجلس", "ديوان", "مزرعة", "استراحة", "مركز", "جامعة", "أخرى"] as const;
const WEEK_DAYS   = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"] as const;

// كلمات تدل على موضوع/عنوان وليس اسم شيخ
const TOPIC_HINT_RE = /^(فضل|حكم|أحكام|شرح|تفسير|أصول|أحاديث|السيرة|الفقه|العقيدة|كتاب|موضوع|بحث|أهمية|منهج|آداب|مسائل|فوائد|دروس|حقوق|واجبات|أساسيات)/u;

function looksLikeTopic(name: string): boolean {
  if (!name.trim()) return false;
  return TOPIC_HINT_RE.test(name.trim());
}

/** استخراج نوع المكان واسمه من قيمة حقل mosque المخزَّنة */
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
  approved: { bg: "#D1FAE5", text: C.emeraldDeep },
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

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

/** تحويل نص الوقت العربي إلى صيغة HH:MM لمنتقي الوقت */
function toHHMM(raw: string): string {
  if (!raw?.trim()) return "";
  // إذا كانت الصيغة HH:MM أو H:MM مسبقاً
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
      // RLS منع الحذف صامتاً (لم يُحذف أي صف) — غالباً صلاحية المشرف غير مُفعّلة على الخادم
      alert("لم يُحذف الدرس. تأكّد أنك مسجّل الدخول بحساب مشرف معتمد؛ إن استمرّت المشكلة فصلاحية الإشراف قد تكون غير مُفعّلة على مستوى قاعدة البيانات.");
      return;
    }
    invalidateLessonsCache();
    load();
  };
  const handleSave = async () => {
    if (!form.title.trim()) return alert("عنوان الدرس مطلوب");
    setSaving(true);
    // دمج نوع المكان مع اسمه في حقل mosque
    const venueName = (form.mosque || "").trim();
    const combinedMosque = form.venue_type && form.venue_type !== "مسجد" && venueName
      ? `${form.venue_type} — ${venueName}`
      : venueName;
    // تحويل مصفوفة الأيام إلى نص مفصول بـ ،
    const dayOfWeek = Array.isArray(form.days_of_week) && form.days_of_week.length > 0
      ? form.days_of_week.join("،")
      : "";
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>الدروس ({items.length})</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
          <Link
            href="/admin/sources"
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", background: "rgba(14,110,82,0.08)", color: "#0E6E52", textDecoration: "none", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600, display: "inline-flex", alignItems: "center" }}
          >
            أتمتة المصادر
          </Link>
          <Link
            href="/admin/review-center"
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", background: "#FCE7F3", color: "#9D174D", textDecoration: "none", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600, display: "inline-flex", alignItems: "center" }}
          >
            مركز المراجعة
          </Link>
          <Link
            href="/admin/content-import/image"
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", background: "#DBEAFE", color: "#1D4ED8", textDecoration: "none", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600, display: "inline-flex", alignItems: "center" }}
          >
            إضافة درس من صورة
          </Link>
          <Link
            href="/admin/content-import/url"
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", background: "#EDE9FE", color: "#5B21B6", textDecoration: "none", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600, display: "inline-flex", alignItems: "center" }}
          >
            إضافة درس من رابط
          </Link>
          <button
            onClick={handleSyncSeed}
            disabled={syncing}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", background: "#F0FDF4", color: C.emeraldDeep, border: `1px solid ${C.emerald}`, cursor: syncing ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600, opacity: syncing ? 0.6 : 1 }}
          >
            {syncing ? "جاري المزامنة…" : "⬆ مزامنة الكتالوج مع DB"}
          </button>
          <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة درس</button>
        </div>
      </div>
      {syncMsg && (
        <div style={{ marginBottom: "0.75rem", padding: "0.5rem 0.875rem", borderRadius: "0.375rem", background: syncMsg.startsWith("✓") ? "#D1FAE5" : "#FEE2E2", color: syncMsg.startsWith("✓") ? C.emeraldDeep : "#991B1B", fontSize: "0.875rem", fontWeight: 600 }}>
          {syncMsg}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في الدروس..." style={{ ...inputSt, maxWidth: "20rem", flex: "1 1 12rem" }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...selectSt, width: "auto" }}>
          <option value="all">كل الحالات</option>
          {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["العنوان", "الشيخ", "التصنيف", "المحافظة", "الحضور", "الحالة", "إجراءات"].map(h => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", color: C.emeraldDeep, fontWeight: 700, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const sc = STATUS_COLORS[item.status] || { bg: C.parchmentDeep, text: C.inkSoft };
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.ink, fontWeight: 600, maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
                      {item.sheikhs?.name || (item.speaker_name ? (
                        <span>
                          {item.speaker_name}
                          {looksLikeTopic(item.speaker_name) && (
                            <span title="يبدو أن هذا موضوع وليس اسم شيخ" style={{ marginRight: "0.3rem", cursor: "help" }}>⚠️</span>
                          )}
                        </span>
                      ) : "—")}
                    </td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft }}>{item.category || "—"}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft }}>{item.city || "—"}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>{item.delivery || "—"}</td>
                    <td style={{ padding: "0.625rem 0.75rem" }}>
                      <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: sc.bg, color: sc.text, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                        {STATUSES[item.status] || item.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.625rem 0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        <button onClick={() => openEdit(item)} style={BTN_EDIT}>تعديل</button>
                        <button onClick={() => handleDelete(item.id, item.title)} style={BTN_DEL}>حذف</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem" }}>{search || statusFilter !== "all" ? "لا توجد دروس مطابقة" : "لا توجد دروس — ابدأ بإضافة أول درس"}</p>}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل الدرس" : "إضافة درس جديد"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="عنوان الدرس *">
          <input style={inputSt} value={form.title} onChange={e => set("title", e.target.value)} placeholder="عنوان الدرس أو الدورة" />
        </Field>
        <Field label="الشيخ">
          <select style={selectSt} value={form.sheikh_id || ""} onChange={e => set("sheikh_id", e.target.value)}>
            <option value="">اختر الشيخ (اختياري)</option>
            {sheikhs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <FieldRow>
          <Field label="التصنيف">
            <select style={selectSt} value={form.category || ""} onChange={e => set("category", e.target.value)}>
              <option value="">اختر التصنيف</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="المحافظة">
            <select style={selectSt} value={form.city || ""} onChange={e => set("city", e.target.value)}>
              <option value="">اختر المحافظة</option>
              {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="نوع المكان">
            <select style={selectSt} value={form.venue_type || "مسجد"} onChange={e => set("venue_type", e.target.value)}>
              {VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="اسم المكان">
            <input style={inputSt} value={form.mosque || ""} onChange={e => set("mosque", e.target.value)} placeholder={form.venue_type === "مسجد" ? "مسجد الرحمة" : form.venue_type === "ديوان" ? "ديوان آل فلان" : form.venue_type === "مجلس" ? "مجلس الشيخ فلان" : "اسم المكان"} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="المنطقة">
            <input style={inputSt} value={form.region || ""} onChange={e => set("region", e.target.value)} placeholder="مثال: الصديق" />
          </Field>
          <Field label="اسم الشيخ (إن لم يُربط بحساب)">
            <input style={inputSt} value={form.speaker_name || ""} onChange={e => set("speaker_name", e.target.value)} placeholder="مثال: عبدالله الأنصاري" />
            {looksLikeTopic(form.speaker_name) && (
              <div style={{ marginTop: "0.3rem", padding: "0.35rem 0.6rem", borderRadius: "0.35rem", background: "rgba(14,110,82,0.08)", color: "#0E6E52", fontSize: "0.75rem", fontWeight: 600 }}>
                ⚠️ يبدو أن هذا موضوع وليس اسم شيخ. يُرجى التأكد من إدخال الاسم الصحيح.
              </div>
            )}
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="الجمهور المستهدف">
            <select style={selectSt} value={form.audience} onChange={e => set("audience", e.target.value)}>
              {AUDIENCE.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="طريقة الحضور">
            <select style={selectSt} value={form.delivery} onChange={e => set("delivery", e.target.value)}>
              {DELIVERY.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        </FieldRow>
        <Field label="أيام الدرس (يمكن اختيار أكثر من يوم)">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", padding: "0.5rem 0" }}>
            {WEEK_DAYS.map(d => {
              const selected = Array.isArray(form.days_of_week) && form.days_of_week.includes(d);
              return (
                <label key={d} style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontSize: "0.875rem", color: selected ? C.emeraldDeep : C.ink, fontWeight: selected ? 700 : 400 }}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={e => {
                      const cur: string[] = Array.isArray(form.days_of_week) ? form.days_of_week : [];
                      set("days_of_week", e.target.checked ? [...cur, d] : cur.filter(x => x !== d));
                    }}
                    style={{ accentColor: C.emerald, width: "1rem", height: "1rem" }}
                  />
                  {d}
                </label>
              );
            })}
          </div>
          {Array.isArray(form.days_of_week) && form.days_of_week.length > 1 && (
            <div style={{ marginTop: "0.35rem", fontSize: "0.75rem", color: C.inkSoft }}>
              الدرس يتكرر كل: {form.days_of_week.join(" و")}
            </div>
          )}
        </Field>
        <Field label="تاريخ الانتهاء (اختياري)">
          <input type="date" style={inputSt} value={form.end_date || ""} onChange={e => set("end_date", e.target.value || null)} />
        </Field>
        <FieldRow>
          <Field label="الجدول الزمني">
            <input style={inputSt} value={form.schedule || ""} onChange={e => set("schedule", e.target.value)} placeholder="كل اثنين بعد العشاء" />
          </Field>
          <Field label="وقت الدرس">
            <input
              type="time"
              style={inputSt}
              value={form.lesson_time || ""}
              onChange={e => { set("lesson_time", e.target.value); setOrigTime(null); }}
            />
            {origTime && (
              <span style={{ display: "block", marginTop: "0.3rem", fontSize: "0.72rem", color: "#6b6460" }}>
                {form.lesson_time
                  ? `القيمة السابقة «${origTime}» حُوِّلت تلقائياً — عدّلها إن احتجت`
                  : `القيمة السابقة «${origTime}» — تعذّر تحويلها، حدّد الوقت من المنتقي`}
              </span>
            )}
          </Field>
        </FieldRow>
        <Field label="الوصف">
          <textarea style={textareaSt} value={form.description || ""} onChange={e => set("description", e.target.value)} placeholder="وصف موجز للدرس أو الدورة..." />
        </Field>
        <Field label="الحالة">
          <select style={selectSt} value={form.status} onChange={e => set("status", e.target.value)}>
            {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
