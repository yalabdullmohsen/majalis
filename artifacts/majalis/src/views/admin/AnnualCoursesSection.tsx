import { useEffect, useState } from "react";
import { adminGetAllAnnualCourses, adminUpsertAnnualCourse, adminDeleteAnnualCourse } from "@/lib/platform-supabase";
import { ANNUAL_COURSES_SEED } from "@/lib/annual-courses-seed";
import { COURSE_TYPES } from "@/lib/platform-types";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { useAdminShell } from "./AdminShell";

const EMPTY = { title: "", summary: "", body: "", course_type: "سنوية", venue_city: "", registration_open: true, status: "approved" };

export function AnnualCoursesSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); adminGetAllAnnualCourses().then(({ data }) => {  const rows = data ?? []; setItems(rows.length > 0 ? rows : ANNUAL_COURSES_SEED); setLoading(false);  }).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep }}>الدورات العلمية ({items.length})</h2>
        <button onClick={() => { setForm({ ...EMPTY }); setOpen(true); }} style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>+ إضافة</button>
      </div>
      {loading ? <Loading /> : items.map((item, idx) => (
        <div key={item.id ?? item.title ?? idx} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}>
          <strong>{item.title}</strong> — {item.course_type}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button onClick={() => { setForm({ ...item }); setOpen(true); }} style={{ fontSize: "0.75rem" }}>تعديل</button>
            <button onClick={() => { if (!item.id) return; if (confirm("حذف؟")) adminDeleteAnnualCourse(item.id).then(load); }} style={{ fontSize: "0.75rem", color: "#dc2626" }}>حذف</button>
          </div>
        </div>
      ))}
      <AdminModal open={open} onClose={() => setOpen(false)} title="دورة علمية" onSave={async () => {
        if (!form.title?.trim()) return showError("العنوان مطلوب");
        setSaving(true);
        const { error } = await adminUpsertAnnualCourse(form);
        setSaving(false);
        if (error) return showError(error.message);
        showSuccess("تم الحفظ"); setOpen(false); load();
      }} saving={saving}>
        <Field label="العنوان"><input className="adm-input" value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="النوع"><select className="adm-select" value={form.course_type} onChange={(e) => set("course_type", e.target.value)}>{COURSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="الملخص"><textarea className="adm-textarea" value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="التفاصيل"><textarea className="adm-textarea" value={form.body || ""} onChange={(e) => set("body", e.target.value)} rows={4} /></Field>
        <Field label="الموسم"><input className="adm-input" value={form.season || ""} onChange={(e) => set("season", e.target.value)} /></Field>
        <Field label="السنة"><input className="adm-input" type="number" value={form.year || ""} onChange={(e) => set("year", Number(e.target.value))} /></Field>
        <Field label="المكان"><input className="adm-input" value={form.venue_name || ""} onChange={(e) => set("venue_name", e.target.value)} /></Field>
        <Field label="المدينة"><input className="adm-input" value={form.venue_city || ""} onChange={(e) => set("venue_city", e.target.value)} /></Field>
        <Field label="رابط التسجيل"><input className="adm-input" value={form.registration_url || ""} onChange={(e) => set("registration_url", e.target.value)} /></Field>
        <Field label="الحالة"><select className="adm-select" value={form.status || "approved"} onChange={(e) => set("status", e.target.value)}><option value="approved">منشور</option><option value="pending">معلّق</option></select></Field>
      </AdminModal>
    </div>
  );
}
