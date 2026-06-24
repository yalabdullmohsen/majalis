import { useEffect, useState } from "react";
import { adminDeletePrayerTime, adminGetPrayerTimesRows, adminUpsertPrayerTime } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt } from "./AdminModal";

const EMPTY: any = {
  city: "الكويت", governorate: "محافظة العاصمة", date: new Date().toISOString().slice(0, 10),
  fajr: "", sunrise: "", dhuhr: "", asr: "", maghrib: "", isha: "",
};

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

export function PrayerTimesSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetPrayerTimesRows().then(({ data }) => { setItems(data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (item: any) => { setForm({ ...EMPTY, ...item }); setOpen(true); };
  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد الحذف؟")) return;
    await adminDeletePrayerTime(id);
    load();
  };
  const handleSave = async () => {
    if (!form.date) return alert("التاريخ مطلوب");
    setSaving(true);
    await adminUpsertPrayerTime(form);
    setSaving(false);
    setOpen(false);
    load();
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>مواقيت الصلاة ({items.length})</h2>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.82rem", color: C.inkSoft }}>جدول احتياطي عند تعذّر الربط الخارجي — المصدر الأساسي AlAdhan API.</p>
        </div>
        <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة يوم</button>
      </div>

      {loading ? <Loading /> : items.length === 0 ? (
        <p style={{ color: C.inkSoft, fontSize: "0.88rem" }}>لا توجد سجلات — يُستخدم API تلقائياً.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["التاريخ", "المدينة", "الفجر", "الظهر", "العصر", "المغرب", "العشاء", "إجراءات"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 700, color: C.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{r.date}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{r.city}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{r.fajr}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{r.dhuhr}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{r.asr}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{r.maghrib}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{r.isha}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>
                    <button style={BTN_EDIT} onClick={() => openEdit(r)}>تعديل</button>
                    {" "}
                    <button style={BTN_DEL} onClick={() => handleDelete(r.id)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <AdminModal title={form.id ? "تعديل مواقيت" : "إضافة مواقيت"} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          <FieldRow>
            <Field label="التاريخ *"><input style={inputSt} type="date" value={form.date?.slice(0, 10) || ""} onChange={(e) => set("date", e.target.value)} /></Field>
            <Field label="المدينة"><input style={inputSt} value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></Field>
          </FieldRow>
          <Field label="المحافظة"><input style={inputSt} value={form.governorate || ""} onChange={(e) => set("governorate", e.target.value)} /></Field>
          <FieldRow>
            <Field label="الفجر"><input style={inputSt} value={form.fajr || ""} onChange={(e) => set("fajr", e.target.value)} placeholder="05:12" /></Field>
            <Field label="الشروق"><input style={inputSt} value={form.sunrise || ""} onChange={(e) => set("sunrise", e.target.value)} /></Field>
          </FieldRow>
          <FieldRow>
            <Field label="الظهر"><input style={inputSt} value={form.dhuhr || ""} onChange={(e) => set("dhuhr", e.target.value)} /></Field>
            <Field label="العصر"><input style={inputSt} value={form.asr || ""} onChange={(e) => set("asr", e.target.value)} /></Field>
          </FieldRow>
          <FieldRow>
            <Field label="المغرب"><input style={inputSt} value={form.maghrib || ""} onChange={(e) => set("maghrib", e.target.value)} /></Field>
            <Field label="العشاء"><input style={inputSt} value={form.isha || ""} onChange={(e) => set("isha", e.target.value)} /></Field>
          </FieldRow>
        </AdminModal>
      )}
    </div>
  );
}
